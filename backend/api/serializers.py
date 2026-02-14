from rest_framework import serializers
from .models import Location, Trip, Route, Stop, ELDLog, ELDLogEntry

class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ['id', 'name', 'latitude', 'longitude', 'address', 'created_at']

class RouteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Route
        fields = ['id', 'trip', 'polyline', 'distance', 'duration', 'steps', 'created_at']

class StopSerializer(serializers.ModelSerializer):
    location = LocationSerializer(read_only=True)
    location_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = Stop
        fields = [
            'id', 'trip', 'location', 'location_id', 'stop_type', 
            'arrival_time', 'departure_time', 'duration', 
            'miles_driven', 'notes', 'sequence_order', 'created_at'
        ]

class ELDLogEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = ELDLogEntry
        fields = [
            'id', 'eld_log', 'event_time', 'status', 
            'location', 'miles_at_entry', 'hours_remaining', 
            'notes', 'created_at'
        ]

class ELDLogSerializer(serializers.ModelSerializer):
    entries = ELDLogEntrySerializer(many=True, read_only=True)
    
    class Meta:
        model = ELDLog
        fields = [
            'id', 'trip', 'log_date', 'driver_id', 'carrier_name',
            'truck_number', 'total_miles', 'cycle_hours_used',
            'status_entries', 'entries', 'created_at'
        ]

class TripSerializer(serializers.ModelSerializer):
    current_location_data = LocationSerializer(source='current_location', read_only=True)
    pickup_location_data = LocationSerializer(source='pickup_location', read_only=True)
    dropoff_location_data = LocationSerializer(source='dropoff_location', read_only=True)
    routes = RouteSerializer(many=True, read_only=True)
    stops = StopSerializer(many=True, read_only=True)
    eld_logs = ELDLogSerializer(many=True, read_only=True)
    
    class Meta:
        model = Trip
        fields = [
            'id', 'current_location', 'current_location_data',
            'pickup_location', 'pickup_location_data',
            'dropoff_location', 'dropoff_location_data',
            'current_cycle_used', 'status', 'total_distance',
            'estimated_duration', 'routes', 'stops', 'eld_logs',
            'created_at', 'updated_at'
        ]

class TripInputSerializer(serializers.Serializer):
    """Serializer for trip calculation input"""
    current_location = serializers.DictField(
        child=serializers.FloatField(),
        help_text="Current location with lat/lng"
    )
    pickup_location = serializers.DictField(
        child=serializers.FloatField(),
        required=False,
        allow_null=True,
        help_text="Pickup location with lat/lng (optional)"
    )
    dropoff_location = serializers.DictField(
        child=serializers.FloatField(),
        help_text="Dropoff location with lat/lng"
    )
    current_cycle_used = serializers.FloatField(
        min_value=0,
        max_value=70,
        help_text="Current cycle used in hours (0-70)"
    )
    driver_id = serializers.CharField(
        max_length=50,
        default='DRV001',
        required=False,
        help_text="Driver ID"
    )
    carrier_name = serializers.CharField(
        max_length=100,
        default='Test Carrier',
        required=False,
        help_text="Carrier/Company name"
    )
    truck_number = serializers.CharField(
        max_length=50,
        default='TRK001',
        required=False,
        help_text="Truck number"
    )

class RouteCalculationSerializer(serializers.Serializer):
    """Serializer for route calculation response"""
    origin = serializers.DictField()
    destination = serializers.DictField()
    distance_miles = serializers.FloatField()
    duration_hours = serializers.FloatField()
    polyline = serializers.CharField()
    steps = serializers.ListField()
    stops = serializers.ListField()
    eld_logs = serializers.ListField()
    total_days = serializers.IntegerField()
