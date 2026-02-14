from django.http import JsonResponse
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LocationViewSet, TripViewSet, RouteCalculationView

def api_root(request):
    return JsonResponse({
        'status': 'running',
        'message': 'ELD Trip Planner API',
        'endpoints': {
            'calculate_route': '/api/calculate-route/',
            'locations': '/api/locations/',
            'trips': '/api/trips/',
            'admin': '/admin/'
        }
    })

router = DefaultRouter()
router.register(r'locations', LocationViewSet)
router.register(r'trips', TripViewSet)

urlpatterns = [
    path('', api_root, name='api-root'),
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/calculate-route/', RouteCalculationView.as_view(), name='calculate-route'),
]
