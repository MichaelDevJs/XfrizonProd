# Xfrizon Backend - Spring Boot API

Complete Spring Boot backend for the Xfrizon ticketing platform with user authentication using JWT and MySQL database.

## Project Structure

```
xfrizon-backend/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/xfrizon/
│   │   │       ├── XfrizonApplication.java          # Main application entry point
│   │   │       ├── controller/
│   │   │       │   └── AuthController.java          # Authentication endpoints
│   │   │       ├── service/
│   │   │       │   └── AuthService.java             # Authentication business logic
│   │   │       ├── repository/
│   │   │       │   └── UserRepository.java          # Database access layer
│   │   │       ├── entity/
│   │   │       │   └── User.java                    # User entity
│   │   │       ├── dto/
│   │   │       │   ├── RegisterRequest.java         # Registration request DTO
│   │   │       │   ├── LoginRequest.java            # Login request DTO
│   │   │       │   ├── AuthResponse.java            # Authentication response DTO
│   │   │       │   └── UserResponse.java            # User response DTO
│   │   │       ├── util/
│   │   │       │   └── JwtTokenProvider.java        # JWT utilities
│   │   │       ├── config/
│   │   │       │   └── CorsConfig.java              # CORS configuration
│   │   │       └── exception/
│   │   │           └── GlobalExceptionHandler.java  # Global exception handling
│   │   └── resources/
│   │       └── application.properties              # Application configuration
│   └── test/
└── pom.xml                                          # Maven dependencies

```

## Prerequisites

- Java 17+
- Maven 3.8+
- MySQL 8.0+
- Spring Boot 3.1.0+

## Setup Instructions

### 1. Database Setup

```sql
CREATE DATABASE xfrizon_db;

CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    location VARCHAR(100),
    profile_picture VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    is_active BOOLEAN DEFAULT TRUE,
    is_email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_email ON users(email);
```

### 2. Configuration

Update `src/main/resources/application.properties`:

```properties
# Database
spring.datasource.url=jdbc:mysql://localhost:3306/xfrizon_db
spring.datasource.username=root
spring.datasource.password=your_password

# JWT (IMPORTANT: Change secret in production!)
jwt.secret=your-super-secret-key-change-this-in-production
jwt.expiration=86400000
```

### 3. Build the Project

```bash
mvn clean install
```

### 4. Run the Application

```bash
mvn spring-boot:run
```

The API will be available at: `http://localhost:8080/api/v1`

## API Endpoints

### Authentication Endpoints

#### 1. Register User

**POST** `/api/v1/auth/register`

Request Body:

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "confirmPassword": "password123",
  "phoneNumber": "+1234567890"
}
```

Response (Success - 201):

```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "type": "Bearer",
  "userId": 1,
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "USER"
}
```

#### 2. Login User

**POST** `/api/v1/auth/login`

Request Body:

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

Response (Success - 200):

```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "type": "Bearer",
  "userId": 1,
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "USER"
}
```

#### 3. Get Current User

**GET** `/api/v1/auth/user`

Headers:

```
Authorization: Bearer <token>
```

Response (200):

```json
{
  "id": 1,
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phoneNumber": "+1234567890",
  "location": null,
  "profilePicture": null,
  "role": "USER",
  "isActive": true,
  "isEmailVerified": false,
  "createdAt": "2024-02-19T10:30:00",
  "updatedAt": "2024-02-19T10:30:00"
}
```

#### 4. Update User Profile

**PUT** `/api/v1/auth/user`

Headers:

```
Authorization: Bearer <token>
```

Request Body:

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "location": "Berlin, Germany",
  "profilePicture": "https://example.com/pic.jpg"
}
```

Response (200):

```json
{
  "id": 1,
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phoneNumber": "+1234567890",
  "location": "Berlin, Germany",
  "profilePicture": "https://example.com/pic.jpg",
  "role": "USER",
  "isActive": true,
  "isEmailVerified": false,
  "createdAt": "2024-02-19T10:30:00",
  "updatedAt": "2024-02-19T11:00:00"
}
```

#### 5. Validate Token

**GET** `/api/v1/auth/validate-token`

Headers:

```
Authorization: Bearer <token>
```

Response (200):

```json
{
  "valid": true,
  "email": "john@example.com",
  "userId": 1
}
```

## Error Responses

### Validation Error (400)

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": "Email must be valid",
    "password": "Password must be at least 8 characters"
  }
}
```

### Unauthorized (401)

```json
{
  "success": false,
  "message": "Invalid password"
}
```

### Conflict (409)

```json
{
  "success": false,
  "message": "Email already registered"
}
```

## Integration with Frontend

Update your frontend axios instance:

```javascript
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8080/api/v1",
});

// Add token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("userToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
```

## Features Implemented

- ✅ User Registration with validation
- ✅ User Login with JWT authentication
- ✅ JWT token generation and validation
- ✅ Password encryption using BCrypt
- ✅ User profile retrieval
- ✅ User profile update
- ✅ CORS configuration for frontend integration
- ✅ Global exception handling
- ✅ Input validation
- ✅ Database persistence

## Security Considerations

1. **Change JWT Secret**: Update `jwt.secret` in production
2. **Use HTTPS**: Always use HTTPS in production
3. **Secure Database**: Use strong passwords and proper database access controls
4. **Environment Variables**: Use environment variables for sensitive data
5. **CORS**: Restrict CORS to specific domains in production

## Next Steps

1. Implement Email Verification
2. Add Password Reset functionality
3. Implement Role-Based Access Control (RBAC)
4. Add User Activity Logging
5. Implement Two-Factor Authentication
6. Create Event Management endpoints
7. Implement Payment Processing
8. Add API Documentation (Swagger/OpenAPI)

## Testing the API

You can use Postman or curl to test the API:

```bash
# Register
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'

# Login
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

## Troubleshooting

### Connection Refused

- Ensure MySQL is running
- Check database URL in application.properties

### JWT Errors

- Verify JWT secret is configured
- Check token expiration time

### CORS Errors

- Ensure CorsConfig is applied
- Check allowed origins in CorsConfig

## License

This project is part of the Xfrizon ticketing platform.
