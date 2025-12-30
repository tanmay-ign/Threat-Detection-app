const Navbar = () => {
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

          {/* System Status */}
          <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-300">System Online</span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
