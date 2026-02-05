import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaFire, FaRegHandshake, FaRobot, FaChessPawn, FaTimes, FaStar } from "react-icons/fa";
import "../component-styles/GameInfo.css";
import PlayFriendModal from "./PlayFriendModal";

const GameInfo = ({ streak = 0, rating = 1200 }) => {
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [showFriendModal, setShowFriendModal] = useState(false);
  const pollingIntervalRef = useRef(null);
  const searchTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  const cancelSearch = async () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }

    const token = localStorage.getItem("token");
    try {
      await fetch('http://localhost:8080/game/cancel-waiting', {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        credentials: 'include',
      });
    } catch (error) {
      console.error("Error cancelling search:", error);
    }

    setIsSearching(false);
    setSearchTime(0);
  };

  const pollForMatch = () => {
    let attempts = 0;
    const maxAttempts = 90;

    pollingIntervalRef.current = setInterval(async () => {
      attempts++;
      setSearchTime(attempts);

      if (attempts >= maxAttempts) {
        cancelSearch();
        alert("Could not find an opponent. Please try again.");
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const response = await fetch('http://localhost:8080/game/check-match', {
          method: 'GET',
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          },
          credentials: 'include',
        });

        if (response.ok) {
          const result = await response.json();
          if (result.matchId && result.matchId > 0) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
            clearTimeout(searchTimerRef.current);
            searchTimerRef.current = null;

            setIsSearching(false);
            setSearchTime(0);
            navigate(`/game/${result.matchId}`);
          } else if (result.matchId === -2) {
            cancelSearch();
            alert("Error checking for match.");
          }
        }
      } catch (error) {
        console.error("Error polling for match:", error);
      }
    }, 1000);
  };

  const createNewGame = async () => {
    if (isSearching) {
      cancelSearch();
      return;
    }

    setIsSearching(true);
    setSearchTime(0);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch('http://localhost:8080/game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.matchId === -1) {
          pollForMatch();
          searchTimerRef.current = setTimeout(() => {
            if (isSearching) cancelSearch();
          }, 90000);
        } else if (result.matchId > 0) {
          setIsSearching(false);
          navigate(`/game/${result.matchId}`);
        } else {
          setIsSearching(false);
          alert("Failed to create match.");
        }
      } else {
        setIsSearching(false);
        alert("Failed to create match.");
      }
    } catch (error) {
      console.error("Error creating game:", error);
      setIsSearching(false);
    }
  };

  const createBotGame = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch('http://localhost:8080/game/bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.matchId > 0) {
          navigate(`/game/${result.matchId}`);
        } else {
          alert("Failed to create bot match.");
        }
      } else {
        alert("Failed to create bot match.");
      }
    } catch (error) {
      console.error("Error creating bot game:", error);
    }
  };

  return (
    <>
      <div className="game-info-card">
        <div className="stats-grid">
          <div className="stat-item pulse-blue">
            <div className="stat-icon"><FaStar /></div>
            <div className="stat-content">
              <span className="stat-label">Rating</span>
              <span className="stat-value">{rating}</span>
            </div>
          </div>
          <div className="stat-item pulse-orange">
            <div className="stat-icon"><FaFire /></div>
            <div className="stat-content">
              <span className="stat-label">Streak</span>
              <span className="stat-value">{streak} Days</span>
            </div>
          </div>
        </div>

        <div className="action-buttons">
          <button
            className={`main-play-btn ${isSearching ? 'searching' : ''}`}
            onClick={createNewGame}
          >
            {isSearching ? (
              <div className="searching-btn-content">
                <FaTimes className="cancel-icon" />
                <div className="search-text">
                  <span className="search-title">Finding Opponent...</span>
                  <span className="search-timer">{searchTime}s</span>
                </div>
              </div>
            ) : (
              <div className="play-btn-content">
                <FaChessPawn size={24} />
                <div className="play-text">
                  <span className="play-title">New Game</span>
                  <span className="play-subtitle">Find a random opponent</span>
                </div>
              </div>
            )}
          </button>

          <div className="secondary-buttons">
            <button className="sec-btn" onClick={createBotGame}>
              <FaRobot size={18} />
              <span>Play Bots</span>
            </button>
            <button className="sec-btn" onClick={() => setShowFriendModal(true)}>
              <FaRegHandshake size={18} />
              <span>Play Friend</span>
            </button>
          </div>
        </div>

        {isSearching && (
          <div className="searching-overlay">
            <div className="radar">
              <div className="radar-circle"></div>
              <div className="radar-circle"></div>
              <div className="radar-circle"></div>
            </div>
            <p className="hint">The board is ready, waiting for a challenger...</p>
          </div>
        )}
      </div>

      {showFriendModal && (
        <PlayFriendModal onClose={() => setShowFriendModal(false)} />
      )}
    </>
  );
};

export default GameInfo;