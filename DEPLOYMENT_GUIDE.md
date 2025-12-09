# PRD Manager Deployment Guide

[English](DEPLOYMENT_GUIDE.md) | [中文](DEPLOYMENT_GUIDE_zh.md)

## 🚀 Quick Start

### Requirements
- Docker 20.10+
- Docker Compose 2.0+
- At least 2GB RAM, 10GB disk space
- Expose port 8081 (configurable)

### One-command deployment
```bash
git clone https://github.com/Redtrez/prd_manager.git
cd prd_manager
docker-compose up -d --build
docker-compose ps
# Open http://localhost:8081
# First registered user becomes admin automatically
```

### Production Deployment (Recommended)
```bash
# Clone and setup
git clone https://github.com/Redtrez/prd_manager.git
cd prd_manager

# Create production environment file
cp .env.example .env
# Edit .env with your production settings

# Build and start services
docker-compose up -d --build

# Verify services are running
docker-compose ps
docker-compose logs -f

# Create database backup (recommended)
docker-compose exec postgres pg_dump -U admin prd_management > backup_$(date +%Y%m%d).sql
```

### Health check
```bash
docker-compose logs -f
docker-compose exec backend curl -f http://localhost:3000/health
```

## 🔧 Configuration

Create `.env` in project root:
```env
# Application Settings
APP_PORT=8081
NODE_ENV=production

# Database Configuration
POSTGRES_DB=prd_management
POSTGRES_USER=admin
POSTGRES_PASSWORD=your_very_secure_password_change_in_production
POSTGRES_PORT=5432

# Security Settings
JWT_SECRET=your_very_secure_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=7d

# File Upload Settings
MAX_FILE_SIZE=50mb
ALLOWED_FILE_TYPES=zip,html,htm,css,js,json,ttf,woff,woff2,eot,svg

# CORS and URLs
CORS_ORIGIN=http://localhost:8081
FRONTEND_URL=http://localhost:8081
BACKEND_URL=http://localhost:3000

# Upload Types Configuration
DEFAULT_UPLOAD_TYPE=axure
SUPPORTED_ENTRY_FILES=index.html,start.html,main.html

# Storage Paths
PROTOTYPES_STORAGE_PATH=./data/prototypes
UPLOADS_TEMP_PATH=./data/temp
```

## 🐳 Architecture

```
Browser → Nginx (8081) → Vue frontend
                       ↓
                 NestJS API (3000) → PostgreSQL
                       ↓
                 Prototypes storage (./data/prototypes)
```

### Services & access
| Service | Port | Access |
|---------|------|--------|
| frontend | 8081 | External |
| backend  | 3000 | Internal |
| postgres | 5432 | Internal |
| nginx    | 8081 | External |

### Persistence
- DB data in Docker volumes
- Prototypes under `./data/prototypes/`
- Uploads auto-unzipped

## 📊 Production Deployment

### Security Hardening
```bash
# Generate secure secrets
openssl rand -base64 32  # JWT_SECRET
openssl rand -base64 24  # DB password

# Set proper file permissions
chmod 600 .env
chmod 700 ./data
```

### Resource Limits (Optional)
Add resource limits to `docker-compose.yml` if running in resource-constrained environments:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
  frontend:
    deploy:
      resources:
        limits:
          memory: 256M
          cpus: '0.3'
```

### Networking & Security
- Only expose port 8081 externally
- Enable HTTPS via Nginx reverse proxy
- Regular database and file backups
- Use firewall rules to restrict access

### Performance Optimization
```bash
# Scale services for higher load
docker-compose up -d --scale backend=2 --scale frontend=2

# Monitor resource usage
docker stats
docker-compose top

# Log rotation setup
sudo logrotate /etc/logrotate.d/prd_manager
```

### Database Maintenance
```bash
# Regular backups
docker-compose exec postgres pg_dump -U admin prd_management > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup compression
docker-compose exec postgres pg_dump -U admin prd_management | gzip > backup_$(date +%Y%m%d).sql.gz

# Restore from backup
cat backup.sql | docker-compose exec -T postgres psql -U admin -d prd_management
```

## 🔍 Troubleshooting

```bash
# Port conflict
echo "APP_PORT=9090" >> .env && docker-compose up -d --force-recreate

# DB issues
docker-compose restart postgres
docker-compose logs postgres | grep -i error

# Reset DB (danger)
docker-compose down -v && docker-compose up -d

# Permissions
chmod -R 755 ./data && chown -R 1000:1000 ./data

# OOM
docker-compose down && docker system prune -f && docker-compose up -d
```

## 📝 Ops

```bash
docker-compose ps
docker-compose restart backend
git pull origin main && docker-compose up -d --build
docker system prune -f
```

### Backup & restore
```bash
docker-compose exec postgres pg_dump -U postgres prd_manager > backup_$(date +%Y%m%d).sql
tar -czf prototypes_backup_$(date +%Y%m%d).tar.gz ./data/prototypes/
docker-compose exec -T postgres psql -U postgres prd_manager < backup.sql
tar -xzf prototypes_backup.tar.gz -C ./
```

### Upgrade
```bash
git pull origin main
docker-compose up -d --build
docker-compose logs --tail=50
curl http://localhost:8081/api/health
```

## 🤝 Support

- README: README.md
- Issues: https://github.com/Redtrez/prd_manager/issues
- Discussions: https://github.com/Redtrez/prd_manager/discussions

---

Before production:
- Change all default passwords and secrets
- Set firewall rules (only 8081 externally)
- Configure regular backups
- Monitor service health
