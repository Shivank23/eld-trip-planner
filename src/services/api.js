import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export const calculateRoute = async (tripData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/calculate-route/`, tripData)
    return response.data
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.detail || 'Failed to calculate route')
    } else if (error.request) {
      // If the backend is not available, return mock data for demo
      console.warn('Backend unavailable, using demo data')
      return getMockTripData(tripData)
    }
    throw error
  }
}

// Mock data for demo when backend is unavailable
const getMockTripData = (tripData) => {
  const { current_location, pickup_location, dropoff_location, current_cycle_used } = tripData
  
  // Calculate approximate distance using coordinates
  const calculateDistance = (loc1, loc2) => {
    const R = 3959 // Earth's radius in miles
    const lat1 = loc1.lat * Math.PI / 180
    const lat2 = loc2.lat * Math.PI / 180
    const dlat = (loc2.lat - loc1.lat) * Math.PI / 180
    const dlon = (loc2.lng - loc1.lng) * Math.PI / 180
    const a = Math.sin(dlat/2)**2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon/2)**2
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }
  
  let totalDistance = calculateDistance(current_location, dropoff_location)
  if (pickup_location) {
    totalDistance = calculateDistance(current_location, pickup_location) + 
                    calculateDistance(pickup_location, dropoff_location)
  }
  
  const totalDuration = totalDistance / 55 // Average 55 mph
  const numFuelStops = Math.floor(totalDistance / 1000)
  
  const stops = []
  let currentPosition = current_location
  let milesSoFar = 0
  let currentTime = new Date()
  currentTime.setHours(6, 0, 0, 0)
  
  // Add pickup
  if (pickup_location) {
    stops.push({
      location: { name: 'Pickup Location', ...pickup_location },
      stop_type: 'pickup',
      arrival_time: currentTime.toISOString(),
      departure_time: new Date(currentTime.getTime() + 3600000).toISOString(),
      duration: 1,
      miles_driven: milesSoFar,
      notes: 'Pickup cargo - 1 hour allowed'
    })
    currentPosition = pickup_location
    currentTime = new Date(currentTime.getTime() + 3600000)
  }
  
  // Add driving segments and fuel stops
  const segmentDistance = totalDistance / (numFuelStops + 1)
  for (let i = 0; i < numFuelStops + 1; i++) {
    const driveEnd = new Date(currentTime.getTime() + (segmentDistance / 55) * 3600000)
    stops.push({
      location: { name: `Drive - Segment ${i+1}`, ...currentPosition },
      stop_type: 'driving',
      arrival_time: currentTime.toISOString(),
      departure_time: driveEnd.toISOString(),
      duration: segmentDistance / 55,
      miles_driven: milesSoFar + segmentDistance,
      notes: `Drive ${segmentDistance.toFixed(1)} miles`
    })
    
    milesSoFar += segmentDistance
    currentTime = new Date(driveEnd.getTime())
    
    if (i < numFuelStops) {
      const fuelPosition = {
        lat: currentPosition.lat + (dropoff_location.lat - currentPosition.lat) * 0.5,
        lng: currentPosition.lng + (dropoff_location.lng - currentPosition.lng) * 0.5
      }
      stops.push({
        location: { name: `Fuel Stop #${i+1}`, ...fuelPosition },
        stop_type: 'fuel',
        arrival_time: currentTime.toISOString(),
        departure_time: new Date(currentTime.getTime() + 1800000).toISOString(),
        duration: 0.5,
        miles_driven: milesSoFar,
        notes: 'Refuel vehicle - 30 minutes'
      })
      currentTime = new Date(currentTime.getTime() + 1800000)
      currentPosition = fuelPosition
    }
  }
  
  // Add dropoff
  stops.push({
    location: { name: 'Dropoff Location', ...dropoff_location },
    stop_type: 'dropoff',
    arrival_time: currentTime.toISOString(),
    departure_time: new Date(currentTime.getTime() + 3600000).toISOString(),
    duration: 1,
    miles_driven: totalDistance,
    notes: 'Drop off cargo - 1 hour allowed'
  })
  
  // Generate ELD logs
  const eldLogs = []
  const totalDays = Math.max(1, Math.ceil(totalDuration / 10))
  
  for (let day = 0; day < totalDays; day++) {
    const logDate = new Date()
    logDate.setDate(logDate.getDate() + day)
    
    eldLogs.push({
      log_date: logDate.toISOString().split('T')[0],
      driver_id: tripData.driver_id || 'DRV001',
      carrier_name: tripData.carrier_name || 'Test Carrier',
      truck_number: tripData.truck_number || 'TRK001',
      total_miles: Math.round((totalDistance / totalDays) * (day + 1)),
      cycle_hours_used: Math.min(11, Math.round(totalDuration / totalDays * (day + 1) * 10) / 10),
      status_entries: [
        { time: `${6 + day * 24}:00`, status: 'off_duty', location: 'Start of day', miles: 0, hours_remaining: 10 },
        { time: `${6 + day * 24 + 0.5}:30`, status: 'on_duty', location: 'Pre-trip inspection', miles: 0, hours_remaining: 10 },
        { time: `${7 + day * 24}:00`, status: 'driving', location: 'Begin driving', miles: 0, hours_remaining: 11 },
        { time: `${17 + day * 24}:00`, status: 'driving', location: 'End driving', miles: Math.round(totalDistance / totalDays), hours_remaining: 0 },
        { time: `${18 + day * 24}:00`, status: 'sleeper', location: 'Overnight rest', miles: Math.round(totalDistance / totalDays), hours_remaining: 10 }
      ],
      day_number: day + 1,
      total_trip_days: totalDays
    })
  }
  
  return {
    origin: current_location,
    destination: dropoff_location,
    distance_miles: Math.round(totalDistance),
    duration_hours: Math.round(totalDuration),
    polyline: '',
    steps: [],
    stops,
    eld_logs: eldLogs,
    total_days: totalDays
  }
}

export default { calculateRoute }
