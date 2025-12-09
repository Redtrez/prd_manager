# PRD Manager 部署指南

[English](DEPLOYMENT_GUIDE.md) | [中文](DEPLOYMENT_GUIDE_zh.md)

## 🚀 快速开始

### 环境要求
- **Docker**: 20.10.0 或更高版本
- **Docker Compose**: 2.0.0 或更高版本
- **系统资源**: 至少 2GB 可用内存，10GB 磁盘空间
- **网络**: 开放端口 8081（可自定义）

### 一键部署（推荐）
```bash
# 1. 克隆项目仓库
git clone https://github.com/Redtrez/prd_manager.git
cd prd_manager

# 2. 启动所有服务（后台模式，包含构建）
docker-compose up -d --build

# 3. 查看服务状态
docker-compose ps

# 4. 访问应用
# 打开浏览器访问: http://localhost:8081
# 第一个注册的用户自动成为管理员
```

### 服务启动状态检查
```bash
# 查看实时日志
docker-compose logs -f

# 检查服务健康状态
docker-compose exec backend curl -f http://localhost:3000/health
```

## 🔧 环境配置

### 配置文件 (.env)
在项目根目录创建 `.env` 文件来自定义配置：
```env
# 应用设置
APP_PORT=8081
NODE_ENV=production

# 数据库配置
POSTGRES_DB=prd_management
POSTGRES_USER=admin
POSTGRES_PASSWORD=your_very_secure_password_change_in_production
POSTGRES_PORT=5432

# 安全设置
JWT_SECRET=your_very_secure_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=7d

# 文件上传设置
MAX_FILE_SIZE=50mb
ALLOWED_FILE_TYPES=zip,html,htm,css,js,json,ttf,woff,woff2,eot,svg

# CORS 和 URL 配置
CORS_ORIGIN=http://localhost:8081
FRONTEND_URL=http://localhost:8081
BACKEND_URL=http://localhost:3000

# 上传类型配置
DEFAULT_UPLOAD_TYPE=axure
SUPPORTED_ENTRY_FILES=index.html,start.html,main.html

# 存储路径
PROTOTYPES_STORAGE_PATH=./data/prototypes
UPLOADS_TEMP_PATH=./data/temp
```

### 重要安全配置说明

#### 生产环境必须修改的配置
1. **数据库密码** (`POSTGRES_PASSWORD`): 必须使用强随机密码（至少 24 字符）
2. **JWT 密钥** (`JWT_SECRET`): 必须使用强随机字符串（至少 32 字节）
3. **应用环境** (`NODE_ENV`): 生产环境必须设置为 `production`

#### 推荐的安全实践
4. **文件上传限制**: 根据业务需求调整 `MAX_FILE_SIZE` 和 `ALLOWED_FILE_TYPES`
5. **CORS 配置**: 生产环境应设置正确的 `CORS_ORIGIN` 和 `FRONTEND_URL`
6. **端口配置**: 可根据需要修改应用端口，确保防火墙开放对应端口
7. **资源限制**: 为容器设置适当的内存和 CPU 限制以防止资源耗尽

#### 定期维护任务
8. **密钥轮换**: 定期更换 JWT 密钥和数据库密码
9. **备份验证**: 定期测试备份文件的完整性和可恢复性
10. **安全更新**: 定期更新 Docker 镜像以获取安全补丁

## 🐳 服务架构详解

### 容器服务组成
```
用户浏览器 → Nginx (端口 8081) → Vue.js 前端
                            ↓
                      NestJS API (端口 3000) → PostgreSQL 数据库
                            ↓
                      原型文件存储 (./data/prototypes)
```

### 各服务功能
| 服务名称 | 端口 | 描述 | 访问方式 |
|---------|------|------|----------|
| **frontend** | 8081 | Vue 3 用户界面 | 外部可访问 |
| **backend** | 3000 | NestJS REST API | 仅内部访问 |
| **postgres** | 5432 | PostgreSQL 数据库 | 仅内部访问 |
| **nginx** | 8081 | 反向代理和静态服务 | 外部可访问 |

### 数据持久化
- **数据库数据**: 自动持久化在 Docker 卷中
- **原型文件**: 存储在 `./data/prototypes/` 目录
- **上传文件**: 自动解压并保存在数据目录

## 📊 生产环境部署

### 安全加固措施

#### 1. 密钥和密码生成
```bash
# 生成强 JWT 密钥（至少 32 字节）
openssl rand -base64 32  # 用于 JWT_SECRET

# 生成强数据库密码（至少 24 字节）
openssl rand -base64 24  # 用于 POSTGRES_PASSWORD

# 生成应用密钥
openssl rand -hex 16     # 用于其他应用密钥
```

#### 2. 容器资源限制
在 `docker-compose.yml` 中添加资源限制以防止资源耗尽：
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: "1G"
          cpus: "0.5"
        reservations:
          memory: "512M"
          cpus: "0.25"
  
  frontend:
    deploy:
      resources:
        limits:
          memory: "512M"
          cpus: "0.3"
        reservations:
          memory: "256M"
          cpus: "0.1"
  
  postgres:
    deploy:
      resources:
        limits:
          memory: "2G"
          cpus: "0.5"
        reservations:
          memory: "1G"
          cpus: "0.25"
```

#### 3. 网络安全配置
- **禁用容器间不必要的通信**
- **使用内部网络隔离服务**
- **限制容器特权模式**
- **定期更新基础镜像以修复安全漏洞**

#### 4. 文件权限加固
```bash
# 设置严格的文件权限
chmod 600 .env                  # 配置文件仅 root 可读写
chmod 755 ./data               # 数据目录可读可执行
chmod -R 644 ./data/prototypes # 原型文件只读
chmod -R 755 ./data/temp       # 临时目录可执行

# 设置正确的文件所有者
chown -R 1000:1000 ./data      # Docker 容器用户权限
```

### 网络和安全配置
1. **防火墙规则**: 只允许外部访问前端端口（8081）
2. **SSL/TLS**: 建议使用 Nginx 反向代理配置 HTTPS
3. **备份策略**: 定期备份数据库和上传文件

### 性能优化
```bash
# 增加服务实例数量（需要调整负载均衡）
docker-compose up -d --scale backend=2 --scale frontend=2

# 监控服务性能
docker stats

# 查看资源使用情况
docker-compose top
```

## 🔍 故障排除指南

### 常见问题解决

#### 1. 端口冲突错误
```bash
# 解决方案：修改应用端口
echo "APP_PORT=9090" >> .env
docker-compose up -d --force-recreate
```

#### 2. 数据库连接失败
```bash
# 重启数据库服务
docker-compose restart postgres

# 检查数据库日志
docker-compose logs postgres | grep -i error

# 重置数据库（谨慎使用，会丢失数据）
docker-compose down -v
docker-compose up -d
```

#### 3. 文件权限问题
```bash
# 确保数据目录有写权限
chmod -R 755 ./data
chown -R 1000:1000 ./data  # Docker 容器用户权限
```

#### 4. 内存不足错误
```bash
# 增加 Docker 内存分配
# 或者优化服务资源配置
docker-compose down
docker system prune -f
docker-compose up -d
```

### 日志分析
```bash
# 查看所有服务日志
docker-compose logs --tail=100

# 实时监控日志
docker-compose logs -f

# 查看特定服务错误日志
docker-compose logs backend | grep -i error
docker-compose logs frontend | grep -i error
```

## 📝 维护和运维

### 日常维护命令
```bash
# 查看服务状态
docker-compose ps

# 重启特定服务
docker-compose restart backend

# 更新到最新版本
git pull origin main
docker-compose up -d --build

# 清理无用镜像和容器
docker system prune -f
```

### 数据备份和恢复
```bash
# 备份数据库
docker-compose exec postgres pg_dump -U postgres prd_management > backup_$(date +%Y%m%d).sql

# 备份原型文件
tar -czf prototypes_backup_$(date +%Y%m%d).tar.gz ./data/prototypes/

# 恢复数据库
docker-compose exec -T postgres psql -U postgres prd_management < backup.sql

# 恢复文件数据
tar -xzf prototypes_backup.tar.gz -C ./
```

### 数据库维护
```bash
# 1. 数据库性能优化
# 定期清理和重建索引
docker-compose exec postgres psql -U postgres prd_management -c "REINDEX DATABASE prd_management;"

# 2. 表统计信息更新
docker-compose exec postgres psql -U postgres prd_management -c "VACUUM ANALYZE;"

# 3. 连接池监控
docker-compose exec postgres psql -U postgres prd_management -c "SELECT * FROM pg_stat_activity;"

# 4. 数据库大小监控
docker-compose exec postgres psql -U postgres prd_management -c "SELECT pg_size_pretty(pg_database_size('prd_management'));"

# 5. 长期运行查询监控
docker-compose exec postgres psql -U postgres prd_management -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE state = 'active' AND now() - pg_stat_activity.query_start > interval '1 minute';"

### 版本升级

#### 标准升级流程
```bash
# 1. 备份当前数据（必须步骤）
docker-compose exec postgres pg_dump -U postgres prd_management > upgrade_backup_$(date +%Y%m%d).sql
tar -czf prototypes_upgrade_backup_$(date +%Y%m%d).tar.gz ./data/prototypes/

# 2. 拉取最新代码
git pull origin main

# 3. 检查环境配置更新
# 比较新的 .env.example 与当前 .env 文件，添加新配置选项

# 4. 重建并重启服务
docker-compose up -d --build --force-recreate

# 5. 验证升级结果
docker-compose logs --tail=100
curl -f http://localhost:8081/api/health
curl -f http://localhost:8081/api/projects

# 6. 清理旧镜像（可选）
docker image prune -f
```

#### 数据库架构变更处理
如果新版本包含数据库架构变更：
```bash
# 1. 检查是否需要数据库迁移
docker-compose exec backend npm run typeorm:schema:log

# 2. 执行数据库迁移（如果提示需要）
docker-compose exec backend npm run typeorm:migration:run

# 3. 生成新的迁移文件（开发环境）
docker-compose exec backend npm run typeorm:migration:generate -- -n MigrationName
```

#### 回滚步骤
如果升级失败需要回滚：
```bash
# 1. 恢复到备份版本
git checkout tags/previous-version

# 2. 恢复数据库
docker-compose exec -T postgres psql -U postgres prd_management < upgrade_backup_$(date +%Y%m%d).sql

# 3. 恢复文件数据
tar -xzf prototypes_upgrade_backup_$(date +%Y%m%d).tar.gz -C ./

# 4. 重启服务
docker-compose up -d --build
```

## 🚨 紧急情况处理

### 服务宕机恢复
```bash
# 强制重启所有服务
docker-compose down
docker-compose up -d

# 如果仍然有问题，清理后重启
docker-compose down -v --remove-orphans
docker system prune -f
docker-compose up -d
```

### 数据恢复步骤
1. 停止服务: `docker-compose down`
2. 恢复数据库备份
3. 恢复文件数据
4. 重启服务: `docker-compose up -d`

## 🤝 获取支持

### 文档资源
- 📖 [详细使用文档](README.md)
- 🌐 [在线演示](http://your-domain.com:8081)（如果部署了公网访问）
- 📚 [API 接口文档](http://localhost:8081/api/docs)（服务运行后访问）

### 问题反馈
- 🐛 [提交 Bug 报告](https://github.com/Redtrez/prd_manager/issues)
- 💡 [功能建议](https://github.com/Redtrez/prd_manager/discussions)
- ❓ [问答讨论](https://github.com/Redtrez/prd_manager/discussions)

### 社区支持
- ⭐ 给项目点个 Star 支持开发！
- 🔄 关注项目更新
- 🤝 欢迎提交 Pull Request

---

**重要提示**: 生产环境部署前，请务必：
1. 修改所有默认密码和密钥
2. 配置适当的防火墙规则
3. 设置定期备份策略
4. 监控服务运行状态

祝您使用愉快！🎉
