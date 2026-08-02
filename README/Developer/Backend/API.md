## Backend API Documentation

We use Swagger to document all backend API routes. The Swagger UI provides an interactive interface to explore and test endpoints.

### Accessing the API Docs

- **Production**: [https://www.ahful.app/api/APIDocs/](https://www.ahful.app/api/APIDocs/)
- **Local**: `https://www.ahful.app/api/APIDocs/` (when running the Flask dev server)

### Backend Route Files

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

---

## External APIs

The project integrates with several external services. Some require configuration via environment variables.

### Google OAuth 2.0 — User Authentication

- **Purpose**: User sign-in via Google accounts
- **Endpoint**: `https://accounts.google.com/o/oauth2/v2/auth` (frontend), `https://oauth2.googleapis.com/tokeninfo` (backend verification)
- **Auth method**: OAuth 2.0 (Client ID + JWT ID token verification)
- **Libraries used**: `@react-oauth/google` (frontend), `google-auth` / `google-auth-oauthlib` (backend)
- **Config vars**: `GOOGLE_CLIENT_ID` (backend), `VITE_GOOGLE_CLIENT_ID` (frontend)
- **Usage**: Frontend `GoogleOAuthProvider` wraps the app; backend `SignInDriver.verify_google_token()` validates the token

### Firebase Cloud Messaging — Push Notifications

- **Purpose**: Push notifications for overdue tasks, friend requests, and workout reminders
- **Endpoint**: `https://fcm.googleapis.com` (via Firebase SDK)
- **Auth method**: Firebase project API key + VAPID key for web push
- **Libraries used**: `firebase` (frontend), `firebase-admin` (backend)
- **Config vars**: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_MEASUREMENT_ID`
- **Usage**: Frontend requests FCM tokens via service worker; backend `NotificationScheduler.py` sends messages via `firebase_admin.messaging`

### Google Gemini / Vertex AI — AI Chat Companion

- **Purpose**: AI-powered chat companion using the Gemini model
- **Endpoint**: `https://generativelanguage.googleapis.com` (via google-adk SDK)
- **Model**: `gemini-2.5-flash`
- **Auth method**: Google Cloud Application Default Credentials (ADC)
- **Libraries used**: `google-adk` (v1.28.1), `google-genai`
- **Usage**: Backend `character.py` defines an `LlmAgent`; `ChatRoutes.py` processes messages via `InMemoryRunner`

### Gmail API — Email Notifications

- **Purpose**: Send verification emails and transactional emails to users
- **Endpoint**: `https://gmail.googleapis.com/gmail/v1/users/me/messages/send`
- **Auth method**: OAuth 2.0 user credentials (stored in `token.json`)
- **Libraries used**: `googleapiclient` (via `google-auth-oauthlib`)
- **Config vars**: `GMAIL_SENDER_ADDRESS`
- **Usage**: Backend `EmailDriver.py` builds a Gmail service and sends MIME messages

### Gmail SMTP — Email Fallback

- **Purpose**: Fallback email delivery when Gmail API is unavailable
- **Endpoint**: `smtp.gmail.com:587` with TLS
- **Auth method**: SMTP username/password
- **Libraries used**: Flask-Mail
- **Config vars**: `MAIL_USERNAME`, `MAIL_PASSWORD`
- **Usage**: Backend `AHFULbackend.py` configures Flask-Mail as an alternative send method

### USDA FoodData Central — Nutritional Data

- **Purpose**: Search for foods and retrieve nutritional information
- **Endpoint**: `https://api.nal.usda.gov/fdc/v1/foods/search`
- **Auth method**: API key passed as query parameter (`api_key`)
- **Libraries used**: `requests`
- **Config vars**: `USDA_API_KEY`
- **Usage**: Backend `FoodDriver.search_usda_foods()` calls the API and processes JSON results

### MongoDB Atlas — Database

- **Purpose**: Primary database for all application data (users, workouts, foods, measurements, etc.)
- **Endpoint**: Connection string from `MONGODB_URI` (typically `mongodb+srv://...`)
- **Auth method**: Embedded credentials in connection string + TLS (via `certifi`)
- **Libraries used**: `pymongo` (v4.16.0)
- **Config vars**: `MONGODB_URI` (required), `MONGODB_NAME`
- **Usage**: Backend `MongoDriver.connect_mongo()` creates the client; all DataModels use it

### OpenStreetMap Nominatim — Geocoding

- **Purpose**: Reverse geocoding (lat/lng to address) and forward geocoding (address to lat/lng) for gym locations
- **Endpoint**: `https://nominatim.openstreetmap.org/reverse` / `search`
- **Auth method**: None (free tier; requires User-Agent header)
- **Usage**: Frontend `QueryFunctions.js` provides `reverseGeocode()` and `forwardGeocode()` functions

### OpenStreetMap Tiles — Map Display

- **Purpose**: Display map tiles for the gym location map
- **Endpoint**: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- **Auth method**: None (free tier; attribution required)
- **Libraries used**: `leaflet` (v1.9.4), `react-leaflet` (v5.0.0-rc.2)
- **Usage**: Frontend `Map.jsx` renders a `<TileLayer>` with OSM tiles and attribution
