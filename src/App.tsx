import React, { useState } from 'react';
import { useRummyGame } from './hooks/useRummyGame.js';
import { TableCenter } from './components/TableCenter.js';
import { CardGroupContainer } from './components/CardGroupContainer.js';
import { OpponentSeat } from './components/OpponentSeat.js';
import { ActionControls } from './components/ActionControls.js';
import { LobbyView } from './components/LobbyView.js';
import { RulesModal } from './components/RulesModal.js';
import { RoundOverModal } from './components/RoundOverModal.js';
import { ChatOverlay } from './components/ChatOverlay.js';
import { LogOut, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { evaluateFullHand } from './utils/rummyRules.js';

export default function App() {
  const {
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
  } = useRummyGame();

  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // If not connected or in lobby
  if (!gameState || gameState.status === 'lobby') {
    return (
      <>
        <LobbyView
          currentRoom={gameState}
          playerName={playerName}
          avatar={avatar}
          onUpdateProfile={updateProfile}
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          onStartGame={startGame}
          onAddBot={addBot}
          onRemoveBot={removeBot}
          onOpenRules={() => setIsRulesOpen(true)}
          isConnecting={!isConnected}
          localPlayerId={playerId}
        />
        <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
      </>
    );
  }

  // Active game view
  const isMyTurn = gameState.currentTurnPlayerId === playerId;
  const opponents = gameState.players.filter((p) => p.id !== playerId);
  const currentTurnPlayer = gameState.players.find((p) => p.id === gameState.currentTurnPlayerId);
  const isRoundOver = gameState.status === 'round_end' || gameState.status === 'game_over';
  const isHost = gameState.hostId === playerId;

  // Selected card for discard
  const selectedCardId = selectedCardIds.length === 1 ? selectedCardIds[0] : null;

  const handleDiscardSelected = () => {
    if (selectedCardId && isMyTurn && gameState.turnPhase === 'discard') {
      discardCard(selectedCardId);
    }
  };

  const handleDeclareSelected = () => {
    if (!isMyTurn || gameState.turnPhase !== 'discard') return;

    // Evaluate current groups
    const evalResult = evaluateFullHand(cardGroups, gameState.wildJokerCard);
    if (!evalResult.isValidDeclaration) {
      if (
        !confirm(
          `Your hand is not yet fully valid: ${evalResult.message}.\nDeclaring an invalid hand incurs an 80-point penalty! Do you still want to proceed?`
        )
      ) {
        return;
      }
    }

    declareHand(selectedCardId || undefined);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-x-hidden relative font-sans">
      {/* Floating Animated Emoji Reactions */}
      <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
        {floatingReactions.map((r) => (
          <div
            key={r.id}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 text-4xl animate-bounce"
            style={{
              animation: 'floatUp 3s ease-out forwards',
              left: `${40 + Math.random() * 20}%`,
            }}
          >
            <div className="flex flex-col items-center">
              <span className="text-3xl drop-shadow-lg">{r.emoji}</span>
              <span className="text-[10px] bg-slate-950/80 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 whitespace-nowrap mt-1">
                {r.senderName}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Top Header Bar */}
      <header className="px-4 py-2 bg-slate-950/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-serif font-black text-amber-400 text-sm tracking-wide">
            <span>♠</span>
            <span className="hidden sm:inline">ROYAL RUMMY</span>
          </div>

          <div className="h-4 w-px bg-white/20 hidden sm:block" />

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Table:</span>
            <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
              {gameState.roomId}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400">
            <span>Round:</span>
            <span className="font-mono text-white font-bold">{gameState.roundNumber}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Connection status */}
          <div className="flex items-center gap-1 text-[11px] text-slate-400 mr-2">
            {isConnected ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            )}
            <span className="hidden md:inline">{isConnected ? 'Live' : 'Reconnecting...'}</span>
          </div>

          {/* Leave Table Button */}
          <button
            onClick={() => {
              if (confirm('Leave table and return to lobby?')) {
                leaveToLobby();
              }
            }}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-700 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Leave Table</span>
          </button>
        </div>
      </header>

      {/* Error Message Toast */}
      {errorMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-rose-950/95 border border-rose-500 text-rose-200 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs sm:text-sm animate-bounce">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Casino Table Felt Container */}
      <main className="flex-1 flex flex-col justify-between p-2 sm:p-4 max-w-6xl w-full mx-auto relative select-none">
        {/* Luxury Green Felt Table Background Rim */}
        <div
          className="absolute inset-2 sm:inset-4 rounded-[40px] border-8 border-amber-900/60 shadow-[inset_0_0_80px_rgba(0,0,0,0.85)] pointer-events-none -z-10"
          style={{
            backgroundColor: '#0a3824',
            backgroundImage: `radial-gradient(ellipse at center, rgba(16, 120, 75, 0.4) 0%, rgba(5, 30, 20, 0.95) 100%)`,
          }}
        />

        {/* Top Area: Opponents */}
        <div className="w-full pt-4 px-4 flex items-center justify-around gap-2 z-10 min-h-[100px]">
          {opponents.length === 0 ? (
            <div className="text-xs text-emerald-300/80">No other players seated yet</div>
          ) : (
            opponents.map((opp, idx) => (
              <OpponentSeat
                key={opp.id}
                player={opp}
                position={idx === 1 ? 'top' : idx === 0 ? 'left' : 'right'}
              />
            ))
          )}
        </div>

        {/* Center Area: Decks, Joker, Finish Slot */}
        <div className="my-auto z-10">
          <TableCenter
            closedDeckCount={gameState.drawPileCount}
            discardPile={gameState.discardPile}
            wildJokerCard={gameState.wildJokerCard}
            turnPhase={gameState.turnPhase}
            isMyTurn={isMyTurn}
            onDrawClosed={() => drawCard('closed')}
            onDrawDiscard={() => drawCard('open')}
            selectedCardId={selectedCardId}
            onDiscardSelected={handleDiscardSelected}
            onDeclareSelected={handleDeclareSelected}
            turnTimeRemaining={gameState.turnTimeRemaining}
            currentTurnPlayerName={currentTurnPlayer ? currentTurnPlayer.name : ''}
          />
        </div>

        {/* Bottom Area: Local Player Cards Grouped */}
        <div className="w-full flex flex-col items-center z-10 pb-2">
          {/* Hand Melds Grid */}
          <div className="w-full flex flex-wrap items-center justify-center gap-2 sm:gap-3 max-h-48 overflow-y-auto px-1 py-1">
            {cardGroups.length === 0 ? (
              <div className="text-xs text-slate-400 py-4">Dealing cards...</div>
            ) : (
              cardGroups.map((group, idx) => (
                <CardGroupContainer
                  key={idx}
                  groupIndex={idx}
                  cards={group}
                  wildJokerCard={gameState.wildJokerCard}
                  selectedCardIds={selectedCardIds}
                  onToggleCardSelect={toggleCardSelect}
                  onUngroup={() => ungroupIndex(idx)}
                  isInteractable={true}
                />
              ))
            )}
          </div>
        </div>
      </main>

      {/* Action Controls Bar */}
      <footer className="z-30">
        <ActionControls
          onAutoSort={autoSortHand}
          onGroupSelected={groupSelectedCards}
          onDrop={dropRound}
          onDeclare={handleDeclareSelected}
          selectedCardCount={selectedCardIds.length}
          isMyTurn={isMyTurn}
          turnPhase={gameState.turnPhase}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
          onOpenRules={() => setIsRulesOpen(true)}
          onToggleChat={() => setIsChatOpen((prev) => !prev)}
          hasUnreadChat={chatMessages.length > 0}
        />
      </footer>

      {/* Interactive Modals */}
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

      <RoundOverModal
        isOpen={isRoundOver}
        winnerName={
          gameState.players.find((p) => p.id === gameState.winnerId)?.name || 'Winner'
        }
        isLocalPlayerWinner={gameState.winnerId === playerId}
        winMessage={gameState.winMessage}
        players={gameState.players}
        wildJokerCard={gameState.wildJokerCard}
        onNextRound={nextRound}
        onLeaveToLobby={leaveToLobby}
        isHost={isHost}
      />

      <ChatOverlay
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={chatMessages}
        onSendMessage={sendChatMessage}
        onSendReaction={sendReaction}
        currentUserId={playerId}
      />
    </div>
  );
}
