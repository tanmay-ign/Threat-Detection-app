import PropTypes from 'prop-types';

const DetectionTile = ({ 
  image_url, 
  object_type, 
  category, 
  threat_level, 
  camera_id, 
  timestamp,
  confidence,
  location 
}) => {
  const getThreatColor = (level) => {
    const colors = {
      SAFE: {
        border: 'border-green-500',
        bg: 'bg-green-900/20',
        badge: 'bg-green-500',
        text: 'text-green-400'
      },
      LOW: {
        border: 'border-blue-500',
        bg: 'bg-blue-900/20',
        badge: 'bg-blue-500',
        text: 'text-blue-400'
      },
      MEDIUM: {
        border: 'border-yellow-500',
        bg: 'bg-yellow-900/20',
        badge: 'bg-yellow-500',
        text: 'text-yellow-400'
      },
      HIGH: {
        border: 'border-orange-500',
        bg: 'bg-orange-900/20',
        badge: 'bg-orange-500',
        text: 'text-orange-400'
      },
      CRITICAL: {
        border: 'border-red-500',
        bg: 'bg-red-900/20',
        badge: 'bg-red-500 animate-pulse',
        text: 'text-red-400'
      }
    };
    return colors[level?.toUpperCase()] || colors.SAFE;
  };

  const getIcon = (type) => {
    const icons = {
      weapon: '🔪',
      unattended_bag: '🎒',
      person: '👤',
      object: '📦',
      bag: '🎒'
    };
    return icons[type] || '📦';
  };

  const formatTimestamp = (ts) => {
    const date = new Date(ts);
    const now = new Date();
    const diffMs = now - date;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffSeconds < 10) return 'Just now';
    if (diffSeconds < 60) return `${diffSeconds} seconds ago`;
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const colors = getThreatColor(threat_level);

  return (
    <div
      className={`
        bg-gradient-to-br from-gray-900 to-gray-800
        rounded-xl
        overflow-hidden 
        border-2 
        ${colors.border} 
        ${colors.bg}
        shadow-xl
        hover:shadow-2xl
        transition-all
        duration-300
        cursor-pointer
        group
        ${threat_level?.toUpperCase() === 'CRITICAL' ? 'animate-pulse-border' : ''}
      `}
    >
      {/* Image Section */}
      <div className="relative bg-gray-950 flex items-center justify-center" style={{ minHeight: '200px', maxHeight: '300px' }}>
        {image_url ? (
          <>
            <img
              src={image_url}
              alt={`${category} detection`}
              className="w-full opacity-90"
              style={{ 
                objectFit: 'contain',
                maxHeight: '300px',
                height: 'auto',
                width: 'auto',
                maxWidth: '100%'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
            {/* Fallback for failed image load */}
            <div 
              className="w-full h-full flex flex-col items-center justify-center bg-gray-900 absolute inset-0"
              style={{ display: 'none' }}
            >
              <div className="text-4xl opacity-20 mb-2">📷</div>
              <p className="text-gray-600 text-sm font-mono">Captured image unavailable</p>
            </div>
          </>
        ) : (
          /* No image URL provided */
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 absolute inset-0">
            <div className="text-4xl opacity-20 mb-2">📷</div>
            <p className="text-gray-600 text-sm font-mono">Captured image unavailable</p>
          </div>
        )}

        {/* CCTV Overlay Effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50 pointer-events-none"></div>
        
        {/* Scanline Effect */}
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <div className="h-full w-full" style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.1) 2px, rgba(0,255,0,0.1) 4px)'
          }}></div>
        </div>

        {/* Threat Level Badge Overlay */}
        <div className="absolute top-3 right-3">
          <span className={`
            ${colors.badge}
            text-white 
            text-xs 
            px-3 
            py-1.5
            rounded-lg
            font-bold
            shadow-lg
            backdrop-blur-sm
            border border-white/20
          `}>
            {threat_level?.toUpperCase()}
          </span>
        </div>

        {/* Confidence Badge */}
        {confidence && (
          <div className="absolute top-3 left-3">
            <span className="bg-black/70 text-green-400 text-xs px-2.5 py-1 rounded-lg font-mono font-semibold backdrop-blur-sm border border-green-500/30">
              🎯 {(confidence * 100).toFixed(0)}%
            </span>
          </div>
        )}
        
        {/* CCTV Timestamp Overlay */}
        <div className="absolute bottom-3 left-3">
          <span className="bg-black/70 text-red-400 text-xs px-2.5 py-1 rounded font-mono font-semibold backdrop-blur-sm border border-red-500/30">
            ● REC
          </span>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-4 bg-gradient-to-b from-gray-800 to-gray-900">
        {/* Title */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-bold text-lg capitalize flex items-center gap-2">
            <span className="text-2xl">{getIcon(object_type)}</span>
            <span className="font-mono">{category || object_type}</span>
          </h3>
        </div>

        {/* Details */}
        <div className="space-y-2 text-sm">
          {/* Camera ID */}
          <div className="flex items-center gap-2 text-gray-300">
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="font-mono text-xs">{camera_id || 'Unknown'}</span>
          </div>

          {/* Location */}
          {location && (
            <div className="flex items-center gap-2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-xs">{location}</span>
            </div>
          )}

          {/* Timestamp */}
          <div className="flex items-center gap-2 text-gray-500 text-xs pt-2 border-t border-gray-700/50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-mono">{formatTimestamp(timestamp)}</span>
          </div>
        </div>

        {/* Threat Indicator Bar */}
        <div className="mt-3 pt-3 border-t border-gray-700/50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400 font-mono">THREAT LEVEL</span>
            <span className={`font-bold font-mono ${colors.text}`}>
              {threat_level?.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

DetectionTile.propTypes = {
  image_url: PropTypes.string,
  object_type: PropTypes.string.isRequired,
  category: PropTypes.string.isRequired,
  threat_level: PropTypes.string.isRequired,
  camera_id: PropTypes.string.isRequired,
  timestamp: PropTypes.string.isRequired,
  confidence: PropTypes.number,
  location: PropTypes.string
};

export default DetectionTile;
