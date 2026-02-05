import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function LoginCard({ handleToggleSignup }) {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      // Send login request to backend
      const response = await axios.post(
        "http://localhost:8080/login",
        { username, password },
        { withCredentials: true }
      );

      // If login is successful, redirect to home
      if (response && response.data) {
        console.log("Login successful, saving token");
        localStorage.setItem("token", response.data);
        navigate("/home");
      }
      else {
        console.log("Not Auth");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || "Invalid username or password");
    }
  };

  return (
    <div className="login-card">
      <h2>Login</h2>

      <form onSubmit={handleLogin}>
        <div className="input-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
        </div>

        {error && <p className="error-message">{error}</p>}

        <button type="submit" className="simple-auth-btn">Login</button>
      </form>

      <div className="oauth-buttons">
        <a href="http://localhost:8080/oauth2/authorization/google">
          <button className="btn-google">Login with Google</button>
        </a>
        <a href="http://localhost:8080/oauth2/authorization/github">
          <button className="btn-github">Login with GitHub</button>
        </a>
      </div>

      <div className="signup-link">
        Not an existing user?
        <button className="simple-auth-btn" onClick={handleToggleSignup}>Sign up here</button>
      </div>
    </div>
  );
}

export default LoginCard;
