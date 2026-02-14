import React, { useState } from 'react'

const ELDLogs = ({ logs }) => {
  const [selectedDay, setSelectedDay] = useState(0)

  if (!logs || logs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">📋 ELD Daily Logs</h3>
        <p className="text-gray-500">No logs available</p>
      </div>
    )
  }

  const currentLog = logs[selectedDay]
  
  const getStatusColor = (status) => {
    const colors = {
      'off_duty': '#9ca3af',
      'sleeper': '#6b7280',
      'driving': '#16a34a',
      'on_duty': '#f59e0b'
    }
    return colors[status] || '#6b7280'
  }

  const getStatusLabel = (status) => {
    const labels = {
      'off_duty': 'OFF DUTY',
      'sleeper': 'SLEEPER',
      'driving': 'DRIVING',
      'on_duty': 'ON DUTY'
    }
    return labels[status] || status
  }

  const parseTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours + minutes / 60
  }

  const calculateStatusBars = (entries) => {
    const bars = []
    const statusDurations = { off_duty: 0, sleeper: 0, driving: 0, on_duty: 0 }
    
    for (let i = 0; i < entries.length - 1; i++) {
      const startTime = parseTime(entries[i].time)
      const endTime = parseTime(entries[i + 1].time) || 24
      const duration = endTime - startTime
      statusDurations[entries[i].status] += duration
    }
    
    return statusDurations
  }

  const statusDurations = calculateStatusBars(currentLog.status_entries)

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">📋 DOT Daily ELD Logs</h3>
      
      {/* Day Selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {logs.map((log, index) => (
          <button
            key={index}
            onClick={() => setSelectedDay(index)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedDay === index
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Day {log.day_number} ({log.log_date})
          </button>
        ))}
      </div>

      {/* Current Log Display */}
      <div className="border-2 border-gray-300 rounded-lg p-4 mb-6">
        {/* Header */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 border-b pb-4">
          <div>
            <p className="text-xs text-gray-500">Driver ID</p>
            <p className="font-semibold">{currentLog.driver_id}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Carrier</p>
            <p className="font-semibold">{currentLog.carrier_name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Truck #</p>
            <p className="font-semibold">{currentLog.truck_number}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Date</p>
            <p className="font-semibold">{currentLog.log_date}</p>
          </div>
        </div>

        {/* 24-Hour Grid */}
        <div className="mb-4">
          <h4 className="font-semibold text-gray-700 mb-2">24-Hour Log Sheet</h4>
          <div className="relative h-48 border-2 border-gray-800 rounded-lg overflow-hidden">
            {/* Grid lines */}
            <div className="absolute inset-0 eld-grid" style={{ backgroundSize: '4.167% 10%' }}></div>
            
            {/* Time labels */}
            <div className="absolute top-0 left-0 w-full h-full">
              {[0, 4, 8, 12, 16, 20, 24].map((hour) => (
                <div
                  key={hour}
                  className="absolute top-0 bottom-0 border-l border-gray-300"
                  style={{ left: `${(hour / 24) * 100}%` }}
                >
                  <span className="absolute -top-5 text-xs text-gray-500 bg-white px-1">
                    {hour}:00
                  </span>
                </div>
              ))}
            </div>
            
            {/* Status bars */}
            <div className="absolute inset-0">
              {currentLog.status_entries.slice(0, -1).map((entry, index) => {
                const startTime = parseTime(entry.time)
                const endTime = parseTime(currentLog.status_entries[index + 1]?.time) || 24
                const left = (startTime / 24) * 100
                const width = ((endTime - startTime) / 24) * 100
                
                return (
                  <div
                    key={index}
                    className="absolute h-12 border border-white"
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      backgroundColor: getStatusColor(entry.status)
                    }}
                  >
                    <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">
                      {width > 5 ? getStatusLabel(entry.status) : ''}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-gray-100 p-3 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: getStatusColor('off_duty') }}></div>
              <span className="text-sm text-gray-600">Off Duty</span>
            </div>
            <p className="text-xl font-bold">{statusDurations.off_duty.toFixed(1)}h</p>
          </div>
          <div className="bg-gray-100 p-3 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: getStatusColor('sleeper') }}></div>
              <span className="text-sm text-gray-600">Sleeper</span>
            </div>
            <p className="text-xl font-bold">{statusDurations.sleeper.toFixed(1)}h</p>
          </div>
          <div className="bg-gray-100 p-3 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: getStatusColor('driving') }}></div>
              <span className="text-sm text-gray-600">Driving</span>
            </div>
            <p className="text-xl font-bold">{statusDurations.driving.toFixed(1)}h</p>
          </div>
          <div className="bg-gray-100 p-3 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: getStatusColor('on_duty') }}></div>
              <span className="text-sm text-gray-600">On Duty</span>
            </div>
            <p className="text-xl font-bold">{statusDurations.on_duty.toFixed(1)}h</p>
          </div>
        </div>

        {/* Miles and Hours */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-600">Total Miles Today</p>
            <p className="text-2xl font-bold text-blue-800">{currentLog.total_miles} mi</p>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg">
            <p className="text-sm text-orange-600">Cycle Hours Used</p>
            <p className="text-2xl font-bold text-orange-800">{currentLog.cycle_hours_used} hrs</p>
          </div>
        </div>

        {/* Detailed Entries Table */}
        <div>
          <h4 className="font-semibold text-gray-700 mb-2">Detailed Entries</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left p-2">Time</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Location</th>
                  <th className="text-left p-2">Miles</th>
                  <th className="text-left p-2">Hours Rem.</th>
                </tr>
              </thead>
              <tbody>
                {currentLog.status_entries.map((entry, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{entry.time}</td>
                    <td className="p-2">
                      <span 
                        className="px-2 py-1 rounded text-xs font-medium text-white"
                        style={{ backgroundColor: getStatusColor(entry.status) }}
                      >
                        {getStatusLabel(entry.status)}
                      </span>
                    </td>
                    <td className="p-2">{entry.location}</td>
                    <td className="p-2">{entry.miles}</td>
                    <td className="p-2">{entry.hours_remaining}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Print Button */}
      <div className="flex justify-end">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          🖨️ Print Log Sheet
        </button>
      </div>
    </div>
  )
}

export default ELDLogs
