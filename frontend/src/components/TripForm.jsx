import React, { useState } from 'react'

const TripForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    current_location: { lat: '', lng: '' },
    pickup_location: { lat: '', lng: '' },
    dropoff_location: { lat: '', lng: '' },
    current_cycle_used: 0,
    driver_id: 'DRV001',
    carrier_name: 'Test Carrier',
    truck_number: 'TRK001'
  })
  
  const [hasPickup, setHasPickup] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name in formData) {
      setFormData(prev => ({ ...prev, [name]: value }))
    } else if (name.startsWith('current_') || name.startsWith('pickup_') || name.startsWith('dropoff_')) {
      const [locType, field] = name.split('_')
      setFormData(prev => ({
        ...prev,
        [locType]: { ...prev[locType], [field]: value }
      }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const submitData = {
      ...formData,
      current_location: {
        lat: parseFloat(formData.current_location.lat) || 0,
        lng: parseFloat(formData.current_location.lng) || 0
      },
      dropoff_location: {
        lat: parseFloat(formData.dropoff_location.lat) || 0,
        lng: parseFloat(formData.dropoff_location.lng) || 0
      }
    }
    
    if (hasPickup && formData.pickup_location.lat && formData.pickup_location.lng) {
      submitData.pickup_location = {
        lat: parseFloat(formData.pickup_location.lat) || 0,
        lng: parseFloat(formData.pickup_location.lng) || 0
      }
    } else {
      delete submitData.pickup_location
    }
    
    submitData.current_cycle_used = parseFloat(formData.current_cycle_used) || 0
    
    onSubmit(submitData)
  }

  // Quick location presets
  const presets = {
    'Los Angeles': { lat: 34.0522, lng: -118.2437 },
    'New York': { lat: 40.7128, lng: -74.0060 },
    'Chicago': { lat: 41.8781, lng: -87.6298 },
    'Houston': { lat: 29.7604, lng: -95.3698 },
    'Phoenix': { lat: 33.4484, lng: -112.0740 },
    'Dallas': { lat: 32.7767, lng: -96.7970 },
    'San Francisco': { lat: 37.7749, lng: -122.4194 },
    'Seattle': { lat: 47.6062, lng: -122.3321 }
  }

  const applyPreset = (city, type) => {
    setFormData(prev => ({
      ...prev,
      [type]: { lat: presets[city].lat, lng: presets[city].lng }
    }))
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">🚚 Trip Details</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Driver Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Driver ID
              </label>
              <input
                type="text"
                name="driver_id"
                value={formData.driver_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Carrier Name
              </label>
              <input
                type="text"
                name="carrier_name"
                value={formData.carrier_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Truck Number
              </label>
              <input
                type="text"
                name="truck_number"
                value={formData.truck_number}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          {/* Current Cycle Used */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Cycle Used (Hours) - Property-carrying: 70hr/8day
            </label>
            <input
              type="number"
              name="current_cycle_used"
              min="0"
              max="70"
              step="0.5"
              value={formData.current_cycle_used}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Hours used in current 70-hour cycle (0-70)
            </p>
          </div>

          {/* Current Location */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-blue-800">📍 Current Location</h3>
              <div className="flex flex-wrap gap-1">
                {Object.keys(presets).slice(0, 4).map(city => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => applyPreset(city, 'current_location')}
                    className="px-2 py-1 text-xs bg-blue-200 text-blue-800 rounded hover:bg-blue-300"
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                <input
                  type="number"
                  name="current_lat"
                  step="0.0001"
                  placeholder="e.g., 34.0522"
                  value={formData.current_location.lat}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                <input
                  type="number"
                  name="current_lng"
                  step="0.0001"
                  placeholder="e.g., -118.2437"
                  value={formData.current_location.lng}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Pickup Location Toggle */}
          <div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasPickup}
                onChange={(e) => setHasPickup(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-gray-700 font-medium">Add Pickup Location</span>
            </label>
          </div>

          {/* Pickup Location */}
          {hasPickup && (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-yellow-800">📦 Pickup Location</h3>
                <div className="flex flex-wrap gap-1">
                  {Object.keys(presets).slice(0, 4).map(city => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => applyPreset(city, 'pickup_location')}
                      className="px-2 py-1 text-xs bg-yellow-200 text-yellow-800 rounded hover:bg-yellow-300"
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                  <input
                    type="number"
                    name="pickup_lat"
                    step="0.0001"
                    placeholder="Latitude"
                    value={formData.pickup_location.lat}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                  <input
                    type="number"
                    name="pickup_lng"
                    step="0.0001"
                    placeholder="Longitude"
                    value={formData.pickup_location.lng}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Dropoff Location */}
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-green-800">🏁 Dropoff Location</h3>
              <div className="flex flex-wrap gap-1">
                {Object.keys(presets).map(city => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => applyPreset(city, 'dropoff_location')}
                    className="px-2 py-1 text-xs bg-green-200 text-green-800 rounded hover:bg-green-300"
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                <input
                  type="number"
                  name="dropoff_lat"
                  step="0.0001"
                  placeholder="e.g., 40.7128"
                  value={formData.dropoff_location.lat}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                <input
                  type="number"
                  name="dropoff_lng"
                  step="0.0001"
                  placeholder="e.g., -74.0060"
                  value={formData.dropoff_location.lng}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-6 rounded-md font-semibold text-white transition-colors ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Calculating Route...
              </span>
            ) : (
              '🗺️ Calculate Route & Generate ELD Logs'
            )}
          </button>
        </form>

        {/* DOT Regulations Info */}
        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-2">📋 DOT Hours of Service Assumptions</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Property-carrying driver, 70hrs/8days cycle</li>
            <li>• Maximum 11 hours driving after 10-hour rest</li>
            <li>• 14-hour driving window from start of shift</li>
            <li>• Fuel stop every 1,000 miles (30 min each)</li>
            <li>• 1 hour allowed for pickup and drop-off</li>
            <li>• No adverse driving conditions</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default TripForm
