import { useState, useEffect } from 'react';

const LiveFeed = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedCamera, setSelectedCamera] = useState('CAM001');

  const cameras = [
    { id: 'CAM001', name: 'Main Entrance', location: 'Building A' },
    { id: 'CAM002', name: 'Parking Lot', location: 'Building B' },
    { id: 'CAM003', name: 'Lobby', location: 'Ground Floor' },
    { id: 'CAM004', name: 'Server Room', location: 'Basement' }
  ];

  const currentCamera = cameras.find(cam => cam.id === selectedCamera) || cameras[0];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (hasError && retryCount < 5) {
      const timeout = setTimeout(() => {
        setRetryCount(retryCount + 1);
        setHasError(false);
        setIsLoading(true);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [hasError, retryCount]);

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
    setRetryCount(0);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleRetry = () => {
    setRetryCount(0);
    setHasError(false);
    setIsLoading(true);
  };

  return (
    <div className="w-full bg-gray-900 rounded-lg overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
            Live Surveillance Feed
          </h2>
          <div className="flex items-center gap-3">
            {/* AI Model Status Badge */}
            <div className="flex items-center gap-2 bg-green-900/30 border border-green-500 px-3 py-1.5 rounded-lg">
              <div className="relative">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-ping absolute"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full relative"></div>
              </div>
              <span className="text-xs font-semibold text-green-400">LIVE AI MODEL RUNNING</span>
            </div>
            
            {!hasError && !isLoading && (
              <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                Connected
              </span>
            )}
          </div>
        </div>

        {/* Camera Selector and Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Camera Dropdown */}
            <div className="relative">
              <select
                value={selectedCamera}
                onChange={(e) => setSelectedCamera(e.target.value)}
                className="bg-gray-700 text-white text-sm rounded-lg px-4 py-2 pr-8 border border-gray-600 focus:border-blue-500 focus:outline-none cursor-pointer appearance-none"
              >
                {cameras.map((camera) => (
                  <option key={camera.id} value={camera.id}>
                    📹 {camera.id} - {camera.name}
                  </option>
                ))}
              </select>
              {/* Dropdown Arrow */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Camera Location */}
            <span className="text-sm text-gray-400">
              📍 {currentCamera.location}
            </span>
          </div>

          <span className="text-sm text-gray-400">Real-time</span>
        </div>
      </div>

      {/* Video Feed */}
      <div className="relative w-full bg-black" style={{ minHeight: '480px' }}>
        {isLoading && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading video feed...</p>
              {retryCount > 0 && (
                <p className="text-gray-500 text-sm mt-2">Retry attempt {retryCount}/5</p>
              )}
            </div>
          </div>
        )}

        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
            <div className="text-center p-8">
              <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-red-400 font-semibold mb-2">Video Feed Unavailable</p>
              <p className="text-gray-500 text-sm mb-4">
                {retryCount < 5 
                  ? `Retrying in 3 seconds... (${retryCount}/5)`
                  : 'Max retry attempts reached'}
              </p>
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                Retry Now
              </button>
            </div>
          </div>
        )}

        <img
          key={retryCount}
          src={`${import.meta.env.VITE_BACKEND_URL}/api/video?t=${Date.now()}`}
          alt="Live Surveillance Feed"
          className="w-full h-auto"
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{ display: hasError ? 'none' : 'block' }}
        />
      </div>

      {/* Footer Info */}
      <div className="bg-gray-800 px-6 py-3 border-t border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-gray-400">📹 {currentCamera.id} - {currentCamera.name}</span>
            <span className="text-gray-600">|</span>
            <span className="text-gray-400">Resolution: 640x480</span>
            <span className="text-gray-600">|</span>
            <span className="text-gray-400">FPS: 30</span>
          </div>
          <span className="text-gray-400">
            {currentTime.toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LiveFeed;
