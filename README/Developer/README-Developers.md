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

## External APIs
- Google OAuth 2.0 -- https://developers.google.com/identity/protocols/oauth2/web-server#python
- FoodData Central (USDA) -- https://fdc.nal.usda.gov/api-guide
- Firebase Cloud Messaging -- https://firebase.google.com/docs/cloud-messaging/