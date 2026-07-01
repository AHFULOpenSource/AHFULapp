## Project Overview -- AHFUL App

A Helpful Fitness Utilization Logger (AHFUL) app is an Open Source Web App for tracking workouts, food, gyms, and measurements. The repository contains a Python-based backend (Hosted APIs) under the `Backend/` and a React-based UI under the `Frontend/` folder.

## Architecture

- Frontend: Node.js, React, & Vite (See detailed Frontend setup in ./Frontend/README.md)
- Backend: Python Flask API Blueprints (see See detailed Beckend setup in ./Backend/README.md)
- Database: Externally Hosted MongoDB via PyMongo Python Library
- Notification Service Workers: Hosted GCP Project with Firebase Integration
- AI Chatbot: Hosted GCP Project with Vertex AI Integration (Recieved Credits for Student GenAI App Builder Integration)

## Prerequisites:

- Python 3.13+ (for the backend)
- Node.js (for the frontend)
- Internet Connection for external connections

## API Route Documentation (Swagger)

- We host Documentation for backend routes with Swagger!!  
See more at: https://www.ahful.app/api/APIDocs/

## Testing

There is a small test suite under `Backend/tests/`. To run tests, use your preferred test runner:

	pytest Backend/tests

Adjust the command to suit your environment and any test requirements (for example, a running test database).

## Contributing Standards

Variable names use camel case. Example: myCoolVariable = 'foo'

Function names user lowercase words connected by underscores. Example: def naming_functions_uses_lowercase_underscores

Class names and File names user Capital Case.  Example: class ClassNamesUseCapitalCase & MyCoolNewFile.txt

## This is an Open Source project, Contributions are welcome!  
1. Request contributor access.
2. Create an branch from main and follow the repository branch naming convention -- > YourName/UserStoryName
3. Commit Often and create detailed commit messages 
4. Test local commits before continuing. 
5. Pull Main and resolve merge conflicts locally
6. Open a pull request with a clear description of what changed and why.
7. PRs to Main require review from a Team Owner before they can be merged.
---------------
AUTOMATED
---------------
8. Closed PRs to main will generate PRs to Production in prod-staging. 
9. PRs to Prod Require Team Owners to sign off on the Bot's Updates
10. Approved PRs to Prod Staging will be Automatically bundeled and pushed to Production. 
11. Wait for updates to cook for 3 minutes. 
12. Visit https://www.ahful.app



## Troubleshooting

- If the backend fails to connect to the database, verify your .env is Updated with the current SECRETS
- If the Frontend fails to connect to the Google Or Firebase, verify your .env is Updated with the current SECRETS
- If the frontend fails to compile, remove `node_modules/` and run `npm install` again. Ensure your Node version matches the one required by `Frontend/package.json`.

## Use Cases:
- Your Health in a Glance -- Our software is designed for coaching users throughout their fitness journey.  When the user enters the app, they will see a summary of their previous workout and body metrics history if they choose to record them.  (Dashboard-esque feeling). The home page can be customizable for the user. 
- Workout Planning and Recording -- Standard Gym Member mode will offer an option for users to record their workouts by adding exercises to a list of completed exercises for each workout.   The User can also add the number of repetitions or the weight they moved during the workout. 
- Body Measurement Tracking Database and History -- In Gym Member mode, the user can enter and record body measurements, such as Arm or leg circumference and Body weight, etc. 
- Built-in Gym Discovery & Marketing Ideas -- The app will also be built so users can find gyms that use the app for their fitness coaching / personal trainer programs, and it will list the brands and names of the Gyms we work with. 
- Promote your own Business within our App -- Personal trainers will also have access to the application, where they can manage clients, assign workouts, and assign exercises and repetitions to their clients. 
- Live Activities, Notifications, and Routines -- The software will also use notifications and reminders to notify users when workouts are due and to provide motivation. 
- AI Incorporation and Workout Planning -- We can incorporate AI into the mix to plan workouts, serve as a fitness research partner, and possibly serve as a substitute for a personal trainer. 
- The Endless world of Fitness -- This tool is essentially endless, and you could incorporate all aspects of fitness management, diet, water intake, etc. The scope will be determined after the group is created.  Gym Buddy System. 

## Primary Objectives
- Create a functional and responsive front-end interface
- Allow our users to login and make accounts
- Two factor authentication for account safety
- Provide a quick onboarding process for new accounts to get them started with a workout plan
- Present a calendar viewer to keep users on top of their workouts
- Get live data from Api’s
- Track user workouts, weight, and measurements
- Create a Trainer role that allows assigning of workouts
- Create a mappable running route tool
- Keep track of how many times our users do certain exercises in our database
- Suggest appropriate workout plans
- Be able to ban/deactivate user accounts

## Secondary Objectives
- Workout recommendations, news and research page
- Food dashboard for nutrition intake
- Social tab to add users and invite them to workout
- Report user feature to keep the application safe
- Show how your workouts changed over time
- Delete account option
- Push notifications for workout times
- Mark home gym
- Map of nearby gyms for cost estimates
- Gym promotion page
- Present an exercise heat map to show the user which muscle groups they are missing in their workouts.

## User Types
- Members - Both gym and non-gym members fall under this type of account made to privately track your workout progress.
- Developer- Has full access to the application to create useful features or fix failing features.
- Admin- Has access to monitor member accounts and ban individuals not following terms of service.
- Gym Owner- Has the ability to create events, and workout calendars.
- Personal Trainer- Has the ability to create workouts, workout templates, schedule workouts, and edit workout calendars.\

## External APIs
- Google OAuth 2.0 -- https://developers.google.com/identity/protocols/oauth2/web-server#python
- FoodData Central (USDA) -- https://fdc.nal.usda.gov/api-guide
- Firebase Cloud Messaging -- https://firebase.google.com/docs/cloud-messaging/