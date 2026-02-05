import React from "react";
import { FaUserCircle, FaFlag } from "react-icons/fa";
import "../component-styles/Player.css";

const Player = ({ username, rating, country, time, isOpponent, playerColor, isActive, isBot }) => {
  return (
    <div className={`player-card ${isOpponent ? 'opponent' : 'self'} ${isActive ? 'active-turn' : ''}`}>
      <div className="player-main">
        <div className="player-avatar-wrapper">
          <FaUserCircle className="player-avatar-icon" />
          <div className={`color-indicator ${playerColor}`}></div>
        </div>
        <div className="player-details">
          <div className="player-name-row">
            <span className="player-name-text">
              {username || (isOpponent ? 'Opponent' : 'You')}
              {isBot && <span className="bot-badge">BOT</span>}
            </span>
            <span className="player-rating-pill">{rating || '1200'}</span>
          </div>
          <div className="player-meta-row">
            <span className="player-tag">{isBot ? 'Engine' : (isOpponent ? 'Challenger' : 'Grandmaster')}</span>
            <div className="country-badge">
              <FaFlag className="flag-icon" />
              <span>{country || 'INT'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={`player-timer-box ${time === '0:00' ? 'out-of-time' : ''} ${isActive ? 'playing' : ''}`}>
        <span className="timer-text">{time || '10:00'}</span>
      </div>
    </div>
  );
};

export default Player;
