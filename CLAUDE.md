# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Smart Medical Appointment Booking System (智慧医疗预约系统)** - a modern, full-stack web application for booking medical appointments with database persistence and contemporary UI/UX design.

**Architecture:**
- Backend: Node.js + Express with SQLite database (better-sqlite3)
- Frontend: Modern responsive HTML/CSS/JS with Bootstrap 5.3.0 and AOS animations
- Data Storage: SQLite database with persistent storage
- API Communication: RESTful endpoints via Fetch API
- UI Framework: Professional medical industry design with gradient colors and animations

## Development Commands

### Server Operations
```bash
cd server/
npm install              # Install server dependencies
npm start                # Start production server (port 3000)
npm run dev             # Start development server with nodemon
npm run init-db         # Initialize/reset database
npm run db-stats        # View database statistics
npm run db-clean        # Clean expired appointments
npm run db-departments  # List all departments
```

### Database Management
```bash
cd server/
node db-utils.js help                    # Show all database commands
node db-utils.js stats                   # View statistics
node db-utils.js add-dept "科室名" 20     # Add new department with 20 slots
node db-utils.js clean-expired           # Clean expired data
```

### Client Operations
```bash
# No build process required - static files
# Open client/index.html directly in browser
# Features: Responsive design, animations, real-time updates
```

## Project Structure

```
/Users/sun/Desktop/web homework/
├── server/                      # Backend service
│   ├── index.js                # Main server file with database integration
│   ├── database.js             # SQLite database operations class
│   ├── init-db.js              # Database initialization script
│   ├── db-utils.js             # Database management utilities
│   ├── package.json            # Server dependencies and scripts
│   ├── appointments.db         # SQLite database file (auto-generated)
│   └── node_modules/           # Server dependencies
├── client/                      # Frontend static resources
│   ├── index.html              # Modern responsive HTML page
│   ├── app.js                  # Enhanced JavaScript with animations
│   └── styles.css              # Professional CSS with gradients
├── CLAUDE.md                   # This file
├── README.md                   # Project documentation
├── 上机报告.md                 # Lab report
└── DATABASE_UPGRADE.md         # Database upgrade documentation
```

## API Endpoints

The server exposes three RESTful endpoints with database persistence:

- `POST /api/appointment/book` - Book new appointments (returns database ID)
- `POST /api/appointment/cancel` - Cancel existing appointments
- `GET /api/appointment/availability` - Check slot availability

## Database Schema

### Departments Table
```sql
CREATE TABLE departments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  max_slots INTEGER NOT NULL DEFAULT 10,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Appointments Table
```sql
CREATE TABLE appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT NOT NULL,
  department_name TEXT NOT NULL,
  appointment_date TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(phone, appointment_date),
  FOREIGN KEY (department_name) REFERENCES departments(name)
);
```

## Key Business Logic

### Booking Rules
- **Booking Window**: Only tomorrow and day-after-tomorrow are allowed
- **One-per-Phone**: Each phone number can only have one active booking
- **Department Slots**: Configurable maximum slots per department (stored in database)
- **Phone Validation**: Chinese mobile number format (1[3-9]\d{9})
- **Data Persistence**: All appointments are stored in SQLite database
- **Auto-cleanup**: Expired appointments are automatically removed

## Configuration

### Department Slot Configuration
**Method 1: Database Management Tool (Recommended)**
```bash
cd server/
node db-utils.js add-dept "内科" 15     # Set 内科 to 15 slots per day
node db-utils.js add-dept "外科" 12     # Set 外科 to 12 slots per day
node db-utils.js add-dept "儿科" 20     # Add new department
```

**Method 2: Direct SQL**
```bash
cd server/
sqlite3 appointments.db
UPDATE departments SET max_slots = 20 WHERE name = '内科';
INSERT INTO departments (name, max_slots) VALUES ('眼科', 8);
.quit
```

### Server Port
Default port is 3000, configurable via `PORT` environment variable.

### Database File Location
`server/appointments.db` - SQLite database file with all appointment data

## Frontend Features

### Modern UI/UX Design
- **Hero Section**: Gradient banner with animated elements
- **Responsive Layout**: Mobile-first design with Bootstrap
- **Interactive Elements**: Hover effects, transitions, micro-interactions
- **Real-time Validation**: Form validation with visual feedback
- **Loading States**: Button loading indicators and progress bars
- **Success Animations**: Confetti effects and celebration animations
- **Data Visualization**: Progress bars and statistical cards

### Enhanced User Experience
- **AOS Animations**: Scroll-triggered animations throughout the page
- **Smart Navigation**: Smooth scrolling with active state tracking
- **Input Validation**: Real-time phone number and form validation
- **Error Handling**: Shake animations for errors, pulse for success
- **Accessibility**: WCAG compliant with keyboard navigation
- **Dark Mode Support**: CSS variables for theme switching

## Development Notes

### Technical Improvements
- **Database Persistence**: SQLite database with full CRUD operations
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Code Organization**: Modular design with separate database layer
- **Security**: Input validation, SQL injection protection
- **Performance**: Optimized queries and connection management
- **Monitoring**: Database statistics and management utilities

### Current Features
- **Data Backup**: Simple file backup of SQLite database
- **Concurrent Access**: Database handles multiple users safely
- **Data Integrity**: Foreign key constraints and unique indexes
- **Auto-cleanup**: Automated expired appointment removal
- **Statistics**: Real-time booking statistics and metrics

### Scalability Considerations
- **Database**: SQLite can be upgraded to PostgreSQL/MySQL
- **Session Management**: Ready for user authentication system
- **API Versioning**: Structured for future API enhancements
- **Caching**: Prepared for Redis caching implementation

## Testing

### Manual Testing Workflow
1. Initialize database: `npm run init-db`
2. Start server: `npm start`
3. Open `client/index.html` in browser
4. Test booking, cancellation, and availability checking
5. Verify data persistence by restarting server
6. Test database management commands

### Database Testing
```bash
cd server/
npm run db-stats        # Verify database state
npm run db-clean        # Test cleanup functionality
node db-utils.js stats  # Detailed statistics view
```

## Troubleshooting

### Common Issues
- **Port 3000 in use**: Kill existing process `lsof -ti:3000 | xargs kill -9`
- **Database locked**: Restart server to release database connections
- **Missing data**: Run `npm run init-db` to reinitialize database

### Database Recovery
```bash
cd server/
# Backup current database
cp appointments.db appointments.backup.$(date +%Y%m%d).db
# Reinitialize if needed
npm run init-db
```