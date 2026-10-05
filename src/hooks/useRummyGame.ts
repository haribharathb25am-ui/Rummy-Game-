import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, GameState, ChatMessage, ReactionEvent } from '../types/rummy.js';
import { autoGroupCards } from '../utils/rummyRules.js';
import { sounds } from '../utils/soundEffects.js';

function getOrGeneratePlayerId(): string {
  let id = localStorage.getItem('rummy_player_id');
  if (!id) {
    id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    localStorage.setItem('rummy_player_id', id);
  }
  return id;
}

export function useRummyGame() {
  const [playerId] = useState<string>(getOrGeneratePlayerId);
  const [playerName, setPlayerName] = useState<string>(() => localStorage.getItem('rummy_player_name') || 'Lucky Ace');
  const [avatar, setAvatar] = useState<string>(
    () => localStorage.getItem('rummy_player_avatar') || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
  );

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myCards, setMyCards] = useState<Card[]>([]);
  const [cardGroups, setCardGroups] = useState<Card[][]>([]);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [floatingReactions, setFloatingReactions] = useState<ReactionEvent[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const prevTurnPlayerRef = useRef<string | null>(null);
  const prevRoundStatusRef = useRef<string | null>(null);

  // Sync profile to localStorage
  const updateProfile = (name: string, newAvatar: string) => {
    setPlayerName(name);
    setAvatar(newAvatar);
    localStorage.setItem('rummy_player_name', name);
    localStorage.setItem('rummy_player_avatar', newAvatar);
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.enabled = next;
  };

  // Connect to WebSocket server
  const connectSocket = useCallback(() => {
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      // If we already had an active room in memory or stored, reconnect
      const savedRoomId = sessionStorage.getItem('rummy_active_room');
      if (savedRoomId) {
        ws.send(JSON.stringify({
          type: 'join_room',
          payload: { roomId: savedRoomId, playerId, playerName, avatar }
        }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { event: evtType, payload } = data;

        if (evtType === 'room_state') {
          const newGameState: GameState = payload.gameState;
          const incomingCards: Card[] = payload.myCards || [];

          setGameState(newGameState);
          setMyCards(incomingCards);

          // Audio notifications on turn change
          if (newGameState.currentTurnPlayerId === playerId && prevTurnPlayerRef.current !== playerId) {
            sounds.playTurnAlert();
          }
          prevTurnPlayerRef.current = newGameState.currentTurnPlayerId;

          // Audio notification on round deal
          if (newGameState.status === 'playing' && prevRoundStatusRef.current !== 'playing') {
            sounds.playCardShuffle();
          }
          prevRoundStatusRef.current = newGameState.status;

          // If groups not initialized yet or card count changed, auto group
          setCardGroups(prevGroups => {
            const currentFlat = prevGroups.flat();
            if (currentFlat.length !== incomingCards.length || prevGroups.length === 0) {
              return autoGroupCards(incomingCards, newGameState.wildJokerCard);
            }
            // Keep user's existing groups structure, but update card references
            return prevGroups.map(grp =>
              grp.map(c => incomingCards.find(ic => ic.id === c.id) || c).filter(Boolean)
            );
          });
        } else if (evtType === 'timer_tick') {
          setGameState(prev => prev ? {
            ...prev,
            turnTimeRemaining: payload.turnTimeRemaining,
            currentTurnPlayerId: payload.currentTurnPlayerId
          } : null);

          if (payload.turnTimeRemaining <= 5 && payload.turnTimeRemaining > 0 && payload.currentTurnPlayerId === playerId) {
            sounds.playTick();
          }
        } else if (evtType === 'round_finished') {
          if (payload.winnerId === playerId) {
            sounds.playVictory();
          }
        } else if (evtType === 'chat_message') {
          setChatMessages(prev => [...prev.slice(-30), payload]);
        } else if (evtType === 'reaction') {
          setFloatingReactions(prev => [...prev.slice(-10), payload]);
          setTimeout(() => {
            setFloatingReactions(prev => prev.filter(r => r.id !== payload.id));
          }, 3500);
        } else if (evtType === 'error') {
          setErrorMessage(payload);
          setTimeout(() => setErrorMessage(null), 4000);
        }
      } catch (err) {
        console.error('WebSocket receive error:', err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      // Auto-reconnect after 2 seconds
      setTimeout(() => {
        connectSocket();
      }, 2000);
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };
  }, [playerId, playerName, avatar]);

  useEffect(() => {
    connectSocket();
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connectSocket]);

  // Socket action dispatchers
  const send = (type: string, payload: unknown = {}) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, payload }));
    }
  };

  const createRoom = (customId?: string, maxPlayers: number = 4) => {
    const roomId = customId ? customId.toUpperCase() : Math.random().toString(36).substring(2, 8).toUpperCase();
    sessionStorage.setItem('rummy_active_room', roomId);
    send('join_room', { roomId, playerId, playerName, avatar, maxPlayers });
  };

  const joinRoom = (roomId: string) => {
    const cleanId = roomId.trim().toUpperCase();
    sessionStorage.setItem('rummy_active_room', cleanId);
    send('join_room', { roomId: cleanId, playerId, playerName, avatar });
  };

  const addBot = () => {
    send('add_bot');
  };

  const removeBot = (botId: string) => {
    send('remove_bot', { botId });
  };

  const startGame = () => {
    send('start_game');
  };

  const drawCard = (source: 'closed' | 'open') => {
    sounds.playCardDraw();
    send('draw_card', { source });
  };

  const discardCard = (cardId: string) => {
    sounds.playCardDiscard();
    send('discard_card', { cardId });
    setSelectedCardIds([]);
  };

  const declareHand = (finishCardId?: string) => {
    send('declare_hand', {
      groups: cardGroups,
      finishCardId,
    });
    setSelectedCardIds([]);
  };

  const dropRound = () => {
    if (confirm('Are you sure you want to Drop this hand? (First Drop: 20 pts, Middle Drop: 40 pts)')) {
      send('drop_round');
    }
  };

  const nextRound = () => {
    send('next_round');
  };

  const leaveToLobby = () => {
    sessionStorage.removeItem('rummy_active_room');
    setGameState(null);
    setMyCards([]);
    setCardGroups([]);
  };

  const sendChatMessage = (text: string) => {
    send('chat_message', { text });
  };

  const sendReaction = (emoji: string) => {
    send('send_reaction', { emoji });
  };

  // Card Hand Manipulation Helpers
  const toggleCardSelect = (cardId: string) => {
    sounds.playClick();
    setSelectedCardIds(prev =>
      prev.includes(cardId) ? prev.filter(id => id !== cardId) : [...prev, cardId]
    );
  };

  const autoSortHand = () => {
    sounds.playClick();
    if (!gameState) return;
    const sorted = autoGroupCards(myCards, gameState.wildJokerCard);
    setCardGroups(sorted);
    setSelectedCardIds([]);
  };

  const groupSelectedCards = () => {
    if (selectedCardIds.length < 2) return;
    sounds.playClick();

    const selectedCards = myCards.filter(c => selectedCardIds.includes(c.id));
    const remainingGroups = cardGroups.map(grp =>
      grp.filter(c => !selectedCardIds.includes(c.id))
    ).filter(grp => grp.length > 0);

    setCardGroups([...remainingGroups, selectedCards]);
    setSelectedCardIds([]);
  };

  const ungroupIndex = (idx: number) => {
    sounds.playClick();
    const groupToDissolve = cardGroups[idx];
    if (!groupToDissolve) return;

    // Dissolve each card into standalone cards or append to first group
    const remaining = cardGroups.filter((_, i) => i !== idx);
    const newGroups = [...remaining, ...groupToDissolve.map(c => [c])];
    setCardGroups(newGroups);
  };

  return {
    playerId,
    playerName,
    avatar,
    updateProfile,
    gameState,
    myCards,
    cardGroups,
    selectedCardIds,
    chatMessages,
    floatingReactions,
    isConnected,
    soundEnabled,
    errorMessage,
    toggleSound,
    createRoom,
    joinRoom,
    addBot,
    removeBot,
    startGame,
    drawCard,
    discardCard,
    declareHand,
    dropRound,
    nextRound,
    leaveToLobby,
    sendChatMessage,
    sendReaction,
    toggleCardSelect,
    autoSortHand,
    groupSelectedCards,
    ungroupIndex,
  };
}
