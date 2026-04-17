# ABOA - Deployment & Setup Guide

## Quick Start

### 1. Prerequisites
- Node.js 22+
- MySQL/TiDB database
- Manus account with OAuth credentials
- 2GB+ RAM, 1GB+ disk space

### 2. Installation Steps

```bash
# Extract the ZIP file
unzip aboa-agent-complete.zip
cd aboa-agent

# Install dependencies
pnpm install

# Generate database migrations
pnpm drizzle-kit generate

# Apply migrations to database
pnpm drizzle-kit migrate

# Start development server
pnpm dev
```

The application will be available at `http://localhost:3000`

### 3. Environment Configuration

Required environment variables (automatically set by Manus platform):
```
DATABASE_URL=mysql://user:password@host:port/dbname
JWT_SECRET=your-secret-key
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-api-key
BUILT_IN_FORGE_API_URL=https://api.manus.im/forge
VITE_FRONTEND_FORGE_API_KEY=your-frontend-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im/forge
```

## Production Deployment

### 1. Build for Production
```bash
pnpm build
```

This creates:
- `dist/` - Compiled backend
- `client/dist/` - Compiled frontend

### 2. Start Production Server
```bash
pnpm start
```

### 3. Environment Variables
Set all required environment variables before starting:
```bash
export DATABASE_URL="mysql://..."
export JWT_SECRET="..."
# ... set other variables
pnpm start
```

### 4. Process Management
Use PM2 or similar for production:
```bash
npm install -g pm2
pm2 start "pnpm start" --name "aboa"
pm2 save
pm2 startup
```

### 5. Reverse Proxy (Nginx)
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 6. SSL/TLS (Let's Encrypt)
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d your-domain.com
```

## Database Setup

### MySQL/TiDB Connection
```bash
# Test connection
mysql -h host -u user -p -D dbname

# Or with connection string
DATABASE_URL="mysql://user:password@host:port/dbname"
```

### Migration Management
```bash
# Generate new migration
pnpm drizzle-kit generate

# Apply migrations
pnpm drizzle-kit migrate

# Rollback (manual)
# Edit drizzle/schema.ts and regenerate
```

### Backup Strategy
```bash
# Daily backup
mysqldump -h host -u user -p dbname > backup_$(date +%Y%m%d).sql

# Restore from backup
mysql -h host -u user -p dbname < backup_20260416.sql
```

## Monitoring & Logs

### Application Logs
```bash
# Development
pnpm dev  # Logs to console

# Production with PM2
pm2 logs aboa
pm2 monit
```

### Log Files
- `.manus-logs/devserver.log` - Server startup and runtime
- `.manus-logs/browserConsole.log` - Client-side errors
- `.manus-logs/networkRequests.log` - API requests
- `.manus-logs/sessionReplay.log` - User interactions

### Health Check
```bash
curl http://localhost:3000/api/health
```

## Performance Optimization

### 1. Database Optimization
```sql
-- Create indexes for frequently queried fields
CREATE INDEX idx_leads_campaign ON leads(campaignId);
CREATE INDEX idx_messages_user ON messages(userId);
CREATE INDEX idx_workflows_status ON workflows(status);
```

### 2. Caching
```bash
# Install Redis
docker run -d -p 6379:6379 redis:latest

# Configure in application
REDIS_URL=redis://localhost:6379
```

### 3. Load Balancing
```nginx
upstream aboa_backend {
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
}

server {
    listen 80;
    location / {
        proxy_pass http://aboa_backend;
    }
}
```

## Security Hardening

### 1. Environment Variables
- Never commit `.env` files
- Use secrets management (AWS Secrets Manager, HashiCorp Vault)
- Rotate API keys regularly

### 2. Database Security
```sql
-- Create restricted user
CREATE USER 'aboa_user'@'localhost' IDENTIFIED BY 'strong_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON aboa.* TO 'aboa_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. HTTPS/TLS
- Always use HTTPS in production
- Use strong SSL certificates
- Enable HSTS header

### 4. Rate Limiting
```javascript
// Add to Express middleware
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);
```

### 5. CORS Configuration
```javascript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true
}));
```

## Troubleshooting

### Database Connection Issues
```bash
# Test connection
mysql -h host -u user -p dbname -e "SELECT 1"

# Check connection string format
mysql://user:password@host:port/dbname
```

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Out of Memory
```bash
# Increase Node.js heap size
NODE_OPTIONS="--max-old-space-size=4096" pnpm start
```

### OAuth Issues
- Verify OAuth credentials in environment
- Check redirect URI matches configuration
- Ensure OAuth server is accessible

## Scaling Strategies

### Horizontal Scaling
1. Deploy multiple instances
2. Use load balancer (Nginx, HAProxy)
3. Share database connection pool
4. Use Redis for session storage

### Vertical Scaling
1. Increase server RAM
2. Upgrade CPU
3. Optimize database queries
4. Enable caching

### Database Scaling
- Use TiDB for horizontal scaling
- Implement read replicas
- Archive old data
- Optimize indexes

## Backup & Disaster Recovery

### Automated Backups
```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups/aboa"
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Upload to S3
aws s3 cp $BACKUP_DIR/backup_$DATE.sql.gz s3://my-backups/aboa/
```

### Recovery Procedure
1. Stop application
2. Restore database from backup
3. Verify data integrity
4. Restart application
5. Test critical workflows

## Monitoring Checklist

- [ ] Application uptime monitoring
- [ ] Database connection monitoring
- [ ] API response time monitoring
- [ ] Error rate monitoring
- [ ] Disk space monitoring
- [ ] Memory usage monitoring
- [ ] CPU usage monitoring
- [ ] Log aggregation (ELK, Splunk)
- [ ] Alerting system configured
- [ ] Backup verification

## Support & Maintenance

### Regular Maintenance
- Weekly: Review logs and errors
- Monthly: Database optimization
- Quarterly: Security audit
- Annually: Dependency updates

### Update Procedure
```bash
# Update dependencies
pnpm update

# Test in staging
pnpm test
pnpm build

# Deploy to production
pnpm start
```

## Additional Resources

- [API Documentation](./API_DOCUMENTATION.md)
- [User Guide](./USER_GUIDE.md)
- [Project README](./README_ABOA.md)
- [Manus Documentation](https://docs.manus.im)

---

For additional support, contact your system administrator.
