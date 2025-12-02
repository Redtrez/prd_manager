# PRD Manager 部署指南

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

# 2. 启动所有服务（后台模式）
docker-compose up -d

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
# 应用端口配置（默认: 8081）
APP_PORT=8081

# 数据库配置（生产环境必须修改密码）
POSTGRES_DB=prd_manager
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_PORT=5432

# JWT 密钥配置（生产环境必须修改）
JWT_SECRET=your_very_secure_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=7d

# 文件上传配置
MAX_FILE_SIZE=50mb
ALLOWED_FILE_TYPES=zip,html,htm,css,js,json

# 跨域配置（如果需要外部访问）
CORS_ORIGIN=http://localhost:8081
FRONTEND_URL=http://localhost:8081
```

### 重要安全配置说明
1. **数据库密码**: 生产环境必须修改默认密码
2. **JWT 密钥**: 必须使用强随机字符串
3. **应用端口**: 可根据需要修改，确保防火墙开放对应端口

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
```bash
# 1. 生成强密码和密钥
openssl rand -base64 32  # 用于 JWT_SECRET
openssl rand -base64 24  # 用于数据库密码

# 2. 限制容器资源
# 在 docker-compose.yml 中添加资源限制
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
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
docker-compose exec postgres pg_dump -U postgres prd_manager > backup_$(date +%Y%m%d).sql

# 备份原型文件
tar -czf prototypes_backup_$(date +%Y%m%d).tar.gz ./data/prototypes/

# 恢复数据库
docker-compose exec -T postgres psql -U postgres prd_manager < backup.sql

# 恢复文件数据
tar -xzf prototypes_backup.tar.gz -C ./
```

### 版本升级
```bash
# 1. 备份当前数据
# 2. 拉取最新代码
git pull origin main

# 3. 重建并重启服务
docker-compose up -d --build

# 4. 验证升级结果
docker-compose logs --tail=50
curl http://localhost:8081/api/health
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