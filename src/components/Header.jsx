import React from 'react'

const Header = ({ onHome, showHome }) => {
  return (
    <header className="bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-lg">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {showHome && (
              <button
                onClick={onHome}
                className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
              >
                ← Back to Form
              </button>
            )}
            <span className="text-4xl">🚛</span>
            <div>
              <h1 className="text-2xl font-bold">ELD Trip Planner</h1>
              <p className="text-blue-200 text-sm">Electronic Logging Device & Route Planning</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-200">DOT Compliant</p>
            <p className="text-xs text-blue-300">70hr/8day Cycle</p>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
