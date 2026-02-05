import React, { useState, useEffect, useRef } from "react";
import { FaTimes, FaCopy, FaArrowRight, FaSpinner } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "../component-styles/PlayFriendModal.css";

const PlayFriendModal = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState("create");
    const [roomCode, setRoomCode] = useState("");
    const [inputCode, setInputCode] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const pollIntervalRef = useRef(null);

    useEffect(() => {
        return () => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        };
    }, []);

    const handleCreateRoom = async () => {
        setIsCreating(true);
        setError("");
        const token = localStorage.getItem("token");
        try {
            const response = await fetch("http://localhost:8080/game/create-room", {
                method: "POST",
                headers: {
                    Authorization: token ? `Bearer ${token}` : "",
                },
                credentials: "include",
            });

            if (response.ok) {
                const data = await response.json();
                setRoomCode(data.roomCode);
                startPollingForJoin(data.roomCode);
            } else {
                setError("Failed to create room. Please try again.");
            }
        } catch (err) {
            setError("Network error. Could not connect to server.");
        } finally {
            setIsCreating(false);
        }
    };

    const startPollingForJoin = (code) => {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

        pollIntervalRef.current = setInterval(async () => {
            const token = localStorage.getItem("token");
            try {
                const response = await fetch("http://localhost:8080/game/check-match", {
                    method: "GET",
                    headers: {
                        Authorization: token ? `Bearer ${token}` : "",
                    },
                    credentials: "include",
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.matchId && result.matchId > 0) {
                        clearInterval(pollIntervalRef.current);
                        onClose();
                        navigate(`/game/${result.matchId}`);
                    }
                }
            } catch (err) {
                console.error("Polling error:", err);
            }
        }, 2000);
    };

    const handleJoinRoom = async () => {
        if (!inputCode.trim()) {
            setError("Please enter a room code.");
            return;
        }
        setIsJoining(true);
        setError("");
        const token = localStorage.getItem("token");
        try {
            const response = await fetch(`http://localhost:8080/game/join-room/${inputCode.toUpperCase()}`, {
                method: "POST",
                headers: {
                    Authorization: token ? `Bearer ${token}` : "",
                },
                credentials: "include",
            });

            if (response.ok) {
                const data = await response.json();
                if (data.matchId > 0) {
                    onClose();
                    navigate(`/game/${data.matchId}`);
                } else {
                    setError("Invalid or expired room code.");
                }
            } else {
                setError("Invalid room code or room no longer exists.");
            }
        } catch (err) {
            setError("Network error. Could not connect to server.");
        } finally {
            setIsJoining(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(roomCode);
        alert("Code copied to clipboard!");
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="close-btn" onClick={onClose}><FaTimes /></button>

                <div className="modal-header">
                    <h2>Play a Friend</h2>
                    <p>Challenge someone to a battle of wits</p>
                </div>

                <div className="tab-container">
                    <button
                        className={`tab-btn ${activeTab === "create" ? "active" : ""}`}
                        onClick={() => { setActiveTab("create"); setError(""); }}
                    >
                        Create Room
                    </button>
                    <button
                        className={`tab-btn ${activeTab === "join" ? "active" : ""}`}
                        onClick={() => { setActiveTab("join"); setError(""); }}
                    >
                        Join Room
                    </button>
                </div>

                <div className="tab-content">
                    {activeTab === "create" ? (
                        <div className="create-section">
                            {!roomCode ? (
                                <button className="action-btn" onClick={handleCreateRoom} disabled={isCreating}>
                                    {isCreating ? <FaSpinner className="spinner" /> : "Generate Room Code"}
                                </button>
                            ) : (
                                <div className="room-display">
                                    <p>Share this code with your friend:</p>
                                    <div className="code-box">
                                        <span className="code">{roomCode}</span>
                                        <button className="copy-btn" onClick={copyToClipboard} title="Copy to clipboard">
                                            <FaCopy />
                                        </button>
                                    </div>
                                    <div className="waiting-status">
                                        <FaSpinner className="spinner" />
                                        <span>Waiting for friend to join...</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="join-section">
                            <p>Enter the code shared by your friend:</p>
                            <div className="input-group">
                                <input
                                    type="text"
                                    placeholder="e.g. AB1234"
                                    value={inputCode}
                                    onChange={(e) => setInputCode(e.target.value)}
                                    maxLength={6}
                                />
                                <button className="join-btn" onClick={handleJoinRoom} disabled={isJoining}>
                                    {isJoining ? <FaSpinner className="spinner" /> : <FaArrowRight />}
                                </button>
                            </div>
                        </div>
                    )}
                    {error && <p className="error-msg">{error}</p>}
                </div>
            </div>
        </div>
    );
};

export default PlayFriendModal;
