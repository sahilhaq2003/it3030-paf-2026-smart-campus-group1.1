# Authentication Guide

## Table of Contents
1. [Overview](#overview)
2. [Authentication Methods](#authentication-methods)
3. [Google OAuth Flow](#google-oauth-flow)
4. [Password-Based Login](#password-based-login)
5. [JWT Token](#jwt-token)
6. [Token Refresh](#token-refresh)
7. [Logout](#logout)
8. [Security Considerations](#security-considerations)

---

## Overview

The Smart Campus Maintenance System uses **JWT (JSON Web Tokens)** for authentication. Two authentication methods are supported:

1. **Google OAuth** - Recommended for campus users
2. **Email/Password** - For technician and admin accounts

All authenticated requests require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

---

## Authentication Methods

### Method 1: Google OAuth (Recommended)

Google OAuth is the primary authentication method for campus users. It provides:
- Single Sign-On (SSO) experience
- No password management required
- Profile picture integration
- Institutional account integration

**Flow:**
1. User clicks "Sign in with Google"
2. Google OAuth consent screen
3. Frontend receives ID token from Google
4. Frontend sends ID token to `/api/auth/google`
5. Backend validates token with Google
6. Backend returns JWT and user profile
7. Frontend stores JWT for future requests

### Method 2: Email/Password

Email/password login is available for technicians and admins created by administrators.

**Flow:**
1. User enters email and password
2. Frontend sends to `/api/auth/login`
3. Backend validates credentials
4. Backend returns JWT and user profile
5. Frontend stores JWT for future requests

---

## Google OAuth Flow

### Step 1: Load Google SDK

Add to your HTML (usually in index.html):

```html
<script async defer crossorigin="anonymous"
  src="https://accounts.google.com/gsi/client"></script>
```

### Step 2: Initialize Google Button

Add the Google sign-in button to your page:

```html
<div id="g_id_onload"
     data-client_id="YOUR_GOOGLE_CLIENT_ID"
     data-callback="handleCredentialResponse">
</div>
<div class="g_id_signin" data-type="standard"></div>
```

### Step 3: Handle Callback

```javascript
function handleCredentialResponse(response) {
  // response.credential contains the ID token
  const idToken = response.credential;
  
  // Send to your backend
  fetch('/api/auth/google', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      idToken: idToken
    })
  })
  .then(res => res.json())
  .then(data => {
    // Store JWT token
    localStorage.setItem('jwt_token', data.token);
    // Store user profile
    localStorage.setItem('user', JSON.stringify(data.user));
    // Redirect to dashboard
    window.location.href = '/dashboard';
  })
  .catch(err => console.error('Auth failed:', err));
}
```

### Step 4: Backend Verification

The backend:
1. Validates the ID token signature using Google's public keys
2. Verifies the token hasn't expired
3. Checks the token is for the correct audience (client ID)
4. Looks up or creates user in database
5. Issues a JWT token to the frontend

---

## Password-Based Login

### Request

**Endpoint:** `POST /api/auth/login`

```javascript
fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'technic@example.com',
    password: 'SecurePassword123!'
  })
})
.then(res => res.json())
.then(data => {
  localStorage.setItem('jwt_token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
})
.catch(err => console.error('Login failed:', err));
```

### Response (200 OK)

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyQGV4YW1wbGUuY29tIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
  "user": {
    "id": 1,
    "email": "technic@example.com",
    "firstName": "Alice",
    "lastName": "Smith",
    "role": "TECHNICIAN",
    "enabled": true,
    "profileImageUrl": null
  }
}
```

### Error Responses

**401 Unauthorized - Invalid Credentials:**
```json
{
  "timestamp": "2026-03-29T10:30:00Z",
  "status": 401,
  "error": "Unauthorized",
  "message": "Invalid email or password"
}
```

**403 Forbidden - Account Disabled:**
```json
{
  "timestamp": "2026-03-29T10:30:00Z",
  "status": 403,
  "error": "Forbidden",
  "message": "Account is disabled. Contact administrator."
}
```

---

## JWT Token

### Token Structure

JWT tokens are composed of three parts separated by dots:

```
header.payload.signature
```

**Header:**
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload:**
```json
{
  "sub": "user@example.com",
  "id": 1,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "TECHNICIAN",
  "iat": 1678962600,
  "exp": 1679049000,
  "iss": "smartcampus",
  "aud": "smartcampus-app"
}
```

**Claims:**
- `sub` (subject): Email address
- `id`: User ID
- `email`: Email address
- `firstName`: First name
- `lastName`: Last name
- `role`: User role (USER, TECHNICIAN, ADMIN)
- `iat` (issued at): Token creation timestamp
- `exp` (expiration): Token expiration timestamp (24 hours from issue)
- `iss` (issuer): Token issuer (smartcampus)
- `aud` (audience): Intended audience (smartcampus-app)

### Token Lifetime

Tokens expire after **24 hours**. After expiration, users must re-authenticate.

### Using the Token

Include token in all authenticated requests:

```javascript
const token = localStorage.getItem('jwt_token');

fetch('/api/tickets', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(res => {
  if (res.status === 401) {
    // Token expired, redirect to login
    localStorage.removeItem('jwt_token');
    window.location.href = '/login';
  }
  return res.json();
})
.then(data => console.log(data));
```

---

## Token Refresh

Currently, tokens cannot be refreshed - they must expire and users must re-authenticate.

**Future Enhancement:** Implement refresh token rotation for seamless re-authentication.

---

## Logout

Logout is handled client-side by removing the stored token:

```javascript
function logout() {
  localStorage.removeItem('jwt_token');
  localStorage.removeItem('user');
  window.location.href = '/login';
}
```

The token is invalidated on the server-side when it expires. Server-side token blacklisting may be implemented in future versions.

---

## Security Considerations

### Best Practices

1. **Always use HTTPS** in production
   - Prevents token interception
   - Ensures secure token transmission

2. **Store tokens securely**
   - Use `httpOnly` cookies (recommended)
   - Avoid `localStorage` for maximum security
   - Never store in variable scope

   Current implementation uses `localStorage` - consider migrating to `httpOnly` cookies:
   
   ```javascript
   // Backend: Send token as httpOnly cookie
   response.setCookie('jwt_token', token, {
     httpOnly: true,
     secure: true,
     sameSite: 'strict',
     maxAge: 86400 // 24 hours
   });
   ```

3. **Implement token expiration**
   ✅ Already implemented: 24-hour expiration
   
4. **Validate tokens on every request**
   ✅ Already implemented: All endpoints verify token

5. **Use strong passwords**
   - Minimum 8 characters
   - Must include uppercase, lowercase, numbers, special characters
   - ✅ Already enforced during user creation

6. **Implement HTTPS-only transmission**
   ```java
   // backend: application.properties
   server.ssl.enabled=true
   server.ssl.key-store=classpath:keystore.jks
   server.ssl.key-store-password=${SSL_PASSWORD}
   ```

7. **Implement rate limiting**
   - Currently not implemented
   - Recommended: 5 attempts per minute per IP
   
   ```java
   @Component
   public class LoginAttemptService {
       private static final int MAX_ATTEMPTS = 5;
       private static final long ATTEMPT_INCREMENT = 1; // minute
       
       // Implementation...
   }
   ```

8. **Use CORS properly**
   ```java
   @Configuration
   public class CorsConfig {
       @Bean
       public WebMvcConfigurer corsConfigurer() {
           return new WebMvcConfigurer() {
               @Override
               public void addCorsMappings(CorsRegistry registry) {
                   registry.addMapping("/api/**")
                       .allowedOrigins("https://yourdomain.com")
                       .allowedMethods("GET", "POST", "PATCH", "DELETE")
                       .allowedHeaders("Authorization", "Content-Type")
                       .maxAge(3600);
               }
           };
       }
   }
   ```

### Vulnerability Mitigations

**XSS (Cross-Site Scripting):**
- ✅ JWT tokens in localStorage are protected from XSS if CSP (Content Security Policy) is enforced
- Implement CSP headers:
  ```
  Content-Security-Policy: default-src 'self'; script-src 'self'
  ```

**CSRF (Cross-Site Request Forgery):**
- ✅ Protected by JWT requirement in Authorization header
- CSRF tokens not needed with JWT

**Token Theft:**
- ✅ Tokens expire after 24 hours
- Recommendation: Implement token rotation on each request
- Implement device fingerprinting

**Man-in-the-Middle (MITM):**
- ✅ Mitigated by HTTPS requirement
- Implement Certificate Pinning for mobile apps

---

## Integration Examples

### React with Axios

```javascript
import axios from 'axios';

// Create axios instance with token
const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('jwt_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Angular with HttpInterceptor

```typescript
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private router: Router) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('jwt_token');
    
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          localStorage.removeItem('jwt_token');
          this.router.navigate(['/login']);
        }
        return throwError(error);
      })
    );
  }
}
```

### Vue.js with Fetch

```javascript
// auth-service.js
export const authApi = {
  async login(email, password) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) throw new Error('Login failed');
    
    const data = await response.json();
    localStorage.setItem('jwt_token', data.token);
    return data.user;
  },

  async getCurrentUser() {
    const token = localStorage.getItem('jwt_token');
    if (!token) return null;

    const response = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      localStorage.removeItem('jwt_token');
      return null;
    }

    return await response.json();
  }
};
```

---

## Troubleshooting

### "Invalid token" Error

**Causes:**
- Token has expired (24 hours)
- Token is malformed
- Token was signed with different secret

**Solution:**
- Re-authenticate user
- Check token format in localStorage

### "Unauthorized" on Protected Route

**Causes:**
- No token in Authorization header
- Token not sent correctly
- Token expired

**Solution:**
```javascript
// Check token exists
const token = localStorage.getItem('jwt_token');
if (!token) redirect('/login');

// Verify token hasn't expired
const payload = JSON.parse(atob(token.split('.')[1]));
if (payload.exp * 1000 < Date.now()) redirect('/login');
```

### CORS Errors

**Causes:**
- Frontend and backend on different origins
- CORS not properly configured

**Solution:**
- Ensure CORS configuration includes your frontend domain
- Check `Access-Control-Allow-Origin` header in response

### Google OAuth Not Working

**Causes:**
- Client ID not configured
- Redirect URI not whitelisted in Google Console
- Token verification failing

**Solution:**
- Verify Client ID matches localhost/production
- Add frontend URL to Google OAuth authorized domains
- Check browser console for errors

---

## Support

For authentication issues:
- Contact: support@smartcampus.edu
- Documentation: https://smartcampus.edu/docs
- Issue Tracker: https://github.com/yourorg/smart-campus/issues
