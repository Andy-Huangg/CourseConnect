# Course Connect

## Introduction

Course Connect is a full‑stack web application that lets university students communicate in real time. Users can join course‑specific chatrooms to discuss topics anonymously and opt into a Study Buddy feature for private one‑on‑one collaboration.

## Relation to the Networking Theme

By enabling real‑time course chat with anonymity and peer pairing, Course Connect directly supports the Networking theme, helping students build connections, share knowledge, and form study partnerships in a low‑barrier environment.

## Unique Features

- **Real-Time Communication**  
  Live messaging with instant delivery using WebSockets for seamless chat experiences.
- **Study Buddy Matching**  
  One private, anonymous pairing per course for focused collaboration.
- **Anonymous Chat**  
  Public course rooms where identities can be hidden, encouraging open discussion.
- **JWT Authentication**  
  Secure user authentication with token-based authorization for API endpoints and real-time features.

## Advanced Features

The following three advanced features are to be marked for assessment:

- [x] **WebSockets** - Real‑time bidirectional communication for chat and study buddy updates
- [x] **End‑to‑End Testing with Cypress** - Automated tests covering core user flows
- [x] **Theme Switching** - Full light/dark mode support across the UI

### Other Advanced Features

These additional features have also been implemented:

- **Redux** for centralized state management
- **Dockerization** of both frontend and backend for consistent environments

## Setup Instructions

### Prerequisites

Before setting up Course Connect, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **.NET 8.0 SDK**
- **Docker** and **Docker Compose** (for containerized setup)
- **Git**

### Environment Configuration

The project requires several environment variables and configuration files:

#### Backend Configuration

1. **Update `backend/appsettings.Development.json`** with your configuration:

   ```json
   {
     "ConnectionStrings": {
       "AzureSqlConnection": "Server=tcp:<your-server>.database.windows.net,1433;Initial Catalog=<your-database>;Persist Security Info=False;User ID=<your-username>;Password=<your-password>;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
     },
     "Jwt": {
       "Key": "<YOUR_JWT_SECRET_KEY>",
       "Issuer": "<YOUR_ISSUER_URL>",
       "Audience": "<YOUR_AUDIENCE>"
     }
   }
   ```

   > **Note:** Replace the placeholders with your actual Azure SQL Database and JWT configuration details. For local development, you can also use SQL Server LocalDB with connection string: `Server=(localdb)\\mssqllocaldb;Database=CourseConnect;Trusted_Connection=true;`

#### Frontend Configuration

1. **Create a `.env` file** in the `frontend/` directory:

   ```env
   VITE_API_URL=https://localhost:7152
   VITE_WS_URL=wss://localhost:7152/ws/chat
   ```

   > **Note:** Update these URLs to match your backend deployment URL in production.

2. **For Cypress testing**, copy `frontend/cypress.env.example.json` to `frontend/cypress.env.json` and update if needed:
   ```json
   {
     "VITE_API_URL": "http://localhost:5054"
   }
   ```

### Setup

Choose one of the following setup methods:

#### Option 1: Docker Setup (Recommended)

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Andy-Huangg/CourseConnect.git
   cd CourseConnect
   ```

2. **Configure environment variables** (see Environment Configuration above)

3. **Run with Docker Compose:**

   ```bash
   docker-compose up --build
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Backend Swagger UI: http://localhost:5000/swagger

#### Option 2: Manual Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Andy-Huangg/CourseConnect.git
   cd CourseConnect
   ```

2. **Configure environment variables** (see Environment Configuration above)

3. **Setup Backend:**

   ```bash
   cd backend
   dotnet restore
   # Note: Skip 'dotnet ef database update' if using the provided Azure database
   # Only run migrations if setting up your own local database
   dotnet run
   ```

4. **Setup Frontend (in a new terminal):**

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: https://localhost:7152
   - Backend Swagger UI: https://localhost:7152/swagger

### Testing

#### Running Cypress Tests

```bash
cd frontend
npm install
npx cypress run
# or for interactive mode
npx cypress open
```

## Troubleshooting

### Common Issues

**Backend fails to start with JWT error:**

- Ensure all JWT configuration values are set in `appsettings.Development.json` (Key, Issuer, Audience)
- Verify the JWT key is a valid base64 string (minimum 32 characters)

**Frontend cannot connect to backend:**

- Check that `VITE_API_URL` in frontend `.env` matches your backend URL
- Ensure backend is running and accessible
- Verify CORS configuration allows your frontend origin

**Database connection issues:**

- Confirm database connection string is correct in `appsettings.Development.json`
- For Azure SQL Database, ensure your IP address is added to the firewall rules
- **Only run `dotnet ef database update` if setting up your own local database** - skip this if using the provided Azure database
- Check that SQL Server is running and accessible

**WebSocket connection fails:**

- Verify `VITE_WS_URL` in frontend `.env` uses the correct protocol (wss:// for HTTPS, ws:// for HTTP)
- Check that WebSocket endpoint `/ws/chat` is accessible

### Need Help?

If you need any additional information, environment keys, database access, please contact me.
