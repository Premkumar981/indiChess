import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LoginCard from './components/LoginCard';
import SignupCard from "./components/SignUpCard";
import HomeCard from "./pages/HomeCard";
import HomePage from "./pages/Home";
import './App.css';
import Game from "./pages/Game";


function App() {
  return (
    <Router>
      <Routes>
      <Route path="/" element={<HomeCard />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/game/:matchId" element={<Game />} /> 
      </Routes> 
    </Router>
  );
}

export default App;
