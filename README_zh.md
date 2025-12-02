# 原型管理平台 (Prototype Management Platform)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[English](README.md) | [中文](README_zh.md)

一个自托管的 Axure HTML 原型管理平台，具有用户认证、项目管理、版本控制和公告系统等功能。

## 功能特性

- **身份系统**：用户登录/注册，管理员/用户角色。
  - *注意*：当前权限系统主要针对内网使用场景优化，直接分享内网链接即可满足需求。生产环境可能需要额外的安全措施。
- **项目管理**：创建、编辑、删除项目，支持标签管理。
- **版本控制**：上传 Axure HTML zip 压缩包，自动解压并支持在线预览。
- **公告系统**：管理员管理的公告发布系统。
- **部署**：基于 Docker Compose 和 Nginx 反向代理的一键部署。

## 技术栈

- **前端**：Vue 3, Element Plus, Vite, Pinia
- **后端**：NestJS, TypeORM, PostgreSQL
- **基础设施**：Docker, Nginx

## 部署指南

详细部署说明请参考 [部署指南](deployment_guide.md)。

### 前置要求

- 已安装 Docker 和 Docker Compose。

### 快速开始

1. 克隆本仓库。
2. 进入项目根目录。
3. 运行以下命令启动所有服务：

```bash
docker-compose up -d --build
```

4. 访问应用：`http://localhost:8081`。

### 自定义端口

如果您想更改默认端口 (8081)，可以在根目录下创建一个 `.env` 文件并设置 `APP_PORT`：

```bash
APP_PORT=9090
```

然后重新运行 `docker-compose up -d`。

### 默认账号

- **管理员**：第一个注册的用户会自动设置为管理员。后续注册的用户默认具有普通用户权限。
    - *提示*：要将用户设置为管理员，请进入 postgres 容器执行 SQL：
      ```bash
      docker exec -it prd_manager_postgres psql -U admin -d prd_management
      UPDATE users SET role = 'ADMIN' WHERE username = 'your_username';
      ```

## 使用指南

1. **注册/登录**：创建一个账户。
2. **创建项目**：进入“项目列表”，点击“新建项目”。
3. **上传版本**：点击项目名称进入详情页，然后点击“上传新版本”。上传包含 Axure HTML 导出的 zip 文件（确保 `index.html` 在根目录或由解压程序处理）。
4. **预览**：点击版本列表中的“预览”按钮查看原型。
5. **公告**：管理员可以发布对所有用户可见的公告。

## 开发

- **后端**：`cd backend && npm run start:dev` (端口 3000 - 仅内部访问)
- **前端**：`cd frontend && npm run dev` (端口 5173 - 仅内部访问)
- **生产环境**：出于安全考虑，仅前端端口（默认8081）对外暴露
