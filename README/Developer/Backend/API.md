## Backend API Documentation

We use Swagger to document all backend API routes. The Swagger UI provides an interactive interface to explore and test endpoints.

### Accessing the API Docs

Visit: [https://www.ahful.app/api/APIDocs/](https://www.ahful.app/api/APIDocs/)

### Local Development

When running the Flask app locally in debug mode, the Swagger documentation is typically available at:

```
http://localhost:5000/api/APIDocs/
```

### API Routes

The backend organizes routes by domain under `Backend/APIRoutes/`:

| Route File          | Description          |
|---------------------|----------------------|
| ExerciseRoute.py    | Exercise operations  |
| FoodRoutes.py       | Food/nutrition       |
| GymRoutes.py        | Gym management       |
| MeasurementRotues.py| Body measurements    |
| PersonalExRoutes.py | Personal exercises   |
| SignInRoutes.py     | Authentication       |
| SwaggerRoutes.py    | Swagger doc setup    |
| UserRoutes.py       | User management      |
| WorkoutRoutes.py    | Workout management   |
