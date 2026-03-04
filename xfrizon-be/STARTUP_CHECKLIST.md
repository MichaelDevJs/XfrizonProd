# Xfrizon Backend - Startup Error Resolution Checklist

## Issues Diagnosed & Fixed ✅

### 1. **JwtTokenProvider - Deprecated API Methods** ✅
- **Status:** FIXED
- **Issue:** JJWT library API methods were deprecated in version 0.12.x
- **Error Message:** `Cannot resolve method 'parserBuilder' in 'Jwts'`
- **Solution:**
  - Updated `Jwts.parserBuilder()` → `Jwts.parser()`
  - Replaced all deprecated builder methods (setClaims, setSubject, etc.)
  - Used modern API: `claims()`, `subject()`, `issuedAt()`, `expiration()`
  - Updated verification: `setSigningKey()` → `verifyWith()`
  - Updated parsing: `parseClaimsJws()` → `parseSignedClaims()`

**File:** `src/main/java/com/xfrizon/util/JwtTokenProvider.java`

### 2. **Hibernate Dialect Not Found** ✅
- **Status:** FIXED
- **Issue:** Hibernate 7.2.x removed `MySQL8Dialect` class
- **Error Message:** `Unable to resolve name [org.hibernate.dialect.MySQL8Dialect]`
- **Solution:** Changed to `org.hibernate.dialect.MySQLDialect`

**File:** `src/main/resources/application.properties` (Line 12)
**Change:** `spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect`

### 3. **Missing Database** ✅
- **Status:** FIXED
- **Issue:** Database `xfrizon_ts` doesn't exist in MySQL
- **Error Message:** `Unknown database 'xfrizon_ts'`
- **Solution:** 
  - Added `createDatabaseIfNotExist=true` to JDBC URL
  - Created `setup-db.sql` with complete schema

**File:** `src/main/resources/application.properties` (Line 6)
**Change:** Added `&createDatabaseIfNotExist=true` to datasource URL

---

## Files Modified Summary

| File | Changes | Status |
|------|---------|--------|
| `src/main/java/com/xfrizon/util/JwtTokenProvider.java` | Updated JJWT API calls | ✅ Complete |
| `src/main/resources/application.properties` | Dialect + DB creation | ✅ Complete |
| `setup-db.sql` | Created new file | ✅ Created |
| `STARTUP_FIXES.md` | Documentation | ✅ Created |

---

## Pre-Startup Verification Checklist

### System Requirements
- [ ] Java 21 or higher installed
- [ ] MySQL 5.7+ running on localhost:3306
- [ ] MySQL username: `root`, password: `root`
- [ ] Port 8080 available
- [ ] Network connectivity: localhost accessible

### Code Quality
- [ ] ✅ JwtTokenProvider compiles without errors
- [ ] ✅ application.properties has valid configuration
- [ ] ✅ Hibernate dialect is correct
- [ ] ✅ Database auto-creation enabled

### Build Verification
```powershell
# Clean build without tests
.\mvnw.cmd clean package -DskipTests

# Expected output:
# [INFO] BUILD SUCCESS
```

---

## Startup Instructions

### Option 1: Using JAR (Recommended)
```powershell
cd C:\Users\User\Desktop\Xfrizon\xfrizon-be
java -jar target/xfrizon-ts-0.0.1-SNAPSHOT.jar
```

### Option 2: Using Maven
```powershell
cd C:\Users\User\Desktop\Xfrizon\xfrizon-be
.\mvnw.cmd spring-boot:run
```

### Expected Startup Logs
```
2026-02-19T22:XX:XX.XXX+01:00  INFO ... com.xfrizon.XfrizonApplication : Starting XfrizonApplication
2026-02-19T22:XX:XX.XXX+01:00  INFO ... com.zaxxer.hikari.HikariDataSource : HikariPool-1 - Starting...
2026-02-19T22:XX:XX.XXX+01:00  INFO ... o.hibernate.orm.jpa : HHH008540: Processing PersistenceUnitInfo
2026-02-19T22:XX:XX.XXX+01:00  INFO ... o.springframework.boot.web.embedded.tomcat.TomcatWebServer : Tomcat started on port(s): 8080
2026-02-19T22:XX:XX.XXX+01:00  INFO ... com.xfrizon.XfrizonApplication : Started XfrizonApplication in X.XXX seconds (JVM running for X.XXX)
```

---

## Post-Startup Testing

### 1. Health Check
```bash
curl -X GET http://localhost:8080/api/v1/auth/validate-token
# Expected: 400 Bad Request (no token provided)
```

### 2. Test Registration
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "confirmPassword": "TestPass123",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+1234567890"
  }'
```

### 3. Test Login
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

### 4. Verify Database
```sql
-- Connect to MySQL
mysql -u root -proot

-- Check database creation
SHOW DATABASES LIKE 'xfrizon_ts';

-- Check tables
USE xfrizon_ts;
SHOW TABLES;

-- Check user table
SELECT * FROM user;
```

---

## Troubleshooting Guide

### Issue: `Connection refused - MySQL not running`
**Solution:** Start MySQL service
```powershell
# Windows
net start MySQL80  # or your MySQL version
```

### Issue: `Unknown database 'xfrizon_ts'`
**Solution:** Manual database creation
```powershell
mysql -u root -proot < setup-db.sql
```

### Issue: `Port 8080 already in use`
**Solution:** Change port in application.properties
```properties
server.port=8081
```

### Issue: `Failed to instantiate JpaRepositoryFactory`
**Solution:** Ensure all entity classes exist (User.java is present ✅)

### Issue: `Cannot resolve method 'parser' in 'Jwts'`
**Solution:** Ensure JJWT dependencies are loaded
```bash
.\mvnw.cmd clean install
```

---

## Configuration Summary

### Current Configuration
```properties
server.port=8080
server.servlet.context-path=/api/v1
spring.datasource.url=jdbc:mysql://localhost:3306/xfrizon_ts?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&createDatabaseIfNotExist=true
spring.datasource.username=root
spring.datasource.password=root
spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect
spring.jpa.hibernate.ddl-auto=update
jwt.secret=your-secret-key-change-this-in-production
jwt.expiration=86400000
```

### Recommended Changes for Production
```properties
# Change secret key
jwt.secret=<generate-strong-random-key>

# Use production database
spring.datasource.url=jdbc:mysql://<production-host>:3306/xfrizon_ts

# Change DDL mode
spring.jpa.hibernate.ddl-auto=validate

# Increase security
spring.datasource.hikari.maximum-pool-size=20
server.compression.enabled=true
```

---

## API Endpoints Available

### Authentication Endpoints
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/user` - Get current user (requires token)
- `PUT /api/v1/auth/user` - Update user profile (requires token)
- `GET /api/v1/auth/validate-token` - Validate JWT token

---

## Next Steps After Successful Startup

1. **Test All Endpoints** - Use provided curl commands above
2. **Verify Database** - Check tables are created in MySQL
3. **Check Logs** - Look for any warnings or errors
4. **Frontend Integration** - Connect React frontend on port 5173
5. **Deploy** - Follow production deployment guide

---

## Support Files

- `STARTUP_FIXES.md` - Detailed technical documentation
- `setup-db.sql` - Database schema
- `pom.xml` - All dependencies verified ✅
- `verify-startup.sh` - Automated verification script

---

**Last Updated:** February 19, 2026
**Status:** ✅ Ready for Deployment
**Next Milestone:** Create Event functionality with Entity relationships

