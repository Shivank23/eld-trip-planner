from django.db import models
from django.conf import settings

class Location(models.Model):
    """Model for storing location coordinates"""
    name = models.CharField(max_length=255)
    latitude = models.FloatField()
    longitude = models.FloatField()
    address = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        indexes = [
            models.Index(fields=['latitude', 'longitude']),
        ]

class Trip(models.Model):
    """Model for storing trip details"""
    TRIP_STATUS_CHOICES = [
        ('planned', 'Planned'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    ]

    current_location = models.ForeignKey(
        Location, 
        on_delete=models.CASCADE, 
        related_name='current_trips',
        null=True,
        blank=True
    )
    pickup_location = models.ForeignKey(
        Location, 
        on_delete=models.CASCADE, 
        related_name='pickup_trips',
        null=True,
        blank=True
    )
    dropoff_location = models.ForeignKey(
        Location, 
        on_delete=models.CASCADE, 
        related_name='dropoff_trips',
        null=True,
        blank=True
    )
    current_cycle_used = models.FloatField(
        help_text="Current cycle used in hours"
    )
    status = models.CharField(
        max_length=20, 
        choices=TRIP_STATUS_CHOICES, 
        default='planned'
    )
    total_distance = models.FloatField(
        default=0, 
        help_text="Total trip distance in miles"
    )
    estimated_duration = models.FloatField(
        default=0, 
        help_text="Estimated duration in hours"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Trip #{self.id} - {self.status}"

class Route(models.Model):
    """Model for storing route information"""
    trip = models.ForeignKey(
        Trip, 
        on_delete=models.CASCADE, 
        related_name='routes'
    )
    polyline = models.TextField(
        help_text="Encoded polyline for the route"
    )
    distance = models.FloatField(
        help_text="Route distance in miles"
    )
    duration = models.FloatField(
        help_text="Route duration in seconds"
    )
    steps = models.JSONField(
        default=list,
        help_text="Route steps as JSON"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Route for Trip #{self.trip.id}"

class Stop(models.Model):
    """Model for storing stops along the route"""
    STOP_TYPE_CHOICES = [
        ('fuel', 'Fuel Stop'),
        ('rest', 'Rest Stop'),
        ('pickup', 'Pickup'),
        ('dropoff', 'Dropoff'),
        ('break', 'Break'),
    ]

    trip = models.ForeignKey(
        Trip, 
        on_delete=models.CASCADE, 
        related_name='stops'
    )
    location = models.ForeignKey(
        Location, 
        on_delete=models.CASCADE
    )
    stop_type = models.CharField(
        max_length=20, 
        choices=STOP_TYPE_CHOICES
    )
    arrival_time = models.DateTimeField()
    departure_time = models.DateTimeField()
    duration = models.FloatField(
        help_text="Stop duration in hours"
    )
    miles_driven = models.FloatField(
        default=0,
        help_text="Miles driven to reach this stop"
    )
    notes = models.TextField(blank=True, null=True)
    sequence_order = models.IntegerField(
        default=0,
        help_text="Order of the stop in the trip"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.stop_type} - {self.location.name}"

class ELDLog(models.Model):
    """Model for storing ELD (Electronic Logging Device) daily logs"""
    STATUS_CHOICES = [
        ('off_duty', 'Off Duty'),
        ('sleeper', 'Sleeper Berth'),
        ('driving', 'Driving'),
        ('on_duty', 'On Duty (Not Driving)'),
    ]

    trip = models.ForeignKey(
        Trip, 
        on_delete=models.CASCADE, 
        related_name='eld_logs'
    )
    log_date = models.DateField()
    driver_id = models.CharField(
        max_length=50, 
        default='DRV001',
        help_text="Driver identification"
    )
    carrier_name = models.CharField(
        max_length=100, 
        default='Test Carrier',
        help_text="Carrier/Company name"
    )
    truck_number = models.CharField(
        max_length=50, 
        default='TRK001',
        help_text="Truck identification"
    )
    total_miles = models.FloatField(
        default=0,
        help_text="Total miles driven on this day"
    )
    cycle_hours_used = models.FloatField(
        default=0,
        help_text="Cycle hours used on this day"
    )
    status_entries = models.JSONField(
        default=list,
        help_text="List of status changes throughout the day"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"ELD Log - {self.log_date} for Trip #{self.trip.id}"

class ELDLogEntry(models.Model):
    """Individual entries within an ELD log"""
    eld_log = models.ForeignKey(
        ELDLog, 
        on_delete=models.CASCADE, 
        related_name='entries'
    )
    event_time = models.DateTimeField()
    status = models.CharField(
        max_length=20, 
        choices=ELDLog.STATUS_CHOICES
    )
    location = models.ForeignKey(
        Location, 
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    miles_at_entry = models.FloatField(
        default=0,
        help_text="Total miles at time of entry"
    )
    hours_remaining = models.FloatField(
        default=0,
        help_text="Hours remaining in current status"
    )
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Entry - {self.event_time} - {self.status}"
