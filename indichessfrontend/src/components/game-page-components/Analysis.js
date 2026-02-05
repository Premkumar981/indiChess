import React from "react";
import { useState } from "react";
import Moves from "./Moves";
import GameControls from "./GameControls";

const Analysis = ({moves}) => {

  const [gameStatus, setGameStatus] = useState("");  // Track the game status (e.g., "Resigned", "Drawn")


  // Function to handle resign
  const handleResign = () => {
    setGameStatus("Resigned");
    alert("You have resigned from the game.");
  };

  // Function to handle draw proposal
  const handleDraw = () => {
    setGameStatus("Draw Proposed");
    alert("You have proposed a draw.");
  };

  return (
    <div className="moves-container">
        <Moves moves={moves} />
        <GameControls onResign={handleResign} onDraw={handleDraw} />  {/* Add the GameControls below Moves */}
        {gameStatus && <p className="game-status">{gameStatus}</p>}
      </div>
  );
};

export default Analysis;
