## Architecture

- Frontend: Node.js, React, & Vite (see [Frontend Setup](Frontend/FrontendSetup.md))
- Backend: Python Flask API Blueprints (see [Backend Setup](Backend/BackendSetup.md))
- Database: Externally Hosted MongoDB via PyMongo Python Library
- Notification Service Workers: Hosted GCP Project with Firebase Integration
- AI Chatbot: Hosted GCP Project with Vertex AI Integration (Received Credits for Student GenAI App Builder Integration)

## Developer Documentation

- [Frontend Setup](Frontend/FrontendSetup.md) -- Installing dependencies, running the dev server, ESLint
- [Frontend File Structure](Frontend/FileStructure.md) -- Directory layout and component organization
- [Backend Setup](Backend/BackendSetup.md) -- Virtual environment, Flask setup, environment variables
- [Backend File Structure](Backend/FileStructure.md) -- Backend directory layout
- [Backend Testing](Backend/Testing.md) -- Running tests and CI notes
- [Backend API Documentation](Backend/API.md) -- Swagger endpoint docs
- [Coding Style & Linting](CodingStyle.md) -- Naming conventions and how to run linters

## Prerequisites

- **Python 3.13+** (for the backend)
  - Download: https://www.python.org/downloads/
  - Verify: `python --version` (Windows) or `python3 --version` (macOS/Linux)
- **Node.js 18+** (for the frontend)
  - Download: https://nodejs.org/ (LTS version)
  - Verify: `node --version`
- **npm** (ships with Node.js)
  - Verify: `npm --version`
- **Git** (for cloning and contributing)
  - Download: https://git-scm.com/downloads
  - Verify: `git --version`
- **MongoDB** (for local backend testing; production uses a hosted instance)
  - Download: https://www.mongodb.com/try/download/community
- **Internet connection** (for package managers and external API connections)

## API Route Documentation (Swagger)

We host documentation for backend routes with Swagger. See more at: https://www.ahful.app/api/APIDocs/

## Testing

There is a small test suite under `Backend/tests/`. See [Backend Testing](Backend/Testing.md) for full details.

## This is an Open Source project, Contributions are welcome!

1. Request contributor access.
2. Create a branch from main and follow the repository branch naming convention: `YourName/UserStoryName`
3. Commit often and create detailed commit messages
4. Test local commits before continuing (see [Coding Style & Linting](CodingStyle.md))
5. Pull main and resolve merge conflicts locally
6. Open a pull request with a clear description of what changed and why
7. PRs to main require review from a Team Owner before they can be merged

### Automated

8. Closed PRs to main will generate PRs to Production in prod-staging
9. PRs to Prod Require Team Owners to sign off on the Bot's Updates
10. Approved PRs to Prod Staging will be automatically bundled and pushed to Production
11. Wait for updates to cook for 3 minutes
12. Visit https://www.ahful.app

## Troubleshooting

- If the backend fails to connect to the database, verify your `.env` is updated with the current SECRETS
- If the frontend fails to connect to Google or Firebase, verify your `.env` is updated with the current SECRETS
- If the frontend fails to compile, remove `node_modules/` and run `npm install` again. Ensure your Node version matches the one required by `Frontend/package.json`.

## External APIs

- Google OAuth 2.0 -- https://developers.google.com/identity/protocols/oauth2/web-server#python
- FoodData Central (USDA) -- https://fdc.nal.usda.gov/api-guide
- Firebase Cloud Messaging -- https://firebase.google.com/docs/cloud-messaging/

## Reporting Issues

- [Developers: Reporting an Issue](../ReportingAnIssue.md)
