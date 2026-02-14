import React, { useState } from 'react'
import TripForm from './components/TripForm'
import RouteMap from './components/RouteMap'
import ELDLogs from './components/ELDLogs'
import TripSummary from './components/TripSummary'
import Header from './components/Header'
import { calculateRoute } from './services/api'

function App() {
  const [tripData, setTripData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('form')

  const handleCalculate = async (formData) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await calculateRoute(formData)
      setTripData(result)
      setActiveTab('map')
    } catch (err) {
      setError(err.message || 'Failed to calculate route')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setTripData(null)
    setError(null)
    setActiveTab('form')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header onHome={handleReset} showHome={!!tripData} />
      
      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {!tripData ? (
          <TripForm onSubmit={handleCalculate} loading={loading} />
        ) : (
          <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex space-x-4 border-b border-gray-300">
              <button
                onClick={() => setActiveTab('map')}
                className={`px-4 py-2 font-medium ${
                  activeTab === 'map' 
                    ? 'border-b-2 border-blue-600 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                🗺️ Route Map
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`px-4 py-2 font-medium ${
                  activeTab === 'logs' 
                    ? 'border-b-2 border-blue-600 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📋 ELD Logs ({tripData.eld_logs?.length || 0} days)
              </button>
              <button
                onClick={() => setActiveTab('summary')}
                className={`px-4 py-2 font-medium ${
                  activeTab === 'summary' 
                    ? 'border-b-2 border-blue-600 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📊 Trip Summary
              </button>
            </div>
            
            {/* Tab Content */}
            {activeTab === 'map' && (
              <RouteMap 
                origin={tripData.origin} 
                destination={tripData.destination}
                polyline={tripData.polyline}
                stops={tripData.stops}
              />
            )}
            
            {activeTab === 'logs' && (
              <ELDLogs logs={tripData.eld_logs} />
            )}
            
            {activeTab === 'summary' && (
              <TripSummary 
                tripData={tripData} 
                onReset={handleReset}
              />
            )}
          </div>
        )}
      </main>
      
      <footer className="bg-gray-800 text-white py-4 mt-8">
        <div className="container mx-auto px-4 text-center">
          <p>ELD Trip Planner - Compliant with DOT Hours of Service Regulations</p>
          <p className="text-sm text-gray-400 mt-1">
            Property-carrying driver, 70hrs/8days cycle, 11-hour driving limit
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
