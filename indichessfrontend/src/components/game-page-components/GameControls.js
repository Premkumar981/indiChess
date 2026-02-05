import React from "react";
import"../component-styles/GameControls.css";

const GameControls = ({ onResign, onDraw }) => {
  return (
    <div className="game-controls">
      <button className="control-btn" onClick={onResign}>
        Resign
      </button>
      <button className="control-btn" onClick={onDraw}>
        Draw
      </button>
    </div>
  );
};

export default GameControls;
