import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocket, WebSocketServer } from 'ws';
import { Card, GameState, PlayerPublic, TurnPhase, ChatMessage, ReactionEvent } from './src/types/rummy.js';
import { createRummyDeck, evaluateFullHand, isWildJoker, getCardPoints, autoGroupCards } from './src/utils/rummyRules.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3000;

interface InternalPlayer {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isBot: boolean;
  isReady: boolean;
  cards: Card[];
  score: number;
  totalScore: number;
  hasDropped: boolean;
  dropType?: 'first' | 'middle';
  status: 'waiting' | 'ready' | 'playing' | 'dropped' | 'declared';
  lastAction?: string;
  declaredGroups?: Card[][];
}

interface Room {
  id: string;
  name: string;
  hostId: string;
  maxPlayers: number;
  status: 'lobby' | 'playing' | 'round_end' | 'game_over';
  players: InternalPlayer[];
  closedDeck: Card[];
  discardPile: Card[];
  wildJokerCard: Card | null;
  currentTurnPlayerId: string | null;
  turnPhase: TurnPhase;
  turnTimeLimit: number;
  turnTimeRemaining: number;
  timerInterval: NodeJS.Timeout | null;
  roundNumber: number;
  winnerId: string | null;
  winMessage?: string;
  lastDiscarder?: string;
  messages: ChatMessage[];
}

const rooms = new Map<string, Room>();
const clientSockets = new Map<string, WebSocket>(); // playerId -> ws
const socketToPlayer = new Map<WebSocket, { playerId: string; roomId: string }>();

const BOT_NAMES = ['Vikram Rummy', 'Sophia Ace', 'Raj Maestro', 'Elena Queen', 'Arjun Star'];
const BOT_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
];

function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function broadcastToRoom(room: Room, event: string, payload: unknown, targetPlayerId?: string) {
  for (const player of room.players) {
    if (player.isBot) continue;
    if (targetPlayerId && player.id !== targetPlayerId) continue;

    const ws = clientSockets.get(player.id);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ event, payload }));
    }
  }
}

function getPublicGameState(room: Room, forPlayerId?: string): { gameState: GameState; myCards: Card[] } {
  const playersPublic: PlayerPublic[] = room.players.map(p => ({
    id: p.id,
    name: p.name,
    avatar: p.avatar,
    isHost: p.isHost,
    isBot: p.isBot,
    isReady: p.isReady,
    isTurn: room.currentTurnPlayerId === p.id,
    cardCount: p.cards.length,
    score: p.score,
    totalScore: p.totalScore,
    hasDropped: p.hasDropped,
    status: p.status,
    lastAction: p.lastAction,
    declaredGroups: room.status === 'round_end' || room.status === 'game_over' ? p.declaredGroups : undefined,
  }));

  const targetPlayer = room.players.find(p => p.id === forPlayerId);
  const myCards = targetPlayer ? targetPlayer.cards : [];

  return {
    gameState: {
      roomId: room.id,
      roomName: room.name,
      hostId: room.hostId,
      maxPlayers: room.maxPlayers,
      status: room.status,
      players: playersPublic,
      currentTurnPlayerId: room.currentTurnPlayerId,
      turnPhase: room.turnPhase,
      turnTimeLimit: room.turnTimeLimit,
      turnTimeRemaining: room.turnTimeRemaining,
      wildJokerCard: room.wildJokerCard,
      discardPile: room.discardPile.slice(-5), // last 5 cards for UI preview
      drawPileCount: room.closedDeck.length,
      roundNumber: room.roundNumber,
      winnerId: room.winnerId,
      winMessage: room.winMessage,
      lastDiscarder: room.lastDiscarder,
    },
    myCards,
  };
}

function syncRoom(room: Room) {
  for (const player of room.players) {
    if (player.isBot) continue;
    const { gameState, myCards } = getPublicGameState(room, player.id);
    broadcastToRoom(room, 'room_state', { gameState, myCards }, player.id);
  }
}

function startTurnTimer(room: Room) {
  if (room.timerInterval) {
    clearInterval(room.timerInterval);
    room.timerInterval = null;
  }

  room.turnTimeRemaining = room.turnTimeLimit;

  room.timerInterval = setInterval(() => {
    room.turnTimeRemaining -= 1;

    // Send heartbeat tick every second to keep clocks synchronized
    broadcastToRoom(room, 'timer_tick', {
      turnTimeRemaining: room.turnTimeRemaining,
      currentTurnPlayerId: room.currentTurnPlayerId,
    });

    if (room.turnTimeRemaining <= 0) {
      if (room.timerInterval) clearInterval(room.timerInterval);
      room.timerInterval = null;
      handleTurnTimeout(room);
    }
  }, 1000);
}

function handleTurnTimeout(room: Room) {
  const currentPlayer = room.players.find(p => p.id === room.currentTurnPlayerId);
  if (!currentPlayer || room.status !== 'playing') return;

  // If player hasn't drawn yet, auto draw from closed deck
  if (room.turnPhase === 'draw') {
    if (room.closedDeck.length > 0) {
      const drawn = room.closedDeck.pop()!;
      currentPlayer.cards.push(drawn);
    }
    room.turnPhase = 'discard';
  }

  // Auto discard the newest or highest unmelded card
  if (currentPlayer.cards.length > 13) {
    const cardToDiscard = currentPlayer.cards[currentPlayer.cards.length - 1];
    currentPlayer.cards = currentPlayer.cards.filter(c => c.id !== cardToDiscard.id);
    room.discardPile.push(cardToDiscard);
    room.lastDiscarder = currentPlayer.name;
    currentPlayer.lastAction = 'Auto-discarded on timeout';
  }

  nextTurn(room);
}

function dealNewRound(room: Room) {
  room.status = 'playing';
  room.winnerId = null;
  room.winMessage = undefined;
  room.roundNumber += 1;

  const fullDeck = createRummyDeck();
  
  // Reset players
  for (const p of room.players) {
    p.cards = [];
    p.hasDropped = false;
    p.dropType = undefined;
    p.status = 'playing';
    p.lastAction = undefined;
    p.declaredGroups = undefined;
  }

  // Deal 13 cards to each player
  for (let i = 0; i < 13; i++) {
    for (const p of room.players) {
      if (fullDeck.length > 0) {
        p.cards.push(fullDeck.pop()!);
      }
    }
  }

  // Pick Wild Joker card
  room.wildJokerCard = fullDeck.pop() || null;

  // Open first discard card
  room.discardPile = [fullDeck.pop()!];
  room.closedDeck = fullDeck;
  room.lastDiscarder = 'Dealer';

  // Choose starting turn
  const activePlayers = room.players.filter(p => !p.hasDropped);
  const startingPlayer = activePlayers[Math.floor(Math.random() * activePlayers.length)];
  room.currentTurnPlayerId = startingPlayer ? startingPlayer.id : room.players[0].id;
  room.turnPhase = 'draw';

  syncRoom(room);
  startTurnTimer(room);

  // Trigger bot if starting player is bot
  checkBotTurn(room);
}

function nextTurn(room: Room) {
  const activePlayers = room.players.filter(p => !p.hasDropped && p.status !== 'dropped');

  // If only 1 player remains, they win by default!
  if (activePlayers.length === 1) {
    endRound(room, activePlayers[0].id, `${activePlayers[0].name} wins! All other players dropped.`);
    return;
  }

  // Find index of current turn player
  const currentIndex = room.players.findIndex(p => p.id === room.currentTurnPlayerId);
  let nextIndex = (currentIndex + 1) % room.players.length;

  while (room.players[nextIndex].hasDropped || room.players[nextIndex].status === 'dropped') {
    nextIndex = (nextIndex + 1) % room.players.length;
  }

  room.currentTurnPlayerId = room.players[nextIndex].id;
  room.turnPhase = 'draw';

  syncRoom(room);
  startTurnTimer(room);
  checkBotTurn(room);
}

function checkBotTurn(room: Room) {
  const current = room.players.find(p => p.id === room.currentTurnPlayerId);
  if (!current || !current.isBot || room.status !== 'playing') return;

  // Human-like delay
  setTimeout(() => {
    if (room.status !== 'playing' || room.currentTurnPlayerId !== current.id) return;

    // Bot Draw Phase
    const topDiscard = room.discardPile[room.discardPile.length - 1];
    let drewFromDiscard = false;

    // Smart bot logic: Draw from discard if it matches rank of natural cards or completes sequence
    if (topDiscard && room.wildJokerCard) {
      const isJoker = isWildJoker(topDiscard, room.wildJokerCard);
      const matchesRank = current.cards.some(c => c.rank === topDiscard.rank);
      if (isJoker || matchesRank) {
        current.cards.push(room.discardPile.pop()!);
        drewFromDiscard = true;
        current.lastAction = 'Drew from Discard';
      }
    }

    if (!drewFromDiscard) {
      if (room.closedDeck.length === 0 && room.discardPile.length > 1) {
        // Reshuffle discard into closed deck
        const top = room.discardPile.pop()!;
        room.closedDeck = room.discardPile.sort(() => Math.random() - 0.5);
        room.discardPile = [top];
      }
      if (room.closedDeck.length > 0) {
        current.cards.push(room.closedDeck.pop()!);
        current.lastAction = 'Drew from Closed Deck';
      }
    }

    room.turnPhase = 'discard';
    syncRoom(room);

    // Bot Discard Phase after 1.5s
    setTimeout(() => {
      if (room.status !== 'playing' || room.currentTurnPlayerId !== current.id) return;

      // Group bot cards
      const autoGroups = autoGroupCards(current.cards, room.wildJokerCard);
      const evalResult = evaluateFullHand(autoGroups, room.wildJokerCard);

      // Check if bot can declare and win!
      if (evalResult.isValidDeclaration && current.cards.length === 14) {
        // Find 1 card to discard for finish
        const discardCard = current.cards[current.cards.length - 1];
        current.cards = current.cards.filter(c => c.id !== discardCard.id);
        room.discardPile.push(discardCard);
        current.declaredGroups = autoGroups;
        endRound(room, current.id, `${current.name} Declared & Won!`);
        return;
      }

      // Otherwise pick worst card to discard (highest point unmelded card)
      let candidate = current.cards[current.cards.length - 1];
      let maxPoints = -1;

      // Sort candidate unmelded cards
      for (const card of current.cards) {
        if (!isWildJoker(card, room.wildJokerCard)) {
          const pts = getCardPoints(card, room.wildJokerCard);
          if (pts > maxPoints) {
            maxPoints = pts;
            candidate = card;
          }
        }
      }

      current.cards = current.cards.filter(c => c.id !== candidate.id);
      room.discardPile.push(candidate);
      room.lastDiscarder = current.name;
      current.lastAction = `Discarded ${candidate.rank} of ${candidate.suit}`;

      nextTurn(room);
    }, 1500);
  }, 1200);
}

function endRound(room: Room, winnerId: string, winMessage: string) {
  if (room.timerInterval) {
    clearInterval(room.timerInterval);
    room.timerInterval = null;
  }

  room.status = 'round_end';
  room.winnerId = winnerId;
  room.winMessage = winMessage;

  // Calculate scores for all players
  for (const player of room.players) {
    if (player.id === winnerId) {
      player.score = 0;
      player.status = 'declared';
      if (!player.declaredGroups) {
        player.declaredGroups = autoGroupCards(player.cards, room.wildJokerCard);
      }
    } else if (player.hasDropped) {
      player.score = player.dropType === 'middle' ? 40 : 20;
      player.totalScore += player.score;
      player.declaredGroups = autoGroupCards(player.cards, room.wildJokerCard);
    } else {
      // Evaluate hand
      const groups = autoGroupCards(player.cards, room.wildJokerCard);
      player.declaredGroups = groups;
      const evaluation = evaluateFullHand(groups, room.wildJokerCard);
      player.score = evaluation.totalPoints;
      player.totalScore += player.score;
    }
  }

  syncRoom(room);
  broadcastToRoom(room, 'round_finished', {
    winnerId,
    winMessage,
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      score: p.score,
      totalScore: p.totalScore,
      cards: p.cards,
      declaredGroups: p.declaredGroups,
    })),
  });
}

// WebSocket Connection Handlers
wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      const { type, payload } = message;

      switch (type) {
        case 'join_room': {
          const { roomId, playerId, playerName, avatar } = payload;
          let room = rooms.get(roomId);

          if (!room) {
            // Auto create room if doesn't exist
            room = {
              id: roomId,
              name: `Table ${roomId}`,
              hostId: playerId,
              maxPlayers: 4,
              status: 'lobby',
              players: [],
              closedDeck: [],
              discardPile: [],
              wildJokerCard: null,
              currentTurnPlayerId: null,
              turnPhase: 'waiting',
              turnTimeLimit: 30,
              turnTimeRemaining: 30,
              timerInterval: null,
              roundNumber: 0,
              winnerId: null,
              messages: [],
            };
            rooms.set(roomId, room);
          }

          // Register socket
          clientSockets.set(playerId, ws);
          socketToPlayer.set(ws, { playerId, roomId });

          let existingPlayer = room.players.find(p => p.id === playerId);
          if (!existingPlayer) {
            if (room.players.length >= room.maxPlayers) {
              ws.send(JSON.stringify({ event: 'error', payload: 'Room is full!' }));
              return;
            }

            existingPlayer = {
              id: playerId,
              name: playerName || 'Player',
              avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
              isHost: room.players.length === 0,
              isBot: false,
              isReady: true,
              cards: [],
              score: 0,
              totalScore: 0,
              hasDropped: false,
              status: room.status === 'playing' ? 'playing' : 'ready',
            };
            room.players.push(existingPlayer);
          } else {
            // Reconnected
            existingPlayer.name = playerName || existingPlayer.name;
          }

          // If game is in progress and reconnected, they will get full game state
          syncRoom(room);
          break;
        }

        case 'add_bot': {
          const mapping = socketToPlayer.get(ws);
          if (!mapping) return;
          const room = rooms.get(mapping.roomId);
          if (!room || room.players.length >= room.maxPlayers) return;

          const botIndex = room.players.filter(p => p.isBot).length;
          const botName = BOT_NAMES[botIndex % BOT_NAMES.length];
          const botAvatar = BOT_AVATARS[botIndex % BOT_AVATARS.length];

          const botPlayer: InternalPlayer = {
            id: `bot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            name: botName,
            avatar: botAvatar,
            isHost: false,
            isBot: true,
            isReady: true,
            cards: [],
            score: 0,
            totalScore: 0,
            hasDropped: false,
            status: 'ready',
          };

          room.players.push(botPlayer);
          syncRoom(room);
          break;
        }

        case 'remove_bot': {
          const mapping = socketToPlayer.get(ws);
          if (!mapping) return;
          const room = rooms.get(mapping.roomId);
          if (!room || room.status !== 'lobby') return;

          const botIdx = room.players.findIndex(p => p.id === payload.botId && p.isBot);
          if (botIdx !== -1) {
            room.players.splice(botIdx, 1);
            syncRoom(room);
          }
          break;
        }

        case 'start_game': {
          const mapping = socketToPlayer.get(ws);
          if (!mapping) return;
          const room = rooms.get(mapping.roomId);
          if (!room || room.players.length < 2) {
            ws.send(JSON.stringify({ event: 'error', payload: 'Need at least 2 players to start! Add an AI Bot or invite a friend.' }));
            return;
          }

          dealNewRound(room);
          break;
        }

        case 'draw_card': {
          const mapping = socketToPlayer.get(ws);
          if (!mapping) return;
          const room = rooms.get(mapping.roomId);
          if (!room || room.status !== 'playing' || room.currentTurnPlayerId !== mapping.playerId) return;
          if (room.turnPhase !== 'draw') return;

          const player = room.players.find(p => p.id === mapping.playerId);
          if (!player) return;

          const source = payload.source; // 'closed' or 'open'
          let drawnCard: Card | null = null;

          if (source === 'open' && room.discardPile.length > 0) {
            drawnCard = room.discardPile.pop()!;
            player.lastAction = 'Drew from Discard Pile';
          } else if (source === 'closed') {
            if (room.closedDeck.length === 0 && room.discardPile.length > 1) {
              const top = room.discardPile.pop()!;
              room.closedDeck = room.discardPile.sort(() => Math.random() - 0.5);
              room.discardPile = [top];
            }
            if (room.closedDeck.length > 0) {
              drawnCard = room.closedDeck.pop()!;
              player.lastAction = 'Drew from Closed Deck';
            }
          }

          if (drawnCard) {
            player.cards.push(drawnCard);
            room.turnPhase = 'discard';
            syncRoom(room);
          }
          break;
        }

        case 'discard_card': {
          const mapping = socketToPlayer.get(ws);
          if (!mapping) return;
          const room = rooms.get(mapping.roomId);
          if (!room || room.status !== 'playing' || room.currentTurnPlayerId !== mapping.playerId) return;
          if (room.turnPhase !== 'discard') return;

          const player = room.players.find(p => p.id === mapping.playerId);
          if (!player) return;

          const cardId = payload.cardId;
          const cardIdx = player.cards.findIndex(c => c.id === cardId);
          if (cardIdx === -1) return;

          const [discarded] = player.cards.splice(cardIdx, 1);
          room.discardPile.push(discarded);
          room.lastDiscarder = player.name;
          player.lastAction = `Discarded ${discarded.rank} of ${discarded.suit}`;

          nextTurn(room);
          break;
        }

        case 'declare_hand': {
          const mapping = socketToPlayer.get(ws);
          if (!mapping) return;
          const room = rooms.get(mapping.roomId);
          if (!room || room.status !== 'playing' || room.currentTurnPlayerId !== mapping.playerId) return;

          const player = room.players.find(p => p.id === mapping.playerId);
          if (!player) return;

          const { groups, finishCardId } = payload; // groups: Card[][], finishCardId: string
          // Remove finish card
          if (finishCardId) {
            const fIdx = player.cards.findIndex(c => c.id === finishCardId);
            if (fIdx !== -1) {
              const [finCard] = player.cards.splice(fIdx, 1);
              room.discardPile.push(finCard);
            }
          }

          const evaluation = evaluateFullHand(groups, room.wildJokerCard);
          player.declaredGroups = groups;

          if (evaluation.isValidDeclaration) {
            endRound(room, player.id, `${player.name} Won! Valid Rummy Show!`);
          } else {
            // Wrong show penalty (80 points in Indian Rummy)
            player.score = 80;
            player.totalScore += 80;
            player.hasDropped = true;
            player.status = 'dropped';
            player.lastAction = 'Wrong Declaration (-80 pts)';
            ws.send(JSON.stringify({ event: 'error', payload: `Invalid Declaration: ${evaluation.message}. Penalty: 80 points.` }));
            nextTurn(room);
          }
          break;
        }

        case 'drop_round': {
          const mapping = socketToPlayer.get(ws);
          if (!mapping) return;
          const room = rooms.get(mapping.roomId);
          if (!room || room.status !== 'playing' || room.currentTurnPlayerId !== mapping.playerId) return;

          const player = room.players.find(p => p.id === mapping.playerId);
          if (!player || player.hasDropped) return;

          const isFirstDrop = room.turnPhase === 'draw' && player.cards.length === 13;
          player.hasDropped = true;
          player.dropType = isFirstDrop ? 'first' : 'middle';
          player.status = 'dropped';
          player.score = isFirstDrop ? 20 : 40;
          player.totalScore += player.score;
          player.lastAction = `${player.name} Dropped (${player.score} pts)`;

          nextTurn(room);
          break;
        }

        case 'chat_message': {
          const mapping = socketToPlayer.get(ws);
          if (!mapping) return;
          const room = rooms.get(mapping.roomId);
          if (!room) return;

          const player = room.players.find(p => p.id === mapping.playerId);
          const chatMsg: ChatMessage = {
            id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            senderId: mapping.playerId,
            senderName: player ? player.name : 'Spectator',
            avatar: player ? player.avatar : '',
            text: payload.text.slice(0, 150),
            timestamp: Date.now(),
          };

          room.messages.push(chatMsg);
          if (room.messages.length > 50) room.messages.shift();
          broadcastToRoom(room, 'chat_message', chatMsg);
          break;
        }

        case 'send_reaction': {
          const mapping = socketToPlayer.get(ws);
          if (!mapping) return;
          const room = rooms.get(mapping.roomId);
          if (!room) return;

          const player = room.players.find(p => p.id === mapping.playerId);
          const reaction: ReactionEvent = {
            id: `react_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            senderId: mapping.playerId,
            senderName: player ? player.name : 'Player',
            emoji: payload.emoji,
            timestamp: Date.now(),
          };

          broadcastToRoom(room, 'reaction', reaction);
          break;
        }

        case 'next_round': {
          const mapping = socketToPlayer.get(ws);
          if (!mapping) return;
          const room = rooms.get(mapping.roomId);
          if (!room || room.status !== 'round_end') return;
          dealNewRound(room);
          break;
        }
      }
    } catch (err) {
      console.error('WebSocket message parsing error:', err);
    }
  });

  ws.on('close', () => {
    const mapping = socketToPlayer.get(ws);
    if (mapping) {
      clientSockets.delete(mapping.playerId);
      socketToPlayer.delete(ws);
      const room = rooms.get(mapping.roomId);
      if (room) {
        const player = room.players.find(p => p.id === mapping.playerId);
        if (player) {
          player.lastAction = 'Disconnected';
          syncRoom(room);
        }
      }
    }
  });
});

// REST Endpoints
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', activeRooms: rooms.size, timestamp: Date.now() });
});

app.get('/api/rooms', (_req, res) => {
  const roomList = Array.from(rooms.values()).map(r => ({
    id: r.id,
    name: r.name,
    playerCount: r.players.length,
    maxPlayers: r.maxPlayers,
    status: r.status,
  }));
  res.json({ rooms: roomList });
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
