# Security Policy

## Security Features

### Backend Security

1. **CORS Protection**
   - Restricted to specific origins (configurable via `ALLOWED_ORIGINS`)
   - Only allows necessary HTTP methods (GET, POST)
   - Only allows necessary headers (Content-Type, Authorization)

2. **Security Headers**
   - `X-Frame-Options: DENY` - Prevents clickjacking
   - `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
   - `X-XSS-Protection: 1; mode=block` - XSS protection
   - `Content-Security-Policy` - Restricts resource loading
   - `Referrer-Policy` - Controls referrer information
   - `Permissions-Policy` - Disables unnecessary browser features

3. **Rate Limiting**
   - 100 requests per 15 minutes per IP (configurable)
   - Prevents abuse and DoS attacks

4. **Trusted Host Protection**
   - Prevents host header attacks
   - Only accepts requests from trusted hosts

5. **Input Validation**
   - Pydantic models validate all inputs
   - Type checking on all endpoints

### Frontend Security

1. **Storage Options**
   - Session storage mode (clears on browser close)
   - Persistent storage mode (convenience)
   - User-controlled toggle

2. **API Key Handling**
   - Keys never sent to backend for storage
   - Only transmitted during API calls
   - Stored client-side only

3. **No Sensitive Data Logging**
   - API keys not logged
   - Minimal debug output in production

## Configuration

### Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
# Copy example file
cp backend/.env.example backend/.env

# Edit with your settings
nano backend/.env
```

### Production Deployment

For production, ensure:

1. **Use HTTPS**
   - Uncomment HSTS header in `main.py`
   - Configure SSL certificates in uvicorn

2. **Restrict CORS**
   - Set `ALLOWED_ORIGINS` to your production domain only
   - Remove localhost origins

3. **Use Strong Secrets**
   - If adding authentication, use strong secret keys
   - Rotate keys regularly

4. **Enable Logging**
   - Monitor access logs
   - Set up error tracking

5. **Firewall Rules**
   - Only expose necessary ports
   - Use reverse proxy (nginx/caddy)

## Reporting Security Issues

If you discover a security vulnerability, please email:
- **DO NOT** open a public issue
- Email: [your-email@example.com]
- Include detailed description and steps to reproduce

We will respond within 48 hours and work on a fix.

## Security Best Practices for Users

1. **API Keys**
   - Never share your API keys
   - Use session storage on shared computers
   - Rotate keys regularly
   - Use separate keys for testing

2. **Network Security**
   - Use HTTPS in production
   - Don't expose backend to public internet without authentication
   - Use VPN on public networks

3. **Access Control**
   - Lock your computer when away
   - Clear browser data on shared computers
   - Use private/incognito mode on public computers

## Security Checklist for Deployment

- [ ] HTTPS enabled with valid certificate
- [ ] CORS restricted to production domain
- [ ] Rate limiting configured appropriately
- [ ] Security headers verified (use securityheaders.com)
- [ ] Firewall rules configured
- [ ] Reverse proxy configured (nginx/caddy)
- [ ] Logging and monitoring enabled
- [ ] Regular security updates scheduled
- [ ] Backup strategy in place
- [ ] Incident response plan documented

## Dependencies

Keep dependencies updated:

```bash
# Backend
cd backend
pip install --upgrade -r requirements.txt

# Frontend
cd frontend
npm audit
npm update
```

## Security Headers Testing

Test your deployment:

```bash
# Check security headers
curl -I https://yourdomain.com/api/health

# Use online tools
# - https://securityheaders.com
# - https://observatory.mozilla.org
```

## Compliance

This application:
- Does not store user data on the server
- Does not track users
- Does not use cookies
- Processes data in memory only
- API keys stored client-side only

For GDPR/privacy compliance, ensure:
- Clear privacy policy
- User consent for data processing
- Data retention policies
- Right to deletion procedures
