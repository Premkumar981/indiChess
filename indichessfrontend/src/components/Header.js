import React from "react";
import { FaUserCircle, FaBell, FaSearch } from "react-icons/fa";
import "./component-styles/Header.css";

const Header = ({ username }) => {
  return (
    <div className="header">
      <div className="header-left">
        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input type="text" placeholder="Search players, news..." />
        </div>
      </div>

      <div className="header-right">
        <button className="icon-btn">
          <FaBell size={20} />
          <span className="notification-dot"></span>
        </button>
        <div className="user-profile">
          <div className="user-info">
            <span className="user-name">{username || 'Guest'}</span>
            <span className="user-rank">Pro Player</span>
          </div>
          <FaUserCircle size={32} className="avatar-icon" />
        </div>
      </div>
    </div>
  );
};

export default Header;
