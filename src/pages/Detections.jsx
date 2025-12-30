import { useState, useEffect, useRef } from 'react';
import { getDetectionHistory, getDetectionStats } from '../api';
import DetectionTile from '../components/DetectionTile';
import ActivityTimeline from '../components/ActivityTimeline';
import ExportReports from '../components/ExportReports';

const Detections = () => {
  const [detections, setDetections] = useState([]);
  const [stats, setStats] = useState({ total: 0, persons: 0, weapons: 0, bags: 0, objects: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [threatLevelFilter, setThreatLevelFilter] = useState('all');
  const [error, setError] = useState(null);
  const [newDetectionIds, setNewDetectionIds] = useState(new Set());
  const previousDetectionsRef = useRef([]);

  const loadDetections = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setIsLoading(true);
      }
      
      const data = await getDetectionHistory({ limit: 100, hours: 24 });
      const fetchedDetections = data.detections || [];
      
      const statsData = await getDetectionStats();
      
      const criticalBags = fetchedDetections.filter(d => 
        d.object_type === 'bag' && 
        d.threat_level?.toUpperCase() === 'CRITICAL'
      ).length;
      
      setStats({
        total: statsData.total || 0,
        persons: statsData.persons || 0,
        weapons: statsData.weapons || 0,
        bags: criticalBags,  // Only CRITICAL bags
        objects: statsData.objects || 0
      });
      
      const uniqueDetectionsMap = new Map();
      
      fetchedDetections.forEach(detection => {
        const uniqueId = detection.unique_object_id || detection._id;
        
        if (!uniqueDetectionsMap.has(uniqueId)) {
          uniqueDetectionsMap.set(uniqueId, detection);
        }
      });
      
      const deduplicatedDetections = Array.from(uniqueDetectionsMap.values());
      
      if (!isInitialLoad && previousDetectionsRef.current.length > 0) {
        const previousUniqueIds = new Set(
          previousDetectionsRef.current.map(d => d.unique_object_id || d._id)
        );
        const newIds = new Set();
        
        deduplicatedDetections.forEach(detection => {
          const uniqueId = detection.unique_object_id || detection._id;
          if (!previousUniqueIds.has(uniqueId)) {
            newIds.add(detection._id); // Use _id for UI highlighting
          }
        });
        
        if (newIds.size > 0) {
          setNewDetectionIds(newIds);
          setTimeout(() => {
            setNewDetectionIds(new Set());
          }, 3000);
        }
      }
      
      previousDetectionsRef.current = deduplicatedDetections;
      setDetections(deduplicatedDetections);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch detections:', err);
      setError('Failed to load detections');
    } finally {
      if (isInitialLoad) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    loadDetections(true); // Initial load
    const interval = setInterval(() => loadDetections(false), 3000); // Auto-refresh every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const getFilteredDetections = () => {
    let filtered = detections;
    
    if (filter === 'persons') {
      filtered = filtered.filter(d => d.object_type === 'person');
    } else if (filter === 'weapons') {
      filtered = filtered.filter(d => d.object_type === 'weapon');
    } else if (filter === 'objects') {
      filtered = filtered.filter(d => d.object_type === 'object');
    } else if (filter === 'bags') {
      filtered = filtered.filter(d => 
        d.object_type === 'bag' && 
        d.threat_level?.toUpperCase() === 'CRITICAL'
      );
    }
    
    if (threatLevelFilter !== 'all') {
      filtered = filtered.filter(d => d.threat_level?.toUpperCase() === threatLevelFilter.toUpperCase());
    }
    
    return filtered;
  };

  const filteredDetections = getFilteredDetections();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
      <div className="max-w-[1920px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
            📊 Detection History
          </h1>
          <p className="text-gray-400">
            View all detected persons, threats, and objects
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition-all duration-300 shadow-lg hover:shadow-blue-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Detections</p>
                <p className="text-4xl font-bold text-white">{stats.total}</p>
              </div>
              <div className="text-5xl opacity-50">📊</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition-all duration-300 shadow-lg hover:shadow-blue-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Persons</p>
                <p className="text-4xl font-bold text-blue-400">{stats.persons}</p>
              </div>
              <div className="text-5xl opacity-50">👤</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 hover:border-red-500 transition-all duration-300 shadow-lg hover:shadow-red-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Weapons</p>
                <p className="text-4xl font-bold text-red-400">{stats.weapons}</p>
              </div>
              <div className="text-5xl opacity-50">🔪</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 hover:border-red-500 transition-all duration-300 shadow-lg hover:shadow-red-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Unattended Bags</p>
                <p className="text-4xl font-bold text-red-400">{stats.bags}</p>
              </div>
              <div className="text-5xl opacity-50">🎒</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 hover:border-green-500 transition-all duration-300 shadow-lg hover:shadow-green-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Objects</p>
                <p className="text-4xl font-bold text-green-400">{stats.objects}</p>
              </div>
              <div className="text-5xl opacity-50">📦</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-2">
            <nav className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`
                  flex-1 px-6 py-3 text-sm font-medium rounded-lg transition-all duration-300
                  ${filter === 'all' 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/50' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }
                `}
              >
                <span className="flex items-center justify-center gap-2">
                  📊 All
                  <span className="bg-white/20 text-white text-xs px-2.5 py-0.5 rounded-full font-bold">
                    {stats.total}
                  </span>
                </span>
              </button>
              
              <button
                onClick={() => setFilter('persons')}
                className={`
                  flex-1 px-6 py-3 text-sm font-medium rounded-lg transition-all duration-300
                  ${filter === 'persons' 
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/50' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }
                `}
              >
                <span className="flex items-center justify-center gap-2">
                  👤 Persons
                  <span className="bg-white/20 text-white text-xs px-2.5 py-0.5 rounded-full font-bold">
                    {stats.persons}
                  </span>
                </span>
              </button>
              
              <button
                onClick={() => setFilter('weapons')}
                className={`
                  flex-1 px-6 py-3 text-sm font-medium rounded-lg transition-all duration-300
                  ${filter === 'weapons' 
                    ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg shadow-red-500/50' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }
                `}
              >
                <span className="flex items-center justify-center gap-2">
                  🔪 Weapons
                  <span className="bg-white/20 text-white text-xs px-2.5 py-0.5 rounded-full font-bold">
                    {stats.weapons}
                  </span>
                </span>
              </button>
              
              <button
                onClick={() => setFilter('bags')}
                className={`
                  flex-1 px-6 py-3 text-sm font-medium rounded-lg transition-all duration-300
                  ${filter === 'bags' 
                    ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg shadow-red-500/50' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }
                `}
              >
                <span className="flex items-center justify-center gap-2">
                  🎒 Unattended Bags
                  <span className="bg-white/20 text-white text-xs px-2.5 py-0.5 rounded-full font-bold">
                    {stats.bags}
                  </span>
                </span>
              </button>
              
              <button
                onClick={() => setFilter('objects')}
                className={`
                  flex-1 px-6 py-3 text-sm font-medium rounded-lg transition-all duration-300
                  ${filter === 'objects' 
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/50' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }
                `}
              >
                <span className="flex items-center justify-center gap-2">
                  📦 Objects
                  <span className="bg-white/20 text-white text-xs px-2.5 py-0.5 rounded-full font-bold">
                    {stats.objects}
                  </span>
                </span>
              </button>
            </nav>
          </div>
        </div>


        {/* Threat Level Filters */}
        <div className="mb-8">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-gray-400 text-sm font-semibold mr-2">🎯 Threat Level:</span>
              <button
                onClick={() => setThreatLevelFilter('all')}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                  threatLevelFilter === 'all' 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                }`}
              >
                All Levels
              </button>
              <button
                onClick={() => setThreatLevelFilter('SAFE')}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                  threatLevelFilter === 'SAFE' 
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/50' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                }`}
              >
                🟢 SAFE
              </button>
              <button
                onClick={() => setThreatLevelFilter('MEDIUM')}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                  threatLevelFilter === 'MEDIUM' 
                    ? 'bg-gradient-to-r from-yellow-600 to-orange-500 text-white shadow-lg shadow-yellow-500/50' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                }`}
              >
                🟡 MEDIUM
              </button>
              <button
                onClick={() => setThreatLevelFilter('HIGH')}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                  threatLevelFilter === 'HIGH' 
                    ? 'bg-gradient-to-r from-orange-600 to-red-500 text-white shadow-lg shadow-orange-500/50' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                }`}
              >
                🟠 HIGH
              </button>
              <button
                onClick={() => setThreatLevelFilter('CRITICAL')}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                  threatLevelFilter === 'CRITICAL' 
                    ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg shadow-red-500/50 animate-pulse' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                }`}
              >
                🔴 CRITICAL
              </button>
              <button
                onClick={() => loadDetections(false)}
                className="ml-auto px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 border border-blue-500"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Detections Grid - Responsive: Mobile 1 col, Tablet 2 cols, Desktop 4 cols */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-gray-400 text-sm">
            Showing <span className="text-white font-semibold">{filteredDetections.length}</span> of <span className="text-white font-semibold">{detections.length}</span> detections
          </p>
          <p className="text-gray-500 text-xs">
            Auto-refreshing every 3 seconds
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-8">
          {/* Main Detection Grid - 3 columns */}
          <div className="xl:col-span-3">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading detections...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-400 font-semibold mb-2">{error}</p>
                  <button
                    onClick={() => loadDetections(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : filteredDetections.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-6xl mb-4">🔍</div>
                  <p className="text-gray-400 font-semibold">No detections found</p>
                  <p className="text-gray-500 text-sm mt-1">Try changing the filter or wait for new detections</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDetections.map((detection, index) => {
                  const isNew = newDetectionIds.has(detection._id);
                  const uniqueKey = detection.unique_object_id || detection._id || index;
                  
                  return (
                    <div
                      key={uniqueKey}
                      className={`${
                        isNew 
                          ? 'animate-slideInScale' 
                          : ''
                      }`}
                      style={{
                        animationDelay: isNew ? `${index * 50}ms` : '0ms'
                      }}
                    >
                      <DetectionTile
                        image_url={detection.image_url}
                        object_type={detection.object_type}
                        category={detection.category}
                        threat_level={detection.threat_level}
                        camera_id={detection.metadata?.camera_id || detection.camera_id || 'Unknown'}
                        timestamp={detection.timestamp}
                        confidence={detection.metadata?.confidence || detection.confidence}
                        location={detection.metadata?.location || detection.location}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Sidebar - Activity Timeline & Export */}
          <div className="xl:col-span-1 space-y-6">
            <ActivityTimeline />
            <ExportReports />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Detections;
