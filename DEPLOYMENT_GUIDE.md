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
docker-compose up -d
docker-compose ps
# Open http://localhost:8081
# First registered user becomes admin automatically
```

### Health check
```bash
docker-compose logs -f
docker-compose exec backend curl -f http://localhost:3000/health
```

## 🔧 Configuration

Create `.env` in project root:
```env
APP_PORT=8081
POSTGRES_DB=prd_manager
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_PORT=5432
JWT_SECRET=your_very_secure_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=7d
MAX_FILE_SIZE=50mb
ALLOWED_FILE_TYPES=zip,html,htm,css,js,json
CORS_ORIGIN=http://localhost:8081
FRONTEND_URL=http://localhost:8081
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

## 📊 Production

### Hardening
```bash
openssl rand -base64 32  # JWT_SECRET
openssl rand -base64 24  # DB password
```

Limit resources in `docker-compose.yml` if needed.

### Networking & security
- Only expose 8081 externally
- Enable HTTPS via Nginx
- Backups for DB and files

### Performance
```bash
docker-compose up -d --scale backend=2 --scale frontend=2
docker stats
docker-compose top
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
