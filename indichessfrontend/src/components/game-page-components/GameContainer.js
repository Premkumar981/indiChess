import React, { useState, useEffect, useRef } from "react";
import BoardLayout from "./BoardLayout";
import GamePlayControlContainer from "./GamePlayControlContainer";

const GameContainer = ({ matchId, stompClient, isConnected, playerColor, initialGameData }) => {
  // Helper to format moves from server into the structure used for the Moves component
  const formatInitialMoves = (moveDtos) => {
    if (!moveDtos || !Array.isArray(moveDtos) || moveDtos.length === 0) return [];

    console.log("📜 Formatting initial moves count:", moveDtos.length);

    const formatted = [];
    moveDtos.forEach((move) => {
      const notation = move.moveNotation || "??";
      const isWhite = move.playerColor?.toLowerCase() === 'white';

      if (isWhite) {
        formatted.push({
          white: notation,
          black: "",
          index: formatted.length + 1
        });
      } else {
        if (formatted.length > 0) {
          formatted[formatted.length - 1].black = notation;
        } else {
          // Black move without a preceding white move (should not happen in standard chess from start)
          formatted.push({
            white: "...",
            black: notation,
            index: 1
          });
        }
      }
    });

    return formatted;
  };

  const [moves, setMoves] = useState(formatInitialMoves(initialGameData?.moves));
  const [whiteTime, setWhiteTime] = useState(600);
  const [blackTime, setBlackTime] = useState(600);
  const [isWhiteTurn, setIsWhiteTurn] = useState(initialGameData?.whiteTurn ?? true); // Initialize from server
  const [isMyTurn, setIsMyTurn] = useState(initialGameData?.myTurn ?? (playerColor?.toLowerCase() === 'white'));
  const [gameStatus, setGameStatus] = useState("active");
  const [opponentMove, setOpponentMove] = useState(null);
  const moveSubscriptionRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Determine usernames for display
  const amIWhite = playerColor?.toLowerCase() === 'white';
  const myUsername = amIWhite
    ? initialGameData?.player1?.username
    : initialGameData?.player2?.username;

  const opponentUsername = amIWhite
    ? initialGameData?.player2?.username
    : initialGameData?.player1?.username;

  console.log(`🕵️ Local session: Color=${playerColor}, Me=${myUsername}, Opponent=${opponentUsername}`);

  // Reset state when a new game is loaded
  useEffect(() => {
    if (initialGameData) {
      console.log("🔄 Resetting GameContainer state for new match:", matchId);
      setMoves(formatInitialMoves(initialGameData.moves));
      setIsWhiteTurn(initialGameData.whiteTurn ?? true);
      setIsMyTurn(initialGameData.myTurn ?? (playerColor?.toLowerCase() === 'white'));
      setGameStatus(initialGameData.status === "FINISHED" ? `Game Over: ${initialGameData.status}` : "active");
      setOpponentMove(null);
      // Reset times if needed (should ideally come from server, but 600 is default)
      setWhiteTime(600);
      setBlackTime(600);
    }
  }, [matchId, initialGameData, playerColor]);

  // Timer logic
  useEffect(() => {
    if (gameStatus.includes("Game Over")) {
      clearInterval(timerIntervalRef.current);
      return;
    }

    clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      if (isWhiteTurn) {
        setWhiteTime(prev => Math.max(0, prev - 1));
      } else {
        setBlackTime(prev => Math.max(0, prev - 1));
      }
    }, 1000);

    return () => clearInterval(timerIntervalRef.current);
  }, [isWhiteTurn, gameStatus]);

  // WebSocket subscriptions
  useEffect(() => {
    if (!stompClient || !isConnected || !stompClient.connected) return;

    const sub = stompClient.subscribe(`/topic/moves/${matchId}`, (message) => {
      try {
        const moveData = JSON.parse(message.body);
        console.log("📥 Received Move from WebSocket:", moveData);

        if (moveData.type === 'MOVE_ERROR') {
          console.error("❌ Move rejected by server:", moveData.error);
          // If our move was rejected, we need our turn back!
          setIsMyTurn(true);
          // Alert user (optional, can be a toast)
          alert(`Move rejected: ${moveData.error}`);
          return;
        }

        // Always update move history and turn based on backend's MoveDTO
        addMove(moveData);

        // Update turn states based on backend's next player turn
        const nextIsWhiteTurn = moveData.isWhiteTurn;
        const amIWhite = playerColor?.toLowerCase() === 'white';
        const isNowMyTurn = (nextIsWhiteTurn && amIWhite) || (!nextIsWhiteTurn && !amIWhite);

        setIsWhiteTurn(nextIsWhiteTurn);
        setIsMyTurn(isNowMyTurn);

        console.log(`📡 WebSocket Sync: NextTurn=${nextIsWhiteTurn ? 'White' : 'Black'}, IsMyTurn=${isNowMyTurn}`);

        if (moveData.playerColor?.toLowerCase() !== playerColor?.toLowerCase()) {
          console.log(`🎯 Opponent (${moveData.playerColor}) moved. Updating board.`);
          setOpponentMove({ ...moveData }); // Ensure fresh object reference
        } else {
          console.log("✅ Our move confirmed by server.");
          setOpponentMove(null);
        }
      } catch (e) {
        console.error("Move sync error:", e);
      }
    });

    const stateSub = stompClient.subscribe(`/topic/game-state/${matchId}`, (message) => {
      try {
        const state = JSON.parse(message.body);
        console.log("🎮 Game State Update:", state);
        if (state.status === "RESIGNED" || state.type === "RESIGNATION") {
          setGameStatus("Game Over: RESIGNED");
        } else if (state.status === "DRAW" || state.type === "DRAW_ACCEPTED") {
          setGameStatus("Game Over: DRAW");
        }
      } catch (e) {
        console.error("State sync error:", e);
      }
    });

    return () => {
      sub.unsubscribe();
      stateSub.unsubscribe();
    };
  }, [stompClient, isConnected, matchId, playerColor]);

  const addMove = (moveData) => {
    const notation = moveData.moveNotation || "??";
    const isWhite = moveData.playerColor?.toLowerCase() === 'white';

    setMoves(prev => {
      // Improved duplicate detection: check if this exact notation for this color already exists in the last slot
      if (isWhite) {
        if (prev.length > 0) {
          const lastMove = prev[prev.length - 1];
          if (lastMove.white === notation && lastMove.black === "") return prev;
        }
        return [...prev, { white: notation, black: "", index: prev.length + 1 }];
      } else {
        if (prev.length > 0) {
          const lastMove = prev[prev.length - 1];
          if (lastMove.black === notation) return prev;

          const newMoves = [...prev];
          newMoves[newMoves.length - 1] = { ...lastMove, black: notation };
          return newMoves;
        } else {
          return [{ white: "...", black: notation, index: 1 }];
        }
      }
    });
  };

  const sendMove = (moveData) => {
    if (!isMyTurn) return false;

    stompClient.publish({
      destination: `/app/game/${matchId}/move`,
      body: JSON.stringify({
        ...moveData,
        playerColor: playerColor,
        matchId: matchId
      })
    });

    // OPTIMISTIC LOCKING:
    // Once we publish a move, we instantly lose the ability to move again
    // until we get a confirmation from the server (handled in WebSocket subscription).
    setIsMyTurn(false);

    return true;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleGameAction = (action) => {
    stompClient.publish({
      destination: `/app/game/${matchId}/${action}`,
      body: JSON.stringify({ playerColor, matchId })
    });
  };

  return (
    <div className="game-screen-container">
      <div className="game-main-content">
        <div className="board-section">
          <div className="game-header-bar">
            <div className="match-meta">
              <span className={`status-pill ${isConnected ? 'online' : 'offline'}`}>
                {isConnected ? 'STABLE CONNECTION' : 'DISCONNECTED'}
              </span>
              <span className="match-id">Match #{matchId} Index</span>
            </div>
            <div className="turn-banner">
              <span className={`turn-dot ${isMyTurn ? 'my-turn' : 'opp-turn'}`}></span>
              <span className="turn-label">{isMyTurn ? "Your Turn" : "Opponent's Move"}</span>
            </div>
            <div className="match-actions">
              <button className="action-btn resign" onClick={() => handleGameAction('resign')}>Resign</button>
              <button className="action-btn draw" onClick={() => handleGameAction('draw')}>Offer Draw</button>
            </div>
          </div>

          <BoardLayout
            addMove={addMove}
            sendMove={sendMove}
            opponentMove={opponentMove}
            playerColor={playerColor}
            isMyTurn={isMyTurn}
            matchId={matchId}
            isConnected={isConnected}
            whiteTime={formatTime(whiteTime)}
            blackTime={formatTime(blackTime)}
            isWhiteTurn={isWhiteTurn}
            initialGameData={initialGameData}
            gameStatus={gameStatus}
            setGameStatus={setGameStatus}
            myUsername={myUsername}
            opponentUsername={opponentUsername}
          />
        </div>

        <GamePlayControlContainer
          moves={moves}
          matchId={matchId}
          stompClient={stompClient}
          isConnected={isConnected}
          playerColor={playerColor}
        />
      </div>
    </div>
  );
};

export default GameContainer;