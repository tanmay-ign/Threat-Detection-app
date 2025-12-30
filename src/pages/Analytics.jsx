import { useState, useEffect } from 'react';
import { getDetectionHistory, getDetectionStats } from '../api';

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [detections, setDetections] = useState([]);
  const [timeRange, setTimeRange] = useState('24h');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
    const interval = setInterval(loadAnalytics, 10000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      const hours = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
      const [statsData, historyData] = await Promise.all([
        getDetectionStats(),
        getDetectionHistory({ limit: 1000, hours })
      ]);
      
      setStats(statsData);
      setDetections(historyData.detections || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      setIsLoading(false);
    }
  };

  const getHourlyDistribution = () => {
    const hours = Array(24).fill(0);
    detections.forEach(d => {
      const hour = new Date(d.timestamp).getHours();
      hours[hour]++;
    });
    return hours;
  };

  const getThreatDistribution = () => {
    const dist = { SAFE: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    detections.forEach(d => {
      const level = d.threat_level?.toUpperCase() || 'SAFE';
      dist[level] = (dist[level] || 0) + 1;
    });
    return dist;
  };

  const getDetectionTrend = () => {
    const days = Array(7).fill(0);
    const now = new Date();
    
    detections.forEach(d => {
      const detectionDate = new Date(d.timestamp);
      const diffDays = Math.floor((now - detectionDate) / (1000 * 60 * 60 * 24));
      if (diffDays < 7) {
        days[6 - diffDays]++;
      }
    });
    
    return days;
  };

  const hourlyData = getHourlyDistribution();
  const threatDist = getThreatDistribution();
  const trendData = getDetectionTrend();
  const maxHourly = Math.max(...hourlyData, 1);
  const maxTrend = Math.max(...trendData, 1);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
      <div className="max-w-[1920px] mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
              📊 Analytics Dashboard
            </h1>
            <p className="text-gray-400">
              Comprehensive insights and statistics
            </p>
          </div>
          
          {/* Time Range Selector */}
          <div className="flex gap-2">
            {['24h', '7d', '30d'].map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                  timeRange === range
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/50'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {range === '24h' ? 'Last 24 Hours' : range === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 rounded-xl p-6 border border-blue-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-400 text-sm font-semibold">Total Detections</span>
              <span className="text-3xl">📊</span>
            </div>
            <p className="text-4xl font-bold text-white">{stats?.total || 0}</p>
            <p className="text-blue-300 text-sm mt-2">All time</p>
          </div>

          <div className="bg-gradient-to-br from-red-900/30 to-red-800/30 rounded-xl p-6 border border-red-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-red-400 text-sm font-semibold">Critical Threats</span>
              <span className="text-3xl">🚨</span>
            </div>
            <p className="text-4xl font-bold text-white">{stats?.by_threat_level?.CRITICAL || 0}</p>
            <p className="text-red-300 text-sm mt-2">Requires immediate attention</p>
          </div>

          <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 rounded-xl p-6 border border-green-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-400 text-sm font-semibold">Safe Detections</span>
              <span className="text-3xl">✅</span>
            </div>
            <p className="text-4xl font-bold text-white">{stats?.by_threat_level?.SAFE || 0}</p>
            <p className="text-green-300 text-sm mt-2">No threat detected</p>
          </div>

          <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 rounded-xl p-6 border border-purple-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-purple-400 text-sm font-semibold">Detection Rate</span>
              <span className="text-3xl">⚡</span>
            </div>
            <p className="text-4xl font-bold text-white">
              {detections.length > 0 ? Math.round(detections.length / (timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : 30)) : 0}
            </p>
            <p className="text-purple-300 text-sm mt-2">Per {timeRange === '24h' ? 'hour' : 'day'}</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Hourly Distribution Chart */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span>📈</span>
              Hourly Distribution
            </h3>
            <div className="space-y-2">
              {hourlyData.map((count, hour) => (
                <div key={hour} className="flex items-center gap-3">
                  <span className="text-gray-400 text-sm w-12">{hour.toString().padStart(2, '0')}:00</span>
                  <div className="flex-1 bg-gray-800 rounded-full h-8 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                      style={{ width: `${(count / maxHourly) * 100}%` }}
                    >
                      {count > 0 && <span className="text-white text-xs font-bold">{count}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Threat Level Distribution */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span>🎯</span>
              Threat Level Distribution
            </h3>
            <div className="space-y-4">
              {Object.entries(threatDist).map(([level, count]) => {
                const colors = {
                  SAFE: { bg: 'from-green-500 to-emerald-500', text: 'text-green-400', icon: '🟢' },
                  MEDIUM: { bg: 'from-yellow-500 to-orange-500', text: 'text-yellow-400', icon: '🟡' },
                  HIGH: { bg: 'from-orange-500 to-red-500', text: 'text-orange-400', icon: '🟠' },
                  CRITICAL: { bg: 'from-red-500 to-pink-500', text: 'text-red-400', icon: '🔴' }
                };
                const color = colors[level] || colors.SAFE;
                const percentage = stats?.total ? ((count / stats.total) * 100).toFixed(1) : 0;

                return (
                  <div key={level}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`${color.text} font-semibold flex items-center gap-2`}>
                        <span>{color.icon}</span>
                        {level}
                      </span>
                      <span className="text-white font-bold">{count} ({percentage}%)</span>
                    </div>
                    <div className="bg-gray-800 rounded-full h-4 overflow-hidden">
                      <div
                        className={`bg-gradient-to-r ${color.bg} h-full rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Detection Trend */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-8">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>📉</span>
            7-Day Detection Trend
          </h3>
          <div className="flex items-end justify-between gap-4 h-64">
            {trendData.map((count, index) => {
              const date = new Date();
              date.setDate(date.getDate() - (6 - index));
              const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-gray-800 rounded-t-lg overflow-hidden flex flex-col justify-end" style={{ height: '200px' }}>
                    <div
                      className="bg-gradient-to-t from-blue-500 to-purple-500 w-full rounded-t-lg transition-all duration-500 flex items-start justify-center pt-2"
                      style={{ height: `${(count / maxTrend) * 100}%` }}
                    >
                      {count > 0 && <span className="text-white text-sm font-bold">{count}</span>}
                    </div>
                  </div>
                  <span className="text-gray-400 text-sm font-semibold">{dayName}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Object Type Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { type: 'Persons', count: stats?.persons || 0, icon: '👤', color: 'blue' },
            { type: 'Weapons', count: stats?.weapons || 0, icon: '🔪', color: 'red' },
            { type: 'Bags', count: stats?.bags || 0, icon: '🎒', color: 'yellow' },
            { type: 'Objects', count: stats?.objects || 0, icon: '📦', color: 'green' }
          ].map(item => (
            <div key={item.type} className={`bg-gradient-to-br from-${item.color}-900/20 to-${item.color}-800/20 rounded-xl p-6 border border-${item.color}-500/20`}>
              <div className="text-center">
                <div className="text-5xl mb-3">{item.icon}</div>
                <p className="text-3xl font-bold text-white mb-1">{item.count}</p>
                <p className="text-gray-400 text-sm">{item.type}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
