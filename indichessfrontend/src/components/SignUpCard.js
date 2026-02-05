import React, { useState } from "react";
import axios from "axios";

function SignupCard({ handleToggleSignup }) {

  const [username, setUsername] = useState("");
  const [emailId, setEmailId] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("");
  const [error, setError] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();

    try {
      // Send signup request to backend
      const response = await axios.post("http://localhost:8080/signup", {
        username,
        emailId,
        password,
        country,
      });

      console.log(response);
      // If signup is successful, redirect to login or home
      if (response.status === 200 || response.status === 201) {
        // console.log("Show login");
        handleToggleSignup();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || "Error in signup. Please try again.");
    }
  };

  const countries = [
    "United States",
    "Canada",
    "United Kingdom",
    "Australia",
    "India",
    "Germany",
    "France",
    "Japan",
    "South Korea",
    "Mexico",
    "Brazil",
    "China",
    "Russia",
    "Italy",
  ];

  return (
    <div className="signup-card">
      <h2>Sign Up</h2>

      <form onSubmit={handleSignup} className="signup-form">
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
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={emailId}
            onChange={(e) => setEmailId(e.target.value)}
            placeholder="Enter your email"
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

        <div className="input-group">
          <label htmlFor="country">Country</label>
          <select
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            required
          >
            <option value="">Select your country</option>
            {countries.map((countryName, index) => (
              <option key={index} value={countryName}>
                {countryName}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="error-message">{error}</p>}

        <button type="submit" className="simple-auth-btn">Sign Up</button>
      </form>

      <div className="login-link">
        Already an existing user?
        <button className="simple-auth-btn" onClick={handleToggleSignup}>Login</button>
      </div>
    </div>
  );
}

export default SignupCard;
