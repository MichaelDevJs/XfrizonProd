# Frontend-Backend Integration Guide

This guide explains how to connect the Xfrizon frontend (React Vite) with the Spring Boot backend.

## Quick Start

### 1. Backend Setup

```bash
# Navigate to backend directory
cd xfrizon-backend

# Build
mvn clean install

# Run
mvn spring-boot:run
```

Backend runs on: `http://localhost:8080`

### 2. Database Setup

Execute the SQL script to create the database:

```bash
mysql -u root -p < database-schema.sql
```

### 3. Frontend Configuration

Create or update `src/api/axios.js` in the frontend:

```javascript
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8080/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add JWT token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("userToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("userToken");
      localStorage.removeItem("user");
      window.location.href = "/auth/login";
    }
    return Promise.reject(error);
  },
);

export default API;
```

## Frontend API Integration

Update the authentication context to use the backend API:

### 1. Update `src/context/AuthContext.jsx`

```javascript
import React, { createContext, useState, useEffect } from "react";
import API from "../api/axios";

export const AuthContext = createContext();

export default function FilterProvider({ children }) {
  const [organizer, setOrganizer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("userToken");
        if (token) {
          const response = await API.get("/auth/validate-token");
          if (response.data.valid) {
            const userData = JSON.parse(localStorage.getItem("user"));
            setOrganizer(userData);
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        localStorage.removeItem("userToken");
        localStorage.removeItem("user");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const register = async (firstName, lastName, email, password) => {
    try {
      const response = await API.post("/auth/register", {
        firstName,
        lastName,
        email,
        password,
        confirmPassword: password,
      });

      if (response.data.success) {
        localStorage.setItem("userToken", response.data.token);
        localStorage.setItem(
          "user",
          JSON.stringify({
            id: response.data.userId,
            name: `${response.data.firstName} ${response.data.lastName}`,
            email: response.data.email,
            role: response.data.role,
          }),
        );
        setOrganizer({
          id: response.data.userId,
          name: `${response.data.firstName} ${response.data.lastName}`,
          email: response.data.email,
        });
        return response.data;
      }
    } catch (error) {
      throw error.response?.data || error;
    }
  };

  const login = async (email, password) => {
    try {
      const response = await API.post("/auth/login", {
        email,
        password,
      });

      if (response.data.success) {
        localStorage.setItem("userToken", response.data.token);
        localStorage.setItem(
          "user",
          JSON.stringify({
            id: response.data.userId,
            name: `${response.data.firstName} ${response.data.lastName}`,
            email: response.data.email,
            role: response.data.role,
          }),
        );
        setOrganizer({
          id: response.data.userId,
          name: `${response.data.firstName} ${response.data.lastName}`,
          email: response.data.email,
        });
        return response.data;
      }
    } catch (error) {
      throw error.response?.data || error;
    }
  };

  const logout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("user");
    setOrganizer(null);
  };

  return (
    <AuthContext.Provider
      value={{ organizer, login, register, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}
```

## Update Login Page (`src/pages/public/auth/Login.jsx`)

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const response = await authService.login(formData.email, formData.password);
    toast.success("Login successful!");
    navigate("/");
  } catch (error) {
    const errorMessage = error.message || "Login failed";
    toast.error(errorMessage);
    setErrors({ submit: errorMessage });
  } finally {
    setLoading(false);
  }
};
```

## Update Register Page (`src/pages/public/auth/Register.jsx`)

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  const newErrors = validateForm();

  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }

  setLoading(true);
  try {
    const response = await authService.register(
      formData.firstName,
      formData.lastName,
      formData.email,
      formData.password,
    );
    toast.success("Account created successfully!");
    navigate("/");
  } catch (error) {
    if (error.errors) {
      setErrors(error.errors);
    } else {
      toast.error(error.message || "Registration failed");
    }
  } finally {
    setLoading(false);
  }
};
```

## Create Auth Service (`src/api/authService.js`)

```javascript
import API from "./axios";

const authService = {
  register: async (firstName, lastName, email, password) => {
    const response = await API.post("/auth/register", {
      firstName,
      lastName,
      email,
      password,
      confirmPassword: password,
    });
    return response.data;
  },

  login: async (email, password) => {
    const response = await API.post("/auth/login", {
      email,
      password,
    });
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await API.get("/auth/user");
    return response.data;
  },

  updateUser: async (userData) => {
    const response = await API.put("/auth/user", userData);
    return response.data;
  },

  validateToken: async () => {
    const response = await API.get("/auth/validate-token");
    return response.data;
  },

  logout: () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("user");
  },
};

export default authService;
```

## Protected Routes

Create `src/component/UserProtectedRoute.jsx`:

```javascript
import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const UserProtectedRoute = ({ children }) => {
  const { organizer, loading } = useContext(AuthContext);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!organizer) {
    return <Navigate to="/auth/login" />;
  }

  return children;
};

export default UserProtectedRoute;
```

## Environment Variables

Create `.env` file in frontend root:

```
VITE_API_URL=http://localhost:8080/api/v1
```

Then update axios config:

```javascript
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});
```

## Testing the Full Flow

1. **Start MySQL**

   ```bash
   # On Windows
   net start MySQL80

   # On Mac/Linux
   mysql.server start
   ```

2. **Setup Database**

   ```bash
   mysql -u root -p < database-schema.sql
   ```

3. **Start Backend**

   ```bash
   cd xfrizon-backend
   mvn spring-boot:run
   ```

4. **Start Frontend**

   ```bash
   cd xfrizon-ui
   npm run dev
   ```

5. **Test Registration**
   - Navigate to `http://localhost:5173/auth/register`
   - Fill in the form
   - Click "Sign Up"
   - Should redirect to home page with logged-in state

6. **Test Login**
   - Logout
   - Navigate to `http://localhost:5173/auth/login`
   - Use registered credentials
   - Should redirect to home page

## Production Deployment

### Backend

1. Update `application.properties` for production database
2. Change JWT secret to a strong value
3. Set `spring.jpa.hibernate.ddl-auto=validate`
4. Build WAR file: `mvn clean package`
5. Deploy to application server (Tomcat, Jetty, etc.)

### Frontend

1. Update `VITE_API_URL` to production backend URL
2. Build: `npm run build`
3. Deploy to static hosting (Vercel, Netlify, etc.)

## Troubleshooting

### CORS Errors

- Ensure Backend CORS config includes frontend URL
- Update `CorsConfig.java` with production URL

### JWT Token Errors

- Check token expiration time in properties
- Verify JWT secret matches between frontend and backend

### Database Connection Failed

- Check MySQL is running
- Verify database URL, username, password in properties
- Ensure database exists

### 401 Unauthorized Errors

- Token might be expired, delete from localStorage and login again
- Verify Authorization header format: `Bearer <token>`

## API Documentation

Detailed API documentation is available in the backend README.md file.
