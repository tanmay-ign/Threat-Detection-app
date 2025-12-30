import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from '../pages/Home';
import Detections from '../pages/Detections';
import Analytics from '../pages/Analytics';
import SystemStatus from './SystemStatus';
import { fetchAlerts } from '../api';
import useWebSocket from '../hooks/useWebSocket';

const Dashboard = () => {
  const [stats, setStats] = useState({ weapons: 0, unattended_bags: 0, persons: 0, objects: 0 });

  const getWebSocketUrl = () => {
    if (import.meta.env.DEV) {
     
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${window.location.host}/ws/alerts`;
    } else {
    
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const wsUrl = backendUrl.replace(/^http/, 'ws').replace(/^https/, 'wss');
      return `${wsUrl}/ws/alerts`;
    }
  };

  const { isConnected } = useWebSocket(getWebSocketUrl(), (message) => {
    if (message.type === 'alert') {
      loadStats();
    }
  });

  const loadStats = async () => {
    try {
      const data = await fetchAlerts();
      const alerts = data.alerts || [];
      
      const newStats = {
        weapons: alerts.filter(a => a.alert_type === 'weapon').length,
        unattended_bags: alerts.filter(a => a.alert_type === 'unattended_bag').length,
        persons: alerts.filter(a => a.alert_type === 'person').length,
        objects: alerts.filter(a => a.alert_type === 'object').length
      };
      setStats(newStats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-950 flex flex-col">
        {/* Navbar */}
        <NavbarContent stats={stats} isConnected={isConnected} />

        {/* Main Content */}
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/detections" element={<Detections />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </div>

        {/* Footer */}
        <footer className="bg-gray-900 border-t border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center gap-4">
              <span>© 2024 AI Threat Detection System</span>
              <div className="h-4 w-px bg-gray-700"></div>
              <span>Backend: {import.meta.env.DEV ? 'localhost:8000' : import.meta.env.VITE_BACKEND_URL}</span>
              <div className="h-4 w-px bg-gray-700"></div>
              <span className={`flex items-center gap-2 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></span>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>{new Date().toLocaleString()}</span>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
};

const NavbarContent = ({ stats, isConnected }) => {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-gray-900 border-b border-gray-800 shadow-lg">
      <div className="max-w-full px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                AI Threat Detection System
              </h1>
              <p className="text-sm text-gray-400">
                Real-Time AI Surveillance & Threat Detection
              </p>
            </div>
          </div>

          {/* Navigation Links - Right Side */}
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className={`px-8 py-4 rounded-lg text-base font-semibold transition-all duration-300 ${
                isActive('/')
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/50 scale-105'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white hover:scale-105'
              }`}
            >
              🏠 Dashboard
            </Link>
            <Link
              to="/detections"
              className={`px-8 py-4 rounded-lg text-base font-semibold transition-all duration-300 ${
                isActive('/detections')
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/50 scale-105'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white hover:scale-105'
              }`}
            >
              📊 Detections
            </Link>
            <Link
              to="/analytics"
              className={`px-8 py-4 rounded-lg text-base font-semibold transition-all duration-300 ${
                isActive('/analytics')
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/50 scale-105'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white hover:scale-105'
              }`}
            >
              📈 Analytics
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Dashboard;
