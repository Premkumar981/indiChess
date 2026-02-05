import React, { useEffect } from "react";

const Moves = ({ moves }) => {
  return (
    <div className="moves-history-wrapper">
      <div className="moves-header">
        <span className="header-label">#</span>
        <span className="header-label">White</span>
        <span className="header-label">Black</span>
      </div>
      <div className="moves-list-scroll">
        {moves.map((move, index) => (
          <div className="move-row" key={index}>
            <div className="move-number">{move.index || index + 1}</div>
            <div className="move-notation white">{move.white}</div>
            <div className="move-notation black">{move.black}</div>
          </div>
        ))}
        {moves.length === 0 && (
          <div className="empty-moves">
            <p>No moves yet. White to play.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Moves;
