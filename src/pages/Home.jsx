import { useState, useEffect, useCallback } from 'react';
import LiveFeed from '../components/LiveFeed';
import ThreatBadge from '../components/ThreatBadge';
import AlertsPanel from '../components/AlertsPanel';
import { fetchAlerts } from '../api';
import useWebSocket from '../hooks/useWebSocket';

const Home = () => {
  const [currentThreatLevel, setCurrentThreatLevel] = useState('SAFE');
  const [stats, setStats] = useState({ weapons: 0, unattended_bags: 0, persons: 0, objects: 0 });
  const [latestAlert, setLatestAlert] = useState(null);

  const handleWebSocketMessage = useCallback((message) => {
    if (message.type === 'alert') {
      console.log('[Home] New alert received:', message.data);
      setLatestAlert(message.data);
      
      const threatLevel = message.data.threat_level?.toUpperCase();
      if (threatLevel === 'CRITICAL' || threatLevel === 'HIGH') {
        setCurrentThreatLevel('CRITICAL');
      } else if (threatLevel === 'MEDIUM') {
        setCurrentThreatLevel('HIGH');
      }
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('⚠️ New Threat Detected', {
          body: `${message.data.category} detected - ${message.data.threat_level} threat level`,
          icon: '/vite.svg'
        });
      }
    }
  }, []);

  const { isConnected } = useWebSocket(`${import.meta.env.VITE_BACKEND_URL.replace('http', 'ws')}/ws/alerts`, handleWebSocketMessage);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const calculateThreatLevel = async () => {
      try {
        const data = await fetchAlerts();
        const alerts = data.alerts || [];
        
        console.log('[Home] Fetched alerts:', alerts.length);
        
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const recentAlerts = alerts.filter(alert => {
          const alertTime = new Date(alert.timestamp);
          return alertTime > fiveMinutesAgo;
        });

        console.log('[Home] Recent alerts (last 5 min):', recentAlerts.length);
        
        recentAlerts.forEach(a => {
          console.log('[Home] Alert:', a.category, 'Threat:', a.threat_level);
        });

        if (recentAlerts.length === 0) {
          console.log('[Home] No recent alerts - setting SAFE');
          setCurrentThreatLevel('SAFE');
        } else if (recentAlerts.some(a => a.threat_level?.toUpperCase() === 'CRITICAL')) {
          console.log('[Home] Found CRITICAL threat');
          setCurrentThreatLevel('CRITICAL');
        } else if (recentAlerts.some(a => a.threat_level?.toUpperCase() === 'HIGH')) {
          console.log('[Home] Found HIGH threat');
          setCurrentThreatLevel('HIGH');
        } else if (recentAlerts.some(a => a.threat_level?.toUpperCase() === 'MEDIUM')) {
          console.log('[Home] Found MEDIUM threat');
          setCurrentThreatLevel('MEDIUM');
        } else {
          console.log('[Home] Only SAFE detections - setting SAFE');
          setCurrentThreatLevel('SAFE');
        }

        const newStats = {
          weapons: alerts.filter(a => a.object_type === 'weapon').length,
          unattended_bags: alerts.filter(a => a.object_type === 'bag').length,
          persons: alerts.filter(a => a.object_type === 'person').length,
          objects: alerts.filter(a => a.object_type === 'object').length
        };
        console.log('[Home] Stats:', newStats);
        setStats(newStats);

      } catch (error) {
        console.error('Failed to calculate threat level:', error);
      }
    };

    calculateThreatLevel();
    const interval = setInterval(calculateThreatLevel, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6">
      <div className="max-w-full h-full">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 h-full">
          {/* Left Side - Live Feed (70%) */}
          <div className="lg:col-span-7">
            <LiveFeed />
          </div>

          {/* Right Side - Threat Badge & Alerts (30%) */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            {/* Threat Badge */}
            <div>
              <ThreatBadge threatLevel={currentThreatLevel} />
            </div>

            {/* Alerts Panel */}
            <div className="flex-1 min-h-0">
              <AlertsPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
