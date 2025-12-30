import { useState, useEffect } from 'react';

const SystemStatus = () => {
  const [status, setStatus] = useState({
    ai_running: false,
    last_frame_time: null,
    uptime_seconds: 0,
    isOnline: false
  });

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/system/status`);
      const data = await response.json();
      
      let isOnline = false;
      if (data.ai_running && data.last_frame_time) {
        const lastFrameTime = new Date(data.last_frame_time);
        const now = new Date();
        const secondsSinceLastFrame = (now - lastFrameTime) / 1000;
        isOnline = secondsSinceLastFrame < 5;
      }
      
      setStatus({
        ...data,
        isOnline
      });
    } catch (error) {
      console.error('Failed to fetch system status:', error);
      setStatus(prev => ({ ...prev, isOnline: false }));
    }
  };

  useEffect(() => {
    fetchSystemStatus();
    const interval = setInterval(fetchSystemStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds) => {
    if (seconds < 60) return `${Math.floor(seconds)}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  return (
    <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg">
      {status.isOnline ? (
        <>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-green-400 font-medium">🟢 SYSTEM ONLINE</span>
        </>
      ) : (
        <>
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span className="text-sm text-red-400 font-medium">🔴 SYSTEM OFFLINE</span>
        </>
      )}
      {status.uptime_seconds > 0 && (
        <span className="text-xs text-gray-500 ml-2">
          {formatUptime(status.uptime_seconds)}
        </span>
      )}
    </div>
  );
};

export default SystemStatus;
