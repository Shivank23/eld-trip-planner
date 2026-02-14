# ELD Trip Planner 🛻

A full-stack web application for truck drivers to plan routes and generate ELD (Electronic Logging Device) daily logs compliant with DOT Hours of Service regulations.

## Features

- **Route Planning**: Calculate optimal routes between locations using OSRM (Open Source Routing Machine) free API
- **ELD Log Generation**: Generate DOT-compliant daily log sheets based on trip details
- **Map Visualization**: Interactive map showing route and planned stops
- **Stops Planning**: Automatically calculate fuel stops (every 1,000 miles) and rest breaks
- **Cycle Tracking**: Track 70-hour/8-day cycle usage

## Technology Stack

### Backend
- **Django** - Python web framework
- **Django REST Framework** - API development
- **OSRM** - Free routing API for route calculation
- **SQLite** - Database (easily switchable to PostgreSQL)

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Leaflet** - Interactive maps
- **Axios** - HTTP client

## Prerequisites

- Node.js 18+ 
- Python 3.9+
- npm or yarn

## Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd eld-truck-app
```

### 2. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

The backend will run at `http://localhost:8000`

### 3. Install Frontend Dependencies

```bash
cd frontend
npm install
npm run dev
```

The frontend will run at `http://localhost:3000`

## Deployment

### Deploying to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure build settings:
   - Build Command: `npm run build`
   - Output Directory: `frontend/dist`
   - Install Command: `npm install`

### Deploying Backend

For the Django backend, you can deploy to:
- **Railway** - Easy Python app deployment
- **Render** - Free tier available
- **Fly.io** - Edge deployment
- **Heroku** - Classic PaaS

Example Railway deployment:
```bash
npm install -g railway
railway login
railway init
railway up
```

## API Endpoints

### Calculate Route
`POST /api/calculate-route/`

**Request Body:**
```json
{
  "current_location": {"lat": 34.0522, "lng": -118.2437},
  "pickup_location": {"lat": 35.2220, "lng": -101.8313},
  "dropoff_location": {"lat": 40.7128, "lng": -74.0060},
  "current_cycle_used": 25.5,
  "driver_id": "DRV001",
  "carrier_name": "Test Carrier",
  "truck_number": "TRK001"
}
```

**Response:**
```json
{
  "origin": {"lat": 34.0522, "lng": -118.2437},
  "destination": {"lat": 40.7128, "lng": -74.0060},
  "distance_miles": 2800,
  "duration_hours": 51,
  "polyline": "...",
  "steps": [...],
  "stops": [...],
  "eld_logs": [...],
  "total_days": 5
}
```

## DOT Hours of Service Assumptions

This application follows these DOT regulations for property-carrying drivers:

- **70-hour cycle** over 8 consecutive days
- **Maximum 11 hours** driving after 10-hour rest break
- **14-hour driving window** from start of shift
- **Fuel stops** every 1,000 miles (30 minutes each)
- **1 hour** allowed for pickup and drop-off operations
- **No adverse driving conditions**

## Project Structure

```
eld-truck-app/
├── backend/
│   ├── backend/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── models.py
│   │   ├── views.py
│   │   └── serializers.py
│   ├── requirements.txt
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── TripForm.jsx
│   │   │   ├── RouteMap.jsx
│   │   │   ├── ELDLogs.jsx
│   │   │   └── TripSummary.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── vercel.json
└── README.md
```

## Demo Mode

If the backend is unavailable, the frontend will automatically use mock data to demonstrate the application's functionality.

## License

MIT License

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For issues or questions, please open a GitHub issue.
