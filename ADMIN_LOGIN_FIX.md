# Admin Login Fix - Setup Instructions

## Problem Fixed
- Admin login was using a fake demo token that the backend rejected (403 Forbidden)
- Updated AdminLogin to call the real backend authentication endpoint

## Changes Made

### Frontend (`xfrizon-ui/`)
1. **AdminLogin.jsx** - Now calls `/api/v1/auth/login` to get a real JWT token
2. **OrganizersManagement.jsx** - Added endpoint fallback and data normalization
3. **axios.js** - Prioritizes `adminToken` for `/admin/*` routes

### Backend (`xfrizon-be/`)
1. **AdminOrganizerController.java** - Added `/list` alias for `/management` endpoint
2. **create-admin-user.sql** - SQL script to create admin user in database

## Setup Steps

### 1. Start MySQL Database
Ensure MySQL is running on `localhost:3306` with:
- Database: `xfrizon_ts`
- Username: `root`
- Password: `root`

### 2. Create Admin User
Run the SQL script to create an admin account:

```bash
# Connect to MySQL
mysql -u root -p

# Then run the script
source c:/Users/User/Desktop/Xfrizon/xfrizon-be/create-admin-user.sql
```

**OR** manually execute:
```sql
USE xfrizon_ts;

INSERT INTO `users` (
    `email`, `first_name`, `last_name`, `password`, 
    `role`, `is_active`, `is_email_verified`,
    `created_at`, `updated_at`
) VALUES (
    'admin@xfrizon.com', 'Admin', 'User',
    '$2a$10$DOwdB7zzfhQMFZBWQfGGPeXZ7i/4t8J6dwuZ8JvLkUy1rq1/5MvfW',
    'ADMIN', 1, 1, NOW(), NOW()
);
```

This creates:
- **Email:** `admin@xfrizon.com`
- **Password:** `admin123`

### 3. Start Backend
```bash
cd c:/Users/User/Desktop/Xfrizon/xfrizon-be
./mvnw.cmd spring-boot:run
```

Wait for the server to start on `http://localhost:8081`

### 4. Start Frontend
```bash
cd c:/Users/User/Desktop/Xfrizon/xfrizon-ui
npm run dev
```

### 5. Login as Admin
1. Navigate to `http://localhost:5173/admin-login`
2. Enter credentials:
   - Email: `admin@xfrizon.com`
   - Password: `admin123`
3. You'll be redirected to `/admin/dashboard`

## Verification

After login, the admin pages should now work:
- `/admin/dashboard` - Admin dashboard
- `/admin/organizers` - Organizers Management (fetches from backend)
- All requests will use the real JWT token

## Troubleshooting

### Still getting 403 Forbidden?
- Verify the admin user was created: `SELECT * FROM users WHERE email='admin@xfrizon.com';`
- Check backend logs for authentication errors
- Verify the backend is running on port 8081

### Backend won't start?
- Ensure MySQL is running
- Check database credentials in `xfrizon-be/src/main/resources/application.properties`
- Verify Java 21 is installed: `java -version`

### Frontend shows "Invalid credentials"?
- Backend must be running on `http://localhost:8081`
- Check browser console for network errors
- Verify the admin user exists in the database
