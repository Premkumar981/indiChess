import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import "./component-styles/SideNav.css";
import { FaChessPawn, FaCog, FaQuestionCircle, FaHome, FaHistory, FaTrophy, FaSignOutAlt } from 'react-icons/fa';

const SideNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { id: 'home', label: 'Play', icon: <FaHome />, path: '/home' },
    { id: 'puzzles', label: 'Puzzles', icon: <FaTrophy />, path: '#' },
    { id: 'history', label: 'History', icon: <FaHistory />, path: '#' },
  ];

  const bottomItems = [
    { id: 'settings', label: 'Settings', icon: <FaCog />, path: '#' },
    { id: 'support', label: 'Support', icon: <FaQuestionCircle />, path: '#' },
  ];

  const handleLogout = async () => {
    const token = localStorage.getItem("token");
    try {
      await fetch('http://localhost:8080/logout', {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        credentials: 'include',
      });
      localStorage.removeItem("token");
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
      // Fallback: clear local storage anyway
      localStorage.removeItem("token");
      navigate("/");
    }
  };

  return (
    <div className="side-nav">
      <div className="logo" onClick={() => navigate('/home')}>
        <div className="logo-icon">
          <FaChessPawn size={28} />
        </div>
        <span className="logo-text">IndiChess</span>
      </div>

      <div className="menu-section">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => item.path !== '#' ? navigate(item.path) : alert(`${item.label} coming soon!`)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="menu-section bottom">
        {bottomItems.map((item) => (
          <button
            key={item.id}
            className="nav-item small"
            onClick={() => alert(`${item.label} coming soon!`)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
        <button
          className="nav-item small logout-btn"
          onClick={handleLogout}
        >
          <span className="nav-icon"><FaSignOutAlt /></span>
          <span className="nav-label">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default SideNav;
