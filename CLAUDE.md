# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Medical Appointment Booking System (就诊预约系统)** - a full-stack web application for booking medical appointments. The system consists of a Node.js/Express REST API backend and a vanilla JavaScript/HTML frontend.

**Architecture:**
- Backend: Node.js + Express with CORS support
- Frontend: Static HTML/CSS/JS with Bootstrap 5.3.3
- Data Storage: In-memory (non-persistent)
- API Communication: RESTful endpoints via Fetch API

## Development Commands

### Server Operations
```bash
cd server/
npm install          # Install server dependencies
npm start            # Start production server (port 3000)
npm run dev         # Start development server with nodemon
```

### Client Operations
```bash
# No build process required - static files
# Open client/index.html directly in browser
```

## Project Structure

```
/Users/sun/Desktop/web homework/
├── server/                      # Backend service
│   ├── index.js                # Main server file with API endpoints
│   ├── package.json            # Server dependencies and scripts
│   └── node_modules/           # Server dependencies
└── client/                      # Frontend static resources
    ├── index.html              # Main HTML page (Bootstrap SPA)
    ├── app.js                  # Frontend JavaScript logic
    └── styles.css              # Custom CSS styles
```

## API Endpoints

The server exposes three RESTful endpoints:

- `POST /api/appointment/book` - Book new appointments
- `POST /api/appointment/cancel` - Cancel existing appointments
- `GET /api/appointment/availability` - Check slot availability

## Key Business Logic

### Booking Rules
- **Booking Window**: Only tomorrow and day-after-tomorrow are allowed
- **One-per-Phone**: Each phone number can only have one active booking
- **Department Slots**: Configurable maximum slots per department (default: 10 each)
- **Phone Validation**: Chinese mobile number format (1[3-9]\d{9})

### Data Structure
The server uses an in-memory store with two main structures:
- `appointments`: `{ department: { date: [phone1, phone2] } }`
- `phoneToAppointment`: `{ phone: { department, date } }`

## Configuration

### Department Slot Configuration
Modify `maxSlots` in `server/index.js`:
```javascript
const DEPARTMENTS = {
  内科: { name: "内科", maxSlots: 3 },   // 3 slots per day
  外科: { name: "外科", maxSlots: 2 },   // 2 slots per day
  // ... other departments
};
```

### Server Port
Default port is 3000, configurable via `PORT` environment variable.

## Development Notes

### Current Limitations
- **Data Persistence**: In-memory storage only - data lost on server restart
- **Scalability**: Single-threaded server without clustering
- **Security**: Basic CORS setup, no authentication or rate limiting
- **Error Handling**: Basic error handling without comprehensive logging

### Frontend Architecture
- Single Page Application (SPA) design
- Bootstrap 5.3.3 for responsive design
- Vanilla JavaScript with Fetch API for backend communication
- Real-time UI updates after each operation

### Code Style
- Codebase primarily uses Chinese for UI text and comments
- ES6+ JavaScript features
- Semantic HTML5 markup
- Express.js middleware pattern for backend

## Testing

Currently no automated tests are configured. Manual testing workflow:
1. Start server with `npm start`
2. Open `client/index.html` in browser
3. Test booking, cancellation, and availability checking features