# Xfrizon Event Flyer Storage Guide

## Overview

Event flyer images are stored on the server filesystem and served through the Spring Boot application. The storage path is now configurable for different environments.

## Storage Configuration

### Default Configuration (Development)

- **Upload Directory**: `uploads/` (relative to application working directory)
- **Configuration File**: `application.properties`
- **Property**: `app.upload.dir=uploads`

### File Location After Upload

When an image is uploaded:

1. Saved to disk at: `{app.upload.dir}/filename.jpg`
2. Stored in database as: `/uploads/filename.jpg`
3. Accessed via API: `http://localhost:8081/api/v1/uploads/filename.jpg`

## Development Setup

### Local Development (Windows/Mac/Linux)

The default `uploads/` directory will be created automatically in your project root when you first upload a flyer.

```bash
# Directory structure after first upload:
project-root/
├── uploads/
│   ├── 550e8400-e29b-41d4-a716-446655440000.jpg
│   ├── 6ba7b810-9dad-11d1-80b4-00c04fd430c8.png
│   └── ...
├── src/
├── pom.xml
└── ...
```

**Note**: Add `uploads/` to `.gitignore` to avoid storing binary files in version control.

```gitignore
# .gitignore
uploads/
*.log
target/
```

## Production Setup

### Linux/Mac Production Server

1. **Create a dedicated uploads directory**:

   ```bash
   sudo mkdir -p /var/www/xfrizon/uploads
   sudo chown -R appuser:appuser /var/www/xfrizon/uploads
   sudo chmod 755 /var/www/xfrizon/uploads
   ```

2. **Update `application-prod.properties`**:

   ```properties
   app.upload.dir=/var/www/xfrizon/uploads
   ```

3. **Run application with production profile**:
   ```bash
   java -jar xfrizon-backend.jar --spring.profiles.active=prod
   ```

### Docker Container

1. **Create volume mount**:

   ```bash
   docker volume create xfrizon-uploads
   ```

2. **Update `application.properties` for Docker**:

   ```properties
   app.upload.dir=/app/uploads
   ```

3. **Run Docker container**:
   ```bash
   docker run -d \
     -v xfrizon-uploads:/app/uploads \
     -p 8081:8081 \
     xfrizon-backend:latest
   ```

### AWS/Cloud Deployment

For cloud deployments, consider these options:

#### Option 1: EC2 with EBS Volume

```properties
app.upload.dir=/mnt/ebs/xfrizon/uploads
```

#### Option 2: AWS S3 (Recommended for scalability)

This requires a separate implementation using AWS SDK. Contact the development team for S3 integration.

## Frontend Image Loading

The frontend constructs the full URL for displaying flyer images:

```javascript
// Example
const flyerUrl = `/uploads/550e8400-e29b-41d4-a716-446655440000.jpg`;
const fullUrl = `http://localhost:8081/api/v1${flyerUrl}`;

// Or in production
const fullUrl = `https://api.xfrizon.com/api/v1${flyerUrl}`;
```

## Troubleshooting

### Issue: "Flyer image is broken" in Production

**Causes & Solutions:**

1. **Directory doesn't exist**
   - Check if `/var/www/xfrizon/uploads` exists
   - Verify permissions: `ls -la /var/www/xfrizon/`
   - Solution: Create directory with proper permissions (see Production Setup)

2. **Application can't write to directory**
   - Check application user has write permissions
   - ```bash
     sudo chown -R appuser:appuser /var/www/xfrizon/uploads
     sudo chmod 755 /var/www/xfrizon/uploads
     ```

3. **Wrong URL path in frontend**
   - Verify API base URL in frontend: `src/api/axios.js`
   - Should include full context path: `http://localhost:8081/api/v1`

4. **Upload directory not configured**
   - Check `application-prod.properties`
   - Verify `app.upload.dir` property is set
   - Check logs: `sudo journalctl -u xfrizon-backend -f`

### Check Current Configuration

```bash
# View uploaded files
ls -lah /var/www/xfrizon/uploads/

# Check Spring Boot logs
tail -f /var/log/xfrizon/backend.log

# Check disk space
df -h /var/www/xfrizon/
```

## Image Optimization (Optional Future Enhancement)

For production with many users, consider:

- Image compression: Reduce file size before storage
- CDN integration: Cache images on CDN (CloudFront, Cloudflare)
- Lazy loading: Load images only when needed
- Image resizing: Generate thumbnails for list views

## API Endpoints

### Upload Flyer

```
POST /api/v1/events/{eventId}/flyer
Content-Type: multipart/form-data

file: <image file>
```

### Access Flyer

```
GET /api/v1/uploads/{filename}
```

Returns: Image file (jpg, png, gif, webp)

## File Limits

- **Max file size**: 10 MB
- **Allowed formats**: jpg, jpeg, png, gif, webp
- **File naming**: UUID-based (automatically generated)

## Backup & Recovery

For production environments, implement backups:

```bash
# Daily backup to external storage
0 2 * * * /usr/local/bin/backup-xfrizon-uploads.sh

# Script: /usr/local/bin/backup-xfrizon-uploads.sh
#!/bin/bash
tar -czf /backup/xfrizon-uploads-$(date +%Y%m%d).tar.gz /var/www/xfrizon/uploads/
aws s3 cp /backup/xfrizon-uploads-*.tar.gz s3://xfrizon-backups/
```

## Summary

| Environment         | Upload Directory                | Access URL                                      |
| ------------------- | ------------------------------- | ----------------------------------------------- |
| Development (Local) | `uploads/`                      | `http://localhost:8081/api/v1/uploads/{file}`   |
| Production (Linux)  | `/var/www/xfrizon/uploads`      | `https://api.xfrizon.com/api/v1/uploads/{file}` |
| Docker              | `/app/uploads` (volume mounted) | `https://api.xfrizon.com/api/v1/uploads/{file}` |
| AWS S3              | N/A (cloud storage)             | CDN URL (requires separate setup)               |
