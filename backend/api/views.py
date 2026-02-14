import requests
import json
import math
from datetime import datetime, timedelta
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Location, Trip, Route, Stop, ELDLog, ELDLogEntry
from .serializers import (
    LocationSerializer, TripSerializer, RouteSerializer, 
    StopSerializer, ELDLogSerializer, ELDLogEntrySerializer,
    TripInputSerializer, RouteCalculationSerializer
)
from django.conf import settings

# Constants for DOT hours of service
MAX_DRIVING_HOURS = 11  # Maximum driving hours in a 24-hour period
MAX_DRIVING_WINDOW = 14  # Maximum driving window (14-hour rule)
MIN_REST_BREAK = 10  # Minimum 10-hour rest break
FUEL_STOP_INTERVAL = 1000  # Fuel every 1000 miles
PICKUP_DROP_TIME = 1  # 1 hour for pickup/dropoff
WEEKLY_CYCLE_LIMIT = 70  # 70-hour weekly cycle
CYCLE_DAYS = 8  # 8-day cycle


class LocationViewSet(viewsets.ModelViewSet):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer


class TripViewSet(viewsets.ModelViewSet):
    queryset = Trip.objects.all()
    serializer_class = TripSerializer

    @action(detail=False, methods=['post'])
    def calculate_route(self, request):
        """Calculate route and generate ELD logs for a trip"""
        input_serializer = TripInputSerializer(data=request.data)
        if not input_serializer.is_valid():
            return Response(input_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = input_serializer.validated_data
        calculator = RouteCalculator()
        result = calculator.calculate(data)
        
        return Response(result)

    @action(detail=False, methods=['post'])
    def create_trip(self, request):
        """Create a trip with calculated route and ELD logs"""
        input_serializer = TripInputSerializer(data=request.data)
        if not input_serializer.is_valid():
            return Response(input_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = input_serializer.validated_data
        
        # Calculate route
        calculator = RouteCalculator()
        result = calculator.calculate(data)
        
        # Create trip in database
        trip = Trip.objects.create(
            current_cycle_used=data['current_cycle_used'],
            status='planned',
            total_distance=result['distance_miles'],
            estimated_duration=result['duration_hours']
        )
        
        # Create locations
        current_loc = Location.objects.create(
            name='Current Location',
            latitude=data['current_location']['lat'],
            longitude=data['current_location']['lng']
        )
        dropoff_loc = Location.objects.create(
            name='Dropoff Location',
            latitude=data['dropoff_location']['lat'],
            longitude=data['dropoff_location']['lng']
        )
        trip.current_location = current_loc
        trip.dropoff_location = dropoff_loc
        
        if data.get('pickup_location'):
            pickup_loc = Location.objects.create(
                name='Pickup Location',
                latitude=data['pickup_location']['lat'],
                longitude=data['pickup_location']['lng']
            )
            trip.pickup_location = pickup_loc
        
        trip.save()
        
        # Create route
        Route.objects.create(
            trip=trip,
            polyline=result.get('polyline', ''),
            distance=result['distance_miles'],
            duration=result['duration_hours'] * 3600,
            steps=result['steps']
        )
        
        # Create stops
        for i, stop_data in enumerate(result['stops']):
            loc = Location.objects.create(
                name=stop_data['location']['name'],
                latitude=stop_data['location'].get('lat', 0),
                longitude=stop_data['location'].get('lng', 0)
            )
            Stop.objects.create(
                trip=trip,
                location=loc,
                stop_type=stop_data['stop_type'],
                arrival_time=datetime.fromisoformat(stop_data['arrival_time']),
                departure_time=datetime.fromisoformat(stop_data['departure_time']),
                duration=stop_data['duration'],
                miles_driven=stop_data['miles_driven'],
                notes=stop_data.get('notes', ''),
                sequence_order=i
            )
        
        # Create ELD logs
        for log_data in result['eld_logs']:
            eld_log = ELDLog.objects.create(
                trip=trip,
                log_date=datetime.fromisoformat(log_data['log_date']).date(),
                driver_id=log_data['driver_id'],
                carrier_name=log_data['carrier_name'],
                truck_number=log_data['truck_number'],
                total_miles=log_data['total_miles'],
                cycle_hours_used=log_data['cycle_hours_used'],
                status_entries=log_data['status_entries']
            )
        
        serializer = TripSerializer(trip)
        return Response(serializer.data)


class RouteCalculationView(APIView):
    """API view for route calculations"""
    
    def post(self, request):
        """Calculate route and generate ELD logs"""
        input_serializer = TripInputSerializer(data=request.data)
        if not input_serializer.is_valid():
            return Response(input_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = input_serializer.validated_data
        calculator = RouteCalculator()
        result = calculator.calculate(data)
        
        return Response(result)


class RouteCalculator:
    """Route calculation logic using OSRM free API"""
    
    def __init__(self):
        self.osrm_base_url = getattr(settings, 'OSRM_BASE_URL', 'https://router.project-osrm.org')
    
    def calculate(self, data):
        """Main calculation method"""
        current_loc = data['current_location']
        pickup_loc = data.get('pickup_location')
        dropoff_loc = data['dropoff_location']
        current_cycle_used = data['current_cycle_used']
        
        # Get route from OSRM
        if pickup_loc:
            route1 = self.get_osrm_route(current_loc, pickup_loc)
            route2 = self.get_osrm_route(pickup_loc, dropoff_loc)
            total_distance = route1['distance'] + route2['distance']
            total_duration = route1['duration'] + route2['duration']
            full_route = route1['steps'] + route2['steps']
            polyline = route1.get('polyline', '') + ';' + route2.get('polyline', '')
        else:
            route = self.get_osrm_route(current_loc, dropoff_loc)
            total_distance = route['distance']
            total_duration = route['duration']
            full_route = route['steps']
            polyline = route.get('polyline', '')
        
        # Generate stops and ELD logs
        stops, eld_logs = self.generate_stops_and_logs(
            current_loc, pickup_loc, dropoff_loc,
            total_distance, current_cycle_used, data
        )
        
        total_days = len(eld_logs)
        
        return {
            'origin': current_loc,
            'destination': dropoff_loc,
            'distance_miles': round(total_distance, 1),
            'duration_hours': round(total_duration, 1),
            'polyline': polyline,
            'steps': full_route,
            'stops': stops,
            'eld_logs': eld_logs,
            'total_days': total_days
        }
    
    def get_osrm_route(self, origin, destination):
        """Get route from OSRM API - Free routing service"""
        try:
            url = f"{self.osrm_base_url}/route/v1/driving/{origin['lng']},{origin['lat']};{destination['lng']},{destination['lat']}"
            params = {
                'overview': 'full',
                'geometries': 'polyline',
                'steps': 'true'
            }
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if data.get('code') == 'Ok':
                route = data['routes'][0]
                return {
                    'distance': route['distance'] * 0.000621371,  # meters to miles
                    'duration': route['duration'] / 3600,  # seconds to hours
                    'polyline': route['geometry'],
                    'steps': self.process_steps(route['legs'][0]['steps'])
                }
        except Exception as e:
            pass
        
        # Fallback calculation using haversine
        return self.fallback_route(origin, destination)
    
    def fallback_route(self, origin, destination):
        """Fallback route calculation using haversine formula"""
        R = 3959  # Earth's radius in miles
        lat1, lon1 = math.radians(origin['lat']), math.radians(origin['lng'])
        lat2, lon2 = math.radians(destination['lat']), math.radians(destination['lng'])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        distance = R * c
        
        return {
            'distance': distance,
            'duration': distance / 55,  # Average 55 mph
            'polyline': '',
            'steps': [{
                'instruction': f'Drive from origin to destination',
                'distance': distance,
                'duration': distance / 55
            }]
        }
    
    def process_steps(self, steps):
        """Process OSRM route steps into simplified format"""
        processed = []
        for step in steps:
            processed.append({
                'instruction': step.get('maneuver', {}).get('instruction', 'Continue'),
                'name': step.get('name', ''),
                'distance': step.get('distance', 0) * 0.000621371,  # meters to miles
                'duration': step.get('duration', 0) / 3600  # seconds to hours
            })
        return processed
    
    def generate_stops_and_logs(self, current_loc, pickup_loc, dropoff_loc, 
                                total_distance, current_cycle_used, trip_data):
        """Generate planned stops and ELD logs based on DOT regulations"""
        stops = []
        eld_logs = []
        
        # Calculate number of fuel stops needed
        num_fuel_stops = max(0, int(total_distance / FUEL_STOP_INTERVAL))
        
        # Generate route stops
        all_stops = self.create_route_stops(
            current_loc, pickup_loc, dropoff_loc, 
            total_distance, num_fuel_stops
        )
        
        for stop in all_stops:
            stops.append(stop)
        
        # Generate ELD logs
        eld_logs = self.create_daily_logs(stops, trip_data)
        
        return stops, eld_logs
    
    def create_route_stops(self, current_loc, pickup_loc, dropoff_loc, total_distance, num_fuel_stops):
        """Create route stops including fuel and rest stops"""
        stops = []
        
        if total_distance == 0:
            return stops
        
        current_position = current_loc.copy()
        miles_so_far = 0
        current_time = datetime.now().replace(hour=6, minute=0, second=0, microsecond=0)
        
        # Add pickup if exists
        if pickup_loc:
            stops.append({
                'location': {'name': 'Pickup Location', **pickup_loc},
                'stop_type': 'pickup',
                'arrival_time': current_time.isoformat(),
                'departure_time': (current_time + timedelta(hours=1)).isoformat(),
                'duration': 1,
                'miles_driven': miles_so_far,
                'notes': 'Pickup cargo - 1 hour allowed'
            })
            current_position = pickup_loc
            current_time += timedelta(hours=1)
        
        # Create driving segments with fuel and rest stops
        if total_distance > 0:
            num_segments = max(1, num_fuel_stops + 1)
            segment_distance = total_distance / num_segments
            
            for i in range(num_segments):
                # Driving segment
                drive_end = current_time + timedelta(hours=segment_distance / 55)
                stops.append({
                    'location': {'name': f'Drive - Segment {i+1}', **current_position},
                    'stop_type': 'driving',
                    'arrival_time': current_time.isoformat(),
                    'departure_time': drive_end.isoformat(),
                    'duration': round(segment_distance / 55, 2),
                    'miles_driven': round(miles_so_far + segment_distance, 1),
                    'notes': f'Drive {segment_distance:.1f} miles'
                })
                
                miles_so_far += segment_distance
                current_time = drive_end
                
                # Add fuel stop (except last segment)
                if i < num_segments - 1 and num_fuel_stops > 0:
                    fuel_position = self.calculate_midpoint(current_position, dropoff_loc)
                    stops.append({
                        'location': {'name': f'Fuel Stop #{i+1}', **fuel_position},
                        'stop_type': 'fuel',
                        'arrival_time': current_time.isoformat(),
                        'departure_time': (current_time + timedelta(hours=0.5)).isoformat(),
                        'duration': 0.5,
                        'miles_driven': round(miles_so_far, 1),
                        'notes': 'Refuel vehicle - 30 minutes'
                    })
                    current_time += timedelta(hours=0.5)
                    current_position = fuel_position
                
                # Add rest stop after every 11 hours driving (except last segment)
                if i < num_segments - 1:
                    rest_position = self.calculate_midpoint(current_position, dropoff_loc)
                    stops.append({
                        'location': {'name': 'Rest Stop', **rest_position},
                        'stop_type': 'rest',
                        'arrival_time': current_time.isoformat(),
                        'departure_time': (current_time + timedelta(hours=10)).isoformat(),
                        'duration': 10,
                        'miles_driven': round(miles_so_far, 1),
                        'notes': 'Required 10-hour rest break (DOT)'
                    })
                    current_time += timedelta(hours=10)
                    current_position = rest_position
        
        # Add dropoff
        stops.append({
            'location': {'name': 'Dropoff Location', **dropoff_loc},
            'stop_type': 'dropoff',
            'arrival_time': current_time.isoformat(),
            'departure_time': (current_time + timedelta(hours=1)).isoformat(),
            'duration': 1,
            'miles_driven': round(total_distance, 1),
            'notes': 'Drop off cargo - 1 hour allowed'
        })
        
        return stops
    
    def calculate_midpoint(self, current, destination):
        """Calculate intermediate position along route"""
        return {
            'lat': current['lat'] + (destination['lat'] - current['lat']) * 0.5,
            'lng': current['lng'] + (destination['lng'] - current['lng']) * 0.5
        }
    
    def create_daily_logs(self, stops, trip_data):
        """Create daily ELD logs based on DOT format"""
        daily_logs = []
        
        # Group stops by day
        day_stops = {}
        current_day = 1
        
        for stop in stops:
            if stop['stop_type'] in ['driving', 'fuel', 'rest']:
                if current_day not in day_stops:
                    day_stops[current_day] = []
                day_stops[current_day].append(stop)
                
                # Add new day after rest
                if stop['stop_type'] == 'rest':
                    current_day += 1
        
        # Ensure at least one day
        if not day_stops:
            day_stops[1] = []
        
        total_days = len(day_stops)
        
        for day in range(1, total_days + 1):
            log_date = datetime.now().date() + timedelta(days=day-1)
            
            entries = []
            day_stops_list = day_stops.get(day, [])
            total_day_miles = sum(s.get('miles_driven', 0) - (day_stops_list[0].get('miles_driven', 0) if day_stops_list else 0) for s in day_stops_list) or 0
            
            # Standard DOT log entries for the day
            entries.append({
                'time': f'{6 + (day-1)*24:02d}:00',
                'status': 'off_duty',
                'location': 'Start of day',
                'miles': 0,
                'hours_remaining': 10
            })
            
            entries.append({
                'time': f'{6 + (day-1)*24 + 0.5:.0f}:30',
                'status': 'on_duty',
                'location': 'Pre-trip inspection',
                'miles': 0,
                'hours_remaining': 10
            })
            
            entries.append({
                'time': f'{7 + (day-1)*24:02d}:00',
                'status': 'driving',
                'location': 'Begin driving',
                'miles': 0,
                'hours_remaining': 11
            })
            
            # Add driving entries for the day
            driving_hours = 0
            for stop in day_stops_list:
                if stop['stop_type'] == 'driving':
                    driving_hours += stop.get('duration', 0)
                    if driving_hours <= 11:
                        entries.append({
                            'time': f'{8 + (day-1)*24 + driving_hours:02d}:00',
                            'status': 'driving',
                            'location': stop.get('notes', 'Driving'),
                            'miles': stop.get('miles_driven', 0),
                            'hours_remaining': round(11 - driving_hours, 1)
                        })
            
            entries.append({
                'time': f'{17 + (day-1)*24:02d}:00',
                'status': 'driving',
                'location': 'End driving',
                'miles': total_day_miles,
                'hours_remaining': 0
            })
            
            entries.append({
                'time': f'{18 + (day-1)*24:02d}:00',
                'status': 'sleeper',
                'location': 'Overnight rest',
                'miles': total_day_miles,
                'hours_remaining': 10
            })
            
            daily_log = {
                'log_date': log_date.isoformat(),
                'driver_id': trip_data.get('driver_id', 'DRV001'),
                'carrier_name': trip_data.get('carrier_name', 'Test Carrier'),
                'truck_number': trip_data.get('truck_number', 'TRK001'),
                'total_miles': round(total_day_miles, 1),
                'cycle_hours_used': round(driving_hours, 1),
                'status_entries': entries,
                'day_number': day,
                'total_trip_days': total_days
            }
            
            daily_logs.append(daily_log)
        
        return daily_logs
