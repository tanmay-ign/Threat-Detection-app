import PropTypes from 'prop-types';

const ThreatBadge = ({ threatLevel = 'SAFE' }) => {
  const level = threatLevel.toUpperCase();

  const threatStyles = {
    SAFE: {
      bg: 'bg-green-500',
      text: 'text-green-100',
      border: 'border-green-400',
      icon: '✓',
      pulse: false
    },
    MEDIUM: {
      bg: 'bg-yellow-500',
      text: 'text-yellow-100',
      border: 'border-yellow-400',
      icon: '⚠',
      pulse: false
    },
    HIGH: {
      bg: 'bg-orange-500',
      text: 'text-orange-100',
      border: 'border-orange-400',
      icon: '⚠',
      pulse: false
    },
    CRITICAL: {
      bg: 'bg-red-600',
      text: 'text-red-100',
      border: 'border-red-500',
      icon: '🚨',
      pulse: true
    }
  };

  const style = threatStyles[level] || threatStyles.SAFE;

  return (
    <div className={`
      ${style.bg} 
      ${style.text} 
      border-2 
      ${style.border}
      rounded-lg 
      px-6 
      py-4 
      shadow-lg
      ${style.pulse ? 'animate-pulse' : ''}
      transition-all
      duration-300
    `}>
      <div className="flex items-center justify-between gap-4">
        {/* Icon */}
        <div className="text-3xl">
          {style.icon}
        </div>

        {/* Text Content */}
        <div className="flex-1">
          <p className="text-sm font-medium opacity-90">
            Current Threat Level
          </p>
          <p className="text-2xl font-bold">
            {level}
          </p>
        </div>

        {/* Status Indicator */}
        <div className="flex flex-col items-center gap-1">
          <div className={`
            w-4 h-4 
            rounded-full 
            ${style.pulse ? 'animate-ping absolute' : ''}
            ${style.bg}
            opacity-75
          `}></div>
          <div className={`
            w-4 h-4 
            rounded-full 
            bg-white
            relative
          `}></div>
        </div>
      </div>

      {/* Additional Info for Critical */}
      {level === 'CRITICAL' && (
        <div className="mt-3 pt-3 border-t border-red-500">
          <p className="text-sm font-semibold animate-pulse">
            ⚠️ IMMEDIATE ATTENTION REQUIRED
          </p>
        </div>
      )}
    </div>
  );
};

ThreatBadge.propTypes = {
  threatLevel: PropTypes.oneOf(['SAFE', 'MEDIUM', 'HIGH', 'CRITICAL', 'safe', 'medium', 'high', 'critical'])
};

export default ThreatBadge;
