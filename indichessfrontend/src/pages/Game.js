import Header from "../components/Header";
import SideNav from "../components/SideNav";
import GameContainer from "../components/game-page-components/GameContainer";
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { FaTimes, FaChessPawn } from 'react-icons/fa';

const Game = () => {
  const { matchId } = useParams();
  const [stompClient, setStompClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [playerColor, setPlayerColor] = useState();

  const playerColorRef = useRef();

  useEffect(() => {
    if (!matchId) return;

    const token = localStorage.getItem("token");

    // Fetch initial game data
    fetch(`http://localhost:8080/game/${matchId}`, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    })
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch game data');
        return response.json();
      })
      .then(data => {
        console.log("Game data loaded:", data);
        const normalizedColor = data.playerColor?.toLowerCase();
        setPlayerColor(normalizedColor);
        playerColorRef.current = normalizedColor;
        setGameData({ ...data, playerColor: normalizedColor });
      })
      .catch(err => {
        console.error("Initialization error:", err);
        setError(err.message);
      });

    // No cleanup for this effect related to stompClient anymore,
    // as it's handled by the separate WebSocket effect.
  }, [matchId]);

  const stompClientRef = useRef(null);
  const isUnmounting = useRef(false);

  // Connection logic
  useEffect(() => {
    if (!gameData) return;

    isUnmounting.current = false;
    console.log(`🔌 Initializing WebSocket for match ${matchId}...`);

    // Deactivate existing client if any
    if (stompClientRef.current) {
      console.log("🔌 Deactivating previous WebSocket client");
      stompClientRef.current.deactivate();
    }

    const token = localStorage.getItem("token"); // Get token here for WS connection

    // Fallback: pass token in query for SockJS if needed
    const wsUrl = token ? `http://localhost:8080/ws?token=${token}` : 'http://localhost:8080/ws';
    const socket = new SockJS(wsUrl);

    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: token ? { 'Authorization': `Bearer ${token}` } : {}, // Add connectHeaders here
      debug: (str) => {
        // console.log(new Date().toISOString() + ': ' + str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = (frame) => {
      if (isUnmounting.current) {
        client.deactivate();
        return;
      }
      console.log('✅ Connected to WebSocket: ' + frame);
      setIsConnected(true);
      setStompClient(client);
      stompClientRef.current = client;

      // Notify server that player has joined with the correct color
      client.publish({
        destination: `/app/game/${matchId}/join`,
        body: JSON.stringify({
          type: 'PLAYER_JOINED',
          playerColor: playerColorRef.current,
          timestamp: new Date().toISOString()
        })
      });

      // Moves and state are handled by GameContainer subscriptions
    };

    client.onStompError = (frame) => {
      console.error('❌ STOMP error', frame.headers['message']);
      console.error('Additional details: ' + frame.body);
      setError(`Error: ${frame.headers?.message || 'STOMP error'}`);
    };

    client.onWebSocketClose = () => {
      console.log('🔌 WebSocket connection closed');
      setIsConnected(false);
    };

    client.activate();

    return () => {
      console.log(`🧹 Cleaning up WebSocket for match ${matchId}...`);
      isUnmounting.current = true;
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
      }
      setStompClient(null);
      setIsConnected(false);
    };
  }, [matchId, gameData]);

  if (error) {
    return (
      <div className="app-container">
        <SideNav />
        <div className="main-container">
          <Header username="Player" />
          <div className="error-display">
            <div className="error-card">
              <FaTimes size={48} className="error-icon" />
              <h2>Connection Failed</h2>
              <p>{error}</p>
              <button className="retry-btn" onClick={() => window.location.href = '/home'}>
                Back to Lobby
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!gameData || !isConnected) {
    return (
      <div className="app-container">
        <SideNav />
        <div className="main-container">
          <Header username="Player" />
          <div className="loading-display">
            <div className="premium-spinner">
              <div className="spinner-inner"></div>
              <FaChessPawn size={32} className="spinner-icon" />
            </div>
            <p className="loading-text">Preparing the Arena...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <SideNav />
      <div className="main-container">
        <Header username="Player" />
        <GameContainer
          matchId={matchId}
          stompClient={stompClient}
          isConnected={isConnected}
          playerColor={playerColor}
          initialGameData={gameData}
        />
      </div>
    </div>
  );
};

export default Game;