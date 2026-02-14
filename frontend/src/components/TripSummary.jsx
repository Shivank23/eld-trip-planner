import React from 'react'

const TripSummary = ({ tripData, onReset }) => {
  const { distance_miles, duration_hours, stops, eld_logs, origin, destination } = tripData

  const fuelStops = stops?.filter(s => s.stop_type === 'fuel') || []
  const restStops = stops?.filter(s => s.stop_type === 'rest') || []
  const totalStops = stops?.length || 0

  const calculateTotalTime = () => {
    if (!stops || stops.length === 0) return 0
    const firstArrival = new Date(stops[0].arrival_time)
    const lastDeparture = new Date(stops[stops.length - 1].departure_time)
    return (lastDeparture - firstArrival) / (1000 * 60 * 60) // hours
  }

  const totalTime = calculateTotalTime()
  const avgSpeed = duration_hours > 0 ? (distance_miles / duration_hours).toFixed(1) : 0

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-6">📊 Trip Summary</h3>

      {/* Route Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">🛤️ Route</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-xl">📍</span>
              <span className="text-gray-700">
                Lat: {origin.lat.toFixed(4)}, Lng: {origin.lng.toFixed(4)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-blue-500">↓</span>
              <span className="text-gray-500">{distance_miles} miles</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xl">🏁</span>
              <span className="text-gray-700">
                Lat: {destination.lat.toFixed(4)}, Lng: {destination.lng.toFixed(4)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-semibold text-green-800 mb-2">📈 Statistics</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Total Distance</p>
              <p className="text-2xl font-bold text-green-700">{distance_miles} mi</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Est. Duration</p>
              <p className="text-2xl font-bold text-green-700">{duration_hours} hrs</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Speed</p>
              <p className="text-xl font-bold text-green-700">{avgSpeed} mph</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Days</p>
              <p className="text-xl font-bold text-green-700">{eld_logs?.length || 1} days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stops Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-100 p-4 rounded-lg text-center">
          <p className="text-3xl font-bold text-gray-700">{totalStops}</p>
          <p className="text-sm text-gray-500">Total Stops</p>
        </div>
        <div className="bg-red-100 p-4 rounded-lg text-center">
          <p className="text-3xl font-bold text-red-700">{fuelStops.length}</p>
          <p className="text-sm text-gray-500">Fuel Stops</p>
        </div>
        <div className="bg-blue-100 p-4 rounded-lg text-center">
          <p className="text-3xl font-bold text-blue-700">{restStops.length}</p>
          <p className="text-sm text-gray-500">Rest Stops</p>
        </div>
        <div className="bg-yellow-100 p-4 rounded-lg text-center">
          <p className="text-3xl font-bold text-yellow-700">{totalTime.toFixed(0)}</p>
          <p className="text-sm text-gray-500">Total Hours</p>
        </div>
      </div>

      {/* ELD Logs Summary */}
      {eld_logs && eld_logs.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold text-gray-700 mb-3">📋 Daily ELD Logs Summary</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left p-2">Day</th>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Miles</th>
                  <th className="text-left p-2">Hours Used</th>
                  <th className="text-left p-2">Driving Hours</th>
                </tr>
              </thead>
              <tbody>
                {eld_logs.map((log, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">Day {log.day_number}</td>
                    <td className="p-2">{log.log_date}</td>
                    <td className="p-2">{log.total_miles} mi</td>
                    <td className="p-2">{log.cycle_hours_used}h</td>
                    <td className="p-2">
                      {log.status_entries.filter(e => e.status === 'driving').length * 2}h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cycle Info */}
      <div className="bg-yellow-50 p-4 rounded-lg mb-6">
        <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Cycle Information</h4>
        <p className="text-sm text-gray-600 mb-2">
          Property-carrying driver following DOT Hours of Service regulations:
        </p>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• 70-hour cycle limit over 8 consecutive days</li>
          <li>• Maximum 11 hours driving after 10-hour rest break</li>
          <li>• 14-hour driving window from start of shift</li>
          <li>• 30-minute fuel stops included in schedule</li>
          <li>• 1 hour allowed for pickup and drop-off operations</li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-4 justify-between">
        <button
          onClick={onReset}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
          🔄 Plan New Trip
        </button>
        <button
          onClick={() => window.print()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          🖨️ Print Trip Summary
        </button>
      </div>
    </div>
  )
}

export default TripSummary

