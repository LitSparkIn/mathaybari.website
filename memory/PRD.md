# MathayBari Admin Panel - PRD

## Original Problem Statement
Build an admin panel called "MathayBari" (originally "Dicer") with:
- Admin login page
- Dashboard
- User management with device/BLE ID tracking
- Usage by Device tracking
- Login History tracking

## Core Requirements
- **Admin Credentials**: `superadmin@gmail.com` / `LS@Super`
- **UI Theme**: Material UI with colors `#F9B970`, `#EF5C1E` and "Noto Sans" font
- **API Response Format**: `{ code, status, data }`

## User Data Model
```
users:
  - user_id: int (auto-incremented, starts at 1001)
  - name: str
  - phone: str
  - device_ids: list[str] (phone identifiers for login)
  - ble_ids: list[str] (8-char peripheral device IDs)
  - password: str (auto-generated, 6 chars)
  - secret_code: str (5 digits)
  - status: 'Active' | 'Inactive'
  - token_version: int (for session invalidation)
  - last_run_location: str
  - created_at: datetime
```

## What's Been Implemented

### Authentication
- [x] Admin JWT-based login
- [x] User JWT-based login with token_version for session invalidation
- [x] Session auto-logout on 401 errors

### User Management
- [x] Public user signup API (`POST /api/users/signup`)
- [x] User login API with device_id validation (`POST /api/users/login`)
- [x] User validation API (`POST /api/users/validate`)
- [x] List all users (`GET /api/users`)
- [x] Delete user (`DELETE /api/users/{user_id}`)
- [x] Activate/Deactivate user (`PATCH /api/users/{user_id}/status`)
- [x] Add/Remove Device IDs (case-insensitive matching)
- [x] Add/Remove BLE IDs (8-char alphanumeric)
- [x] Reset password with session invalidation

### Usage by Device Feature (NEW - Dec 2025)
- [x] `devices` MongoDB collection
- [x] Track device creation and last login time
- [x] `GET /api/devices` API endpoint
- [x] Admin page at `/usage-by-device`
- [x] Auto-track when device IDs are added
- [x] Update last_logged_in on user login

### Login History Feature (NEW - Dec 2025)
- [x] `login_history` MongoDB collection
- [x] Login API accepts optional `last_known_location` and `last_known_lat_long`
- [x] `GET /api/login-history` API endpoint
- [x] Admin page at `/login-history`
- [x] Track all successful logins with timestamp, device, location

### Frontend Pages
- [x] Login Page
- [x] Dashboard Page
- [x] Users Page (with activation, device/BLE management dialogs)
- [x] Usage by Device Page
- [x] Login History Page

## Key API Endpoints
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/login` | POST | No | Admin login |
| `/api/users/signup` | POST | No | Public user registration |
| `/api/users/login` | POST | No | User login with device validation |
| `/api/users/validate` | POST | No | Validate user session |
| `/api/users` | GET | Admin | List all users |
| `/api/users/{id}/status` | PATCH | Admin | Activate/deactivate user |
| `/api/users/{id}/device-id` | POST/DELETE | Admin | Manage device IDs |
| `/api/users/{id}/ble-id` | POST/DELETE | Admin | Manage BLE IDs |
| `/api/users/{id}/reset-password` | PATCH | Admin | Reset password |
| `/api/devices` | GET | Admin | List all tracked devices |
| `/api/login-history` | GET | Admin | View login history |

## Tech Stack
- **Backend**: FastAPI, Python, Motor (async MongoDB)
- **Frontend**: React, Material UI, Axios
- **Database**: MongoDB

## Files Structure
```
/app/
├── backend/
│   └── server.py          # All API endpoints
├── frontend/src/
│   ├── App.js             # Routes
│   ├── components/
│   │   └── Sidebar.jsx    # Navigation
│   ├── context/
│   │   └── AuthContext.jsx
│   └── pages/
│       ├── LoginPage.jsx
│       ├── DashboardPage.jsx
│       ├── UsersPage.jsx
│       ├── UsageByDevicePage.jsx  # NEW
│       └── LoginHistoryPage.jsx   # NEW
```

## Future/Backlog Tasks
- [ ] Refactor server.py into modular structure (routes, models, utils)
- [ ] Add filtering/search to Usage by Device page
- [ ] Add date range filtering to Login History page
- [ ] Add pagination to tables
- [ ] Export data to CSV
