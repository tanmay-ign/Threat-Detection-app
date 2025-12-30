import { useState, useEffect } from 'react';
import { fetchAlerts } from '../api';

const AlertsPanel = () => {
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadAlerts = async () => {
    try {
      const data = await fetchAlerts();
      setAlerts(data.alerts || []);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
      setError('Failed to load alerts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  const getThreatColor = (level) => {
    if (!level) {
      return {
        bg: 'bg-gray-900/30',
        border: 'border-gray-500',
        text: 'text-gray-400',
        badge: 'bg-gray-500',
        label: 'UNKNOWN'
      };
    }

    const upperLevel = level.toUpperCase();
    
    const colors = {
      SAFE: {
        bg: 'bg-green-900/30',
        border: 'border-green-500',
        text: 'text-green-400',
        badge: 'bg-green-500',
        label: 'SAFE'
      },
      MEDIUM: {
        bg: 'bg-yellow-900/30',
        border: 'border-yellow-500',
        text: 'text-yellow-400',
        badge: 'bg-yellow-500',
        label: 'MEDIUM'
      },
      HIGH: {
        bg: 'bg-orange-900/30',
        border: 'border-orange-500',
        text: 'text-orange-400',
        badge: 'bg-orange-500',
        label: 'HIGH'
      },
      CRITICAL: {
        bg: 'bg-red-900/30',
        border: 'border-red-500',
        text: 'text-red-400',
        badge: 'bg-red-500 animate-pulse',
        label: 'CRITICAL'
      }
    };
    
    return colors[upperLevel] || {
      bg: 'bg-gray-900/30',
      border: 'border-gray-500',
      text: 'text-gray-400',
      badge: 'bg-gray-500',
      label: 'UNKNOWN'
    };
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const date = new Date(timestamp);
    const diffMs = currentTime - date;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffSeconds < 10) return 'Just now';
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getAlertIcon = (detection) => {
    const objectType = detection.object_type || detection.alert_type;
    const icons = {
      weapon: '🔪',
      bag: '🎒',
      unattended_bag: '🎒',
      person: '👤',
      object: '📦'
    };
    return icons[objectType] || '📦';
  };

  return (
    <div className="bg-gray-900 rounded-lg shadow-2xl overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🚨</span>
            Recent Alerts
          </h2>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-400">
              {lastUpdate ? `Updated ${formatTimestamp(lastUpdate)}` : 'Loading...'}
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-400 mt-1">
          {alerts.length} alert{alerts.length !== 1 ? 's' : ''} in last 24 hours
        </p>
      </div>

      {/* Alerts List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: '600px' }}>
        {isLoading && alerts.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-400">Loading alerts...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-6">
              <svg className="w-12 h-12 text-red-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-400 font-semibold">{error}</p>
              <button 
                onClick={loadAlerts}
                className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition"
              >
                Retry
              </button>
            </div>
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-6">
              <div className="text-6xl mb-3">✅</div>
              <p className="text-gray-400 font-semibold">No alerts</p>
              <p className="text-gray-500 text-sm mt-1">All systems normal</p>
            </div>
          </div>
        ) : (
          alerts.map((alert, index) => {
            const colors = getThreatColor(alert.threat_level);
            return (
              <div
                key={alert._id || index}
                className={`
                  ${colors.bg} 
                  border-l-4 
                  ${colors.border}
                  rounded-lg 
                  p-4 
                  hover:bg-opacity-50 
                  transition-all
                  cursor-pointer
                `}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Icon and Content */}
                  <div className="flex items-start gap-3 flex-1">
                    <div className="text-2xl mt-1">
                      {getAlertIcon(alert)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-semibold capitalize">
                          {alert.category || alert.object_type}
                        </h3>
                        <span className={`
                          ${colors.badge}
                          text-white 
                          text-xs 
                          px-2 
                          py-0.5 
                          rounded-full 
                          font-semibold
                        `}>
                          {colors.label || alert.threat_level || 'UNKNOWN'}
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-300">
                          📹 Camera: {alert.camera_id || alert.metadata?.camera_id || 'Unknown'}
                        </p>
                        {(alert.location || alert.metadata?.location) && (
                          <p className="text-gray-400">
                            📍 {alert.location || alert.metadata?.location}
                          </p>
                        )}
                        {(alert.confidence || alert.metadata?.confidence) && (
                          <p className="text-gray-400">
                            🎯 Confidence: {((alert.confidence || alert.metadata?.confidence) * 100).toFixed(1)}%
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="text-right">
                    <p className="text-xs text-gray-400">
                      {formatTimestamp(alert.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-800 px-6 py-3 border-t border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Auto-refresh every 5 seconds</span>
          <button
            onClick={loadAlerts}
            className="text-blue-400 hover:text-blue-300 transition"
          >
            🔄 Refresh now
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertsPanel;
