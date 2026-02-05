import React, { useState } from "react";
import Analysis from "./Analysis";
import NewGame from "./NewGame";
import GamesPlayed from "./GamesPlayed"
import Players from "./Players";
import "../component-styles/GamePlayControlContainer.css";

const GamePlayControlContainer = ({moves}) => {
  const [activeTab, setActiveTab] = useState("Analysis");

  // Handle tab selection
  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="game-play-control-container">
      {/* Header Section with Tabs */}
      <div className="header">
        <div
          className={`tab ${activeTab === "Analysis" ? "active" : ""}`}
          onClick={() => handleTabClick("Analysis")}
        >
          Analysis
        </div>
        <div
          className={`tab ${activeTab === "NewGame" ? "active" : ""}`}
          onClick={() => handleTabClick("NewGame")}
        >
          New Game
        </div>
        <div
          className={`tab ${activeTab === "Games" ? "active" : ""}`}
          onClick={() => handleTabClick("Games")}
        >
          Games
        </div>
        <div
          className={`tab ${activeTab === "Players" ? "active" : ""}`}
          onClick={() => handleTabClick("Players")}
        >
          Players
        </div>
      </div>

      {/* Content Section based on active tab */}
      <div className="content">
        {activeTab === "Analysis" && <Analysis moves={moves}/>}
        {activeTab === "NewGame" && <NewGame />}
        {activeTab === "Games" && <GamesPlayed />}
        {activeTab === "Players" && <Players />}
      </div>
    </div>
  );
};

export default GamePlayControlContainer;
