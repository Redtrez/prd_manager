# 原型管理平台 (Prototype Management Platform)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[English](README.md) | [中文](README_zh.md)

一个自托管的 Axure HTML 原型管理平台，具有用户认证、项目管理、版本控制和公告系统等功能。

## 功能特性

- **身份系统**：用户登录/注册，管理员/用户角色，完整的权限管理体系。
- **项目管理**：创建、编辑、删除项目，支持标签管理和层级组织。
- **版本控制**：支持 Axure HTML 和自定义 HTML Demo 上传，自动解压并支持在线预览。
- **多格式支持**：上传 Axure HTML zip 文件或自定义 HTML 演示项目，支持配置入口文件。
- **公告系统**：管理员管理的公告发布系统，支持富文本格式。
- **部署**：基于 Docker Compose 和 Nginx 反向代理的一键生产环境部署。
- **国际化**：完整的英文和中文语言支持。
- **响应式设计**：针对桌面和移动设备优化的界面设计。

## 技术栈

- **前端**：Vue 3, Element Plus, Vite, Pinia
- **后端**：NestJS, TypeORM, PostgreSQL
- **基础设施**：Docker, Nginx

## 部署指南

详细部署说明： [中文](DEPLOYMENT_GUIDE_zh.md) | [English](DEPLOYMENT_GUIDE.md)

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

### 文件上传类型

- **Axure HTML**：上传 Axure 生成的 zip 文件（自动检测）
- **HTML Demo**：上传自定义 HTML 项目，支持配置入口文件
  - 支持的入口文件：`index.html`、`start.html` 或任何自定义 HTML 文件
  - 自动字体替换以获得更好的兼容性

### 生产环境部署

生产环境部署请参考详细的[部署指南](DEPLOYMENT_GUIDE_zh.md)，内容包括：
- 环境配置
- 数据库备份流程
- SSL 证书设置
- 性能优化建议

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
