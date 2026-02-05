import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoginCard from '../components/LoginCard';
import SignupCard from '../components/SignUpCard';

function HomeCard() {
  const [showSignup, setShowSignup] = useState(false); // Track if we need to show SignupCard
  const [isAuthenticated, setIsAuthenticated] = useState(false); // To track authentication status
  const navigate = useNavigate(); // For navigation (redirecting to home)

  // Check if the user is already authenticated on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:8080/home", {
          method: "GET",
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          },
          credentials: "include",
        });

        if (response.ok) {
          // If authenticated, redirect to /home
          setIsAuthenticated(true);
          navigate("/home");  // Redirect to /home using useNavigate
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleToggleSignup = () => {
    setShowSignup((prev) => !prev); // Toggle between login and signup
  };

  return (
    <div className="home-card">
      {isAuthenticated ? (
        // If authenticated, don't show the login/signup cards, just redirect to /home
        <div>Redirecting to Home...</div>
      ) : (
        <div>
          {showSignup ? (
            <SignupCard handleToggleSignup={handleToggleSignup} />
          ) : (
            <LoginCard handleToggleSignup={handleToggleSignup} />
          )}
        </div>
      )}
    </div>
  );
}

export default HomeCard;
