### Backend Directory Structure
```
Backend/
├── APIRoutes/                  # Backend API Endpoint Routes Called by Frontend. APIs call Services/Drivers
│   ├── ExerciseRoute.py        # Exercise Releated
│   ├── FoodRoutes.py           # Food Releated
│   ├── GymRoutes.py            # Gym Related
│   ├── MeasurementRotues.py    # Body Measurement Related
│   ├── PersonalExRoutes.py     # SPersonal Exercise Related
│   ├── SignInRoutes.py         # Sign In Process Related
│   ├── SwaggerRoutes.py        # Swagger / API Doc Relates
│   ├── UserRoutes.py           # User Realted
│   └── WorkoutRoutes.py        # Workout Related
│
├── DataModels/                 # Data Models to Interact with Collections in the Database.
│   ├── ExerciseObject.py       # Exercise Collection Operations
│   ├── FoodObject.py           # Food Collection Operations
│   ├── GymObject.py            # Gym Collection Operations
│   ├── MeasurementObject.py    # Measurement Collection Operations
│   ├── PersonalExObject.py     # Personal Exercise Collection Operations
│   ├── UserObject.py           # User Collection Operations
│   └── WorkoutObject.py        # Workout Collection Operations
│
├── Services/                   # Services / Drivers to work between API Route and Data Model. Services Call Object.operations
│   ├── __init__.py             # put here so services can be detected as a package for github actions
│   ├── ExerciseDriver.py       # Exercise Driver
│   ├── FoodDriver.py           # Food Driver
│   ├── GymDriver.py            # Gym Driver
│   ├── MeasurementDriver.py    # Measurements Driver
│   ├── MongoDriver.py          # Mongo DB Driver
│   ├── PersonalExDriver.py     # Personal Exercise Driver
│   ├── SessionDriver.py        # Session Driver (Not Currently In Sprint)
│   ├── SignInDriver.py         # Sign in Driver
│   ├── UserDriver.py           # User Driver
│   └── WorkoutDriver.py        # Workout Driver
│
├── tests/                      # Tests for Github
│   └── test_routes.py          # All testing routes that github runs on cpull requests to main.
│
├── AHFULbackend.py             # Flask App Starting Point (Main)
├── requirements.txt            # Python dependencies
├── .env                        # You Should Create and Update this Manually
└── README.MD                   # This Documentation
```