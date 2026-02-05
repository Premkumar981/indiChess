import React from "react";
import SideNav from "../components/SideNav";
import Header from "../components/Header";
import GameInfo from "../components/game-page-components/GameInfo";

function HomePage() {
  return (
    <div className="app-container">
      <SideNav />
      <div className="main-container">
        <Header username="Player" />
        <main className="content-area">
          <section className="hero-section">
            <h1 className="welcome-text">Welcome back, Grandmaster</h1>
            <p className="welcome-sub">Ready for your next victory?</p>
          </section>
          <div className="game-info-container">
            <GameInfo streak={5} rating={1450} />
          </div>
        </main>
      </div>
    </div>
  );
}

export default HomePage;
