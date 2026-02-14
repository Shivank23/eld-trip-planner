import React, { useEffect, useRef } from 'react'
import L from 'leaflet'

const RouteMap = ({ origin, destination, polyline, stops }) => {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)

  const getStopIcon = (stopType) => {
    const colors = {
      pickup: '#eab308', // yellow
      dropoff: '#22c55e', // green
      fuel: '#ef4444', // red
      rest: '#3b82f6', // blue
      driving: '#6b7280' // gray
    }
    
    const icons = {
      pickup: '📦',
      dropoff: '🏁',
      fuel: '⛽',
      rest: '🛏️',
      driving: '🚛'
    }
    
    return L.divIcon({
      html: `<div style="
        background-color: ${colors[stopType] || '#6b7280'};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">${icons[stopType] || '📍'}</div>`,
      className: 'custom-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    })
  }

  useEffect(() => {
    if (!mapRef.current) return

    // Initialize map
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView(
        [origin.lat, origin.lng],
        5
      )

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
      }).addTo(mapInstanceRef.current)
    }

    const map = mapInstanceRef.current

    // Clear existing layers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer)
      }
    })

    // Add markers
    L.marker([origin.lat, origin.lng], { 
      icon: getStopIcon('driving')
    }).addTo(map)
      .bindPopup(`<b>📍 Current Location</b><br>Lat: ${origin.lat}<br>Lng: ${origin.lng}`)
      .openPopup()

    L.marker([destination.lat, destination.lng], { 
      icon: getStopIcon('dropoff')
    }).addTo(map)
      .bindPopup(`<b>🏁 Destination</b><br>Lat: ${destination.lat}<br>Lng: ${destination.lng}`)

    // Add stop markers
    stops.forEach((stop, index) => {
      if (stop.stop_type !== 'driving' && stop.location) {
        L.marker([stop.location.lat, stop.location.lng], {
          icon: getStopIcon(stop.stop_type)
        }).addTo(map)
          .bindPopup(`
            <b>${stop.stop_type.toUpperCase()} #${index + 1}</b><br>
            <b>${stop.location.name}</b><br>
            <i>${stop.notes}</i><br>
            <b>Duration:</b> ${stop.duration}h<br>
            <b>Miles:</b> ${stop.miles_driven}
          `)
      }
    })

    // Draw route line (simplified)
    const routeCoords = [
      [origin.lat, origin.lng],
      ...stops.filter(s => s.location && s.stop_type !== 'driving').map(s => [s.location.lat, s.location.lng]),
      [destination.lat, destination.lng]
    ]

    L.polyline(routeCoords, {
      color: '#2563eb',
      weight: 4,
      opacity: 0.8
    }).addTo(map)

    // Fit bounds to show entire route
    if (routeCoords.length > 0) {
      map.fitBounds(routeCoords, { padding: [50, 50] })
    }

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [origin, destination, polyline, stops])

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">🗺️ Route Map</h3>
      
      {/* Map container */}
      <div 
        ref={mapRef} 
        className="w-full h-96 rounded-lg border border-gray-300"
        style={{ minHeight: '400px' }}
      />
      
      {/* Route Legend */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-700 mb-3">Route Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xl">📍</span>
            <span className="text-sm text-gray-600">Current</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xl">📦</span>
            <span className="text-sm text-gray-600">Pickup</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xl">⛽</span>
            <span className="text-sm text-gray-600">Fuel</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xl">🛏️</span>
            <span className="text-sm text-gray-600">Rest</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xl">🏁</span>
            <span className="text-sm text-gray-600">Dropoff</span>
          </div>
        </div>
      </div>
      
      {/* Stops List */}
      <div className="mt-6">
        <h4 className="font-semibold text-gray-700 mb-3">📋 Planned Stops ({stops.length})</h4>
        <div className="max-h-60 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="text-left p-2">Type</th>
                <th className="text-left p-2">Location</th>
                <th className="text-left p-2">Duration</th>
                <th className="text-left p-2">Miles</th>
              </tr>
            </thead>
            <tbody>
              {stops.map((stop, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      stop.stop_type === 'pickup' ? 'bg-yellow-100 text-yellow-800' :
                      stop.stop_type === 'dropoff' ? 'bg-green-100 text-green-800' :
                      stop.stop_type === 'fuel' ? 'bg-red-100 text-red-800' :
                      stop.stop_type === 'rest' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {stop.stop_type.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-2">{stop.location?.name || 'Driving'}</td>
                  <td className="p-2">{stop.duration}h</td>
                  <td className="p-2">{stop.miles_driven}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default RouteMap
