import { useState, useEffect } from 'react';
import { getDetectionHistory } from '../api';

const ActivityTimeline = () => {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadActivities();
    const interval = setInterval(loadActivities, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadActivities = async () => {
    try {
      const data = await getDetectionHistory({ limit: 50, hours: 24 });
      setActivities(data.detections || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load activities:', error);
      setIsLoading(false);
    }
  };

  const getActivityIcon = (detection) => {
    const icons = {
      weapon: '🔪',
      bag: '🎒',
      person: '👤',
      object: '📦'
    };
    return icons[detection.object_type] || '📦';
  };

  const getThreatColor = (level) => {
    const colors = {
      SAFE: 'border-green-500 bg-green-900/20',
      MEDIUM: 'border-yellow-500 bg-yellow-900/20',
      HIGH: 'border-orange-500 bg-orange-900/20',
      CRITICAL: 'border-red-500 bg-red-900/20 animate-pulse'
    };
    return colors[level?.toUpperCase()] || colors.SAFE;
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatRelativeTime = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
        <span>⏱️</span>
        Activity Timeline
      </h3>
      
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📭</div>
            <p className="text-gray-400 text-sm">No recent activity</p>
          </div>
        ) : (
          activities.map((activity, index) => (
            <div key={activity._id || index} className="relative">
              {/* Timeline Line */}
              {index < activities.length - 1 && (
                <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-700"></div>
              )}
              
              {/* Activity Card */}
              <div className={`relative flex gap-3 p-3 rounded-lg border-l-4 ${getThreatColor(activity.threat_level)} hover:bg-gray-800/50 transition-all duration-300`}>
                {/* Icon */}
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-xl border-2 border-gray-700">
                    {getActivityIcon(activity)}
                  </div>
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-white font-semibold capitalize text-sm">
                      {activity.category || activity.object_type} Detected
                    </h4>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap">
                      {formatRelativeTime(activity.timestamp)}
                    </span>
                  </div>
                  
                  <p className="text-gray-400 text-xs mb-1.5">
                    📹 {activity.camera_id || activity.metadata?.camera_id || 'Unknown Camera'}
                  </p>
                  
                  <div className="flex items-center gap-2 text-[10px] flex-wrap">
                    <span className={`px-1.5 py-0.5 rounded-full font-semibold ${
                      activity.threat_level === 'CRITICAL' ? 'bg-red-500 text-white' :
                      activity.threat_level === 'HIGH' ? 'bg-orange-500 text-white' :
                      activity.threat_level === 'MEDIUM' ? 'bg-yellow-500 text-white' :
                      'bg-green-500 text-white'
                    }`}>
                      {activity.threat_level || 'SAFE'}
                    </span>
                    
                    <span className="text-gray-500">
                      🕐 {formatTime(activity.timestamp)}
                    </span>
                    
                    {(activity.confidence || activity.metadata?.confidence) && (
                      <span className="text-gray-500">
                        🎯 {((activity.confidence || activity.metadata?.confidence) * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityTimeline;
