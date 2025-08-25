# Public API Documentation

This document describes the public API endpoints that can be accessed without authentication.

## Base URL
```
http://localhost:3000/api/public (development)
https://your-domain.com/api/public (production)
```

## Endpoints

### 1. Health Check API
**Endpoint:** `/api/public/health`

#### GET Request
Check if the API is running and get basic status information.

**Request:**
```bash
curl -X GET "http://localhost:3000/api/public/health"
```

**Response:**
```json
{
  "status": "healthy",
  "message": "API is running successfully", 
  "timestamp": "2025-08-24T16:13:44.700Z",
  "version": "1.0.0",
  "uptime": 38.106098625
}
```

#### POST Request
Test POST requests to the health endpoint.

**Request:**
```bash
curl -X POST "http://localhost:3000/api/public/health" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

**Response:**
```json
{
  "status": "success",
  "message": "POST request received successfully",
  "timestamp": "2025-08-24T16:13:44.700Z",
  "receivedData": {"test": "data"},
  "method": "POST"
}
```

### 2. System Information API
**Endpoint:** `/api/public/info`

Get detailed system and application information.

**Request:**
```bash
curl -X GET "http://localhost:3000/api/public/info"
```

**Response:**
```json
{
  "application": {
    "name": "Webapp Dify Template",
    "version": "1.0.0", 
    "environment": "development",
    "framework": "Next.js 14",
    "language": "TypeScript"
  },
  "server": {
    "timestamp": "2025-08-24T16:14:16.033Z",
    "timezone": "Asia/Saigon",
    "uptime": "69 seconds",
    "nodeVersion": "v24.6.0",
    "platform": "darwin"
  },
  "features": {
    "authentication": "NextAuth",
    "database": "Prisma ORM", 
    "ui": "Tailwind CSS",
    "i18n": "Available",
    "docker": "Supported"
  }
}
```

**Text Format:**
```bash
curl -X GET "http://localhost:3000/api/public/info?format=text"
```

### 3. Utility Functions API
**Endpoint:** `/api/public/utils`

#### GET Operations

##### Timestamp
Get current timestamp in various formats.
```bash
curl -X GET "http://localhost:3000/api/public/utils?operation=timestamp"
```

Response:
```json
{
  "operation": "timestamp",
  "result": {
    "iso": "2025-08-24T16:14:50.171Z",
    "unix": 1756052090,
    "local": "23:14:50 24/8/2025", 
    "utc": "Sun, 24 Aug 2025 16:14:50 GMT"
  }
}
```

##### UUID Generation
Generate a random UUID v4.
```bash
curl -X GET "http://localhost:3000/api/public/utils?operation=uuid"
```

Response:
```json
{
  "operation": "uuid",
  "result": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
}
```

##### Hash Generation
Generate a simple hash of input text.
```bash
curl -X GET "http://localhost:3000/api/public/utils?operation=hash&input=hello world"
```

Response:
```json
{
  "operation": "hash",
  "input": "hello world",
  "result": "5d41402a"
}
```

##### Text Encoding
Encode text in various formats (base64, URI, HTML).
```bash
curl -X GET "http://localhost:3000/api/public/utils?operation=encode&input=Hello World!"
```

Response:
```json
{
  "operation": "encode",
  "input": "Hello World!",
  "result": {
    "base64": "SGVsbG8gV29ybGQh",
    "uri": "Hello%20World!",
    "html": "Hello World!"
  }
}
```

##### Random Number Generation
Generate random numbers within a range.
```bash
curl -X GET "http://localhost:3000/api/public/utils?operation=random&min=1&max=100&count=5"
```

Response:
```json
{
  "operation": "random", 
  "parameters": {"min": 1, "max": 100, "count": 5},
  "result": [23, 67, 89, 12, 45]
}
```

#### POST Operations

##### Email Validation
Validate email format.
```bash
curl -X POST "http://localhost:3000/api/public/utils" \
  -H "Content-Type: application/json" \
  -d '{"operation":"validate_email","data":{"email":"test@example.com"}}'
```

Response:
```json
{
  "operation": "validate_email",
  "email": "test@example.com", 
  "isValid": true,
  "message": "Valid email format"
}
```

##### JSON Formatting
Format and validate JSON strings.
```bash
curl -X POST "http://localhost:3000/api/public/utils" \
  -H "Content-Type: application/json" \
  -d '{"operation":"json_format","data":{"json":"{\"name\":\"John\",\"age\":30}"}}'
```

Response:
```json
{
  "operation": "json_format",
  "result": {
    "isValid": true,
    "formatted": "{\n  \"name\": \"John\",\n  \"age\": 30\n}",
    "minified": "{\"name\":\"John\",\"age\":30}"
  }
}
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error description",
  "message": "Detailed error message"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `500` - Internal Server Error

## Usage Examples

### JavaScript/TypeScript
```javascript
// Health check
const healthResponse = await fetch('/api/public/health');
const healthData = await healthResponse.json();

// Get timestamp
const timeResponse = await fetch('/api/public/utils?operation=timestamp');
const timeData = await timeResponse.json();

// Validate email
const emailResponse = await fetch('/api/public/utils', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    operation: 'validate_email',
    data: { email: 'user@example.com' }
  })
});
const emailData = await emailResponse.json();
```

### Python
```python
import requests

# Health check
response = requests.get('http://localhost:3000/api/public/health')
print(response.json())

# Get system info
response = requests.get('http://localhost:3000/api/public/info') 
print(response.json())

# Validate email
response = requests.post('http://localhost:3000/api/public/utils', 
  json={
    'operation': 'validate_email',
    'data': {'email': 'test@example.com'}
  }
)
print(response.json())
```

## Security Notes

- These endpoints are public and don't require authentication
- Rate limiting should be implemented for production use
- Input validation is performed but additional validation may be needed for specific use cases
- The hash function is not cryptographically secure and should not be used for security purposes