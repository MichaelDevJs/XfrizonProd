# Xfrizon Backend - Quick Setup Guide

## Project Overview

Complete Spring Boot backend API for the Xfrizon ticketing platform featuring user authentication with JWT tokens and MySQL database.

### Technology Stack

- **Framework**: Spring Boot 3.1.0
- **Language**: Java 17
- **Database**: MySQL 8.0
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: BCrypt password hashing
- **Build Tool**: Maven

## File Structure

```
xfrizon-backend/
├── src/main/
│   ├── java/com/xfrizon/
│   │   ├── XfrizonApplication.java           # Main entry point
│   │   ├── controller/AuthController.java    # API endpoints
│   │   ├── service/AuthService.java          # Business logic
│   │   ├── repository/UserRepository.java    # Database access
│   │   ├── entity/User.java                  # User model
│   │   ├── dto/                              # Data transfer objects
│   │   │   ├── RegisterRequest.java
│   │   │   ├── LoginRequest.java
│   │   │   ├── AuthResponse.java
│   │   │   └── UserResponse.java
│   │   ├── util/JwtTokenProvider.java        # JWT utilities
│   │   ├── config/                           # Configuration
│   │   │   ├── CorsConfig.java
│   │   │   └── SecurityConfig.java
│   │   └── exception/GlobalExceptionHandler.java
│   └── resources/application.properties      # Configuration
├── pom.xml                                   # Maven dependencies
├── database-schema.sql                       # Database setup
├── README.md                                 # Full documentation
├── FRONTEND_INTEGRATION.md                   # Frontend integration guide
└── QUICK_START.md                            # This file
```

## Installation Steps

### 1. Prerequisites

- Java 17+ installed
- Maven 3.8+ installed
- MySQL 8.0+ installed and running

### 2. Database Setup

```bash
# Option A: Using MySQL CLI
mysql -u root -p < database-schema.sql

# Option B: Manual setup
# 1. Open MySQL Workbench or CLI
# 2. Execute commands in database-schema.sql
```

### 3. Configure Backend

Edit `src/main/resources/application.properties`:

```properties
# Database Configuration
spring.datasource.url=jdbc:mysql://localhost:3306/xfrizon_db
spring.datasource.username=root
spring.datasource.password=your_mysql_password

# JWT Secret (Change in production!)
jwt.secret=your-secret-key-change-this
```

### 4. Build & Run

```bash
# Build the project
mvn clean install

# Run the application
mvn spring-boot:run

# Or run the JAR file
java -jar target/xfrizon-backend-1.0.0.jar
```

Server starts at: `http://localhost:8080/api/v1`

## API Quick Reference

### Register User

```bash
POST /auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

### Login User

```bash
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Get Current User

```bash
GET /auth/user
Authorization: Bearer {token}
```

### Update User Profile

```bash
PUT /auth/user
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "location": "Berlin, Germany"
}
```

## Frontend Integration

### 1. Update Frontend API Configuration

Create `src/api/axios.js`:

```javascript
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8080/api/v1",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("userToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
```

### 2. Update Auth Pages

Update Login/Register pages to use the backend API instead of localStorage mock.

### 3. Full Integration Guide

See `FRONTEND_INTEGRATION.md` for complete step-by-step integration instructions.

## Testing the API

### Using cURL

```bash
# Register
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'

# Login
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Get User (replace {token} with actual token)
curl -X GET http://localhost:8080/api/v1/auth/user \
  -H "Authorization: Bearer {token}"
```

### Using Postman

1. Import the Postman collection (create new requests):
   - POST `/auth/register`
   - POST `/auth/login`
   - GET `/auth/user`
   - PUT `/auth/user`

2. Set Authorization header for protected routes:
   - Type: Bearer Token
   - Token: {your-jwt-token}

## Key Features

- ✅ User registration with validation
- ✅ User login with JWT authentication
- ✅ Password encryption (BCrypt)
- ✅ User profile management
- ✅ Token validation and refresh
- ✅ CORS support for frontend
- ✅ Global exception handling
- ✅ Input validation
- ✅ MySQL database integration

## Common Issues

### MySQL Connection Error

```
com.mysql.cj.jdbc.exceptions.CommunicationsException: Communications link failure
```

**Solution**: Ensure MySQL is running and credentials are correct in `application.properties`

### JWT Token Expired

**Solution**: Login again to get a new token

### CORS Error

```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Solution**: Update `CorsConfig.java` to include your frontend URL

### Port Already in Use

```
Caused by: java.net.BindException: Address already in use
```

**Solution**: Change port in `application.properties` or kill process using port 8080

## Environment Variables

For production, use environment variables instead of hardcoding secrets:

```bash
# Set environment variables
export DB_URL=jdbc:mysql://prod-db:3306/xfrizon
export DB_USER=prod_user
export DB_PASSWORD=secure_password
export JWT_SECRET=production-jwt-secret
```

## Production Checklist

- [ ] Change JWT secret to a strong value
- [ ] Use environment variables for sensitive data
- [ ] Set `ddl-auto=validate` instead of `update`
- [ ] Enable HTTPS/SSL
- [ ] Configure proper database backups
- [ ] Set up logging and monitoring
- [ ] Update CORS origins to production URL
- [ ] Use connection pooling
- [ ] Set appropriate JWT expiration time
- [ ] Enable API rate limiting

## Next Steps

1. **Create Event Endpoints**: Add controllers for event management
2. **Add Booking System**: Implement ticket booking
3. **Email Verification**: Send verification emails
4. **Password Reset**: Implement forgot password flow
5. **Payment Integration**: Add payment processing (Stripe, PayPal)
6. **API Documentation**: Generate Swagger/OpenAPI docs
7. **Testing**: Write unit and integration tests
8. **Caching**: Implement Redis caching

## Support Files

- **README.md** - Comprehensive documentation
- **FRONTEND_INTEGRATION.md** - Frontend integration guide
- **database-schema.sql** - Complete database schema
- **pom.xml** - All dependencies

## License

This is part of the Xfrizon ticketing platform project.

---

**Need Help?**

- Check README.md for detailed API documentation
- See FRONTEND_INTEGRATION.md for frontend setup
- Review database-schema.sql for database structure
