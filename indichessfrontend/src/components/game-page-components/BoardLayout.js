import React from "react";
import Player from "./Player";
import Board from "./Board";
import "../component-styles/BoardLayout.css";

const BoardLayout = ({
  addMove,
  sendMove,
  opponentMove,
  playerColor,
  isMyTurn,
  isConnected,
  matchId,
  whiteTime,
  blackTime,
  isWhiteTurn,
  initialGameData,
  gameStatus,
  setGameStatus,
  myUsername,
  opponentUsername
}) => {
  const isWhite = playerColor === 'white';
  const isOpponentBot = initialGameData?.gameType === 'BOT';

  return (
    <div className="board-layout-main">
      <Player
        isOpponent={true}
        playerColor={isWhite ? 'black' : 'white'}
        username={opponentUsername}
        isBot={isOpponentBot}
        rating={isOpponentBot ? "800" : "1200"}
        country={isOpponentBot ? "BOT" : "USA"}
        time={isWhite ? blackTime : whiteTime}
        isActive={isWhite ? !isWhiteTurn : isWhiteTurn}
      />
      <Board
        addMove={addMove}
        sendMove={sendMove}
        opponentMove={opponentMove}
        playerColor={playerColor}
        isMyTurn={isMyTurn}
        isConnected={isConnected}
        matchId={matchId}
        initialGameData={initialGameData}
        isWhiteTurn={isWhiteTurn}
        gameStatus={gameStatus}
        setGameStatus={setGameStatus}
      />
      <Player
        isOpponent={false}
        playerColor={playerColor}
        username={myUsername}
        rating="1200"
        country="IND"
        time={isWhite ? whiteTime : blackTime}
        isActive={isWhite ? isWhiteTurn : !isWhiteTurn}
      />
    </div>
  );
};

export default BoardLayout;