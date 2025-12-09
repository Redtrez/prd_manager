# Prototype Management Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[English](README.md) | [中文](README_zh.md)

A self-hosted platform for managing Axure HTML prototypes, featuring user authentication, project management, version control, and announcements.

## Features

- **Identity System**: User login/register, Admin/User roles with comprehensive permission management.
- **Project Management**: Create, edit, delete projects with tags and hierarchical organization.
- **Version Control**: Support for both Axure HTML and custom HTML Demo uploads with auto-unzip and preview.
- **Multi-format Support**: Upload Axure HTML zip files or custom HTML demos with configurable entry points.
- **Announcements**: Admin-managed announcements system with rich text support.
- **Deployment**: Docker Compose with Nginx reverse proxy for easy production deployment.
- **Internationalization**: Full English and Chinese language support.
- **Responsive Design**: Optimized for desktop and mobile devices.

## Tech Stack

- **Frontend**: Vue 3, Element Plus, Vite, Pinia
- **Backend**: NestJS, TypeORM, PostgreSQL
- **Infrastructure**: Docker, Nginx

## Deployment

Deployment Guide: [English](DEPLOYMENT_GUIDE.md) | [中文](DEPLOYMENT_GUIDE_zh.md)

### Prerequisites

- Docker & Docker Compose installed.

### Steps

1. Clone the repository.
2. Navigate to the project root.
3. Run the following command to start all services:

```bash
docker-compose up -d --build
```

4. Access the application at `http://localhost:8081`.

### Default Accounts

- **Admin**: The first registered user is automatically set as administrator. Subsequent users have regular user permissions by default.
    - *Tip*: To make a user admin, access the postgres container:
      ```bash
      docker exec -it prd_postgres psql -U admin -d prd_management
      UPDATE users SET role = 'ADMIN' WHERE username = 'your_username';
      ```

### File Upload Types

- **Axure HTML**: Upload Axure-generated zip files (auto-detected)
- **HTML Demo**: Upload custom HTML projects with configurable entry points
  - Supported entry files: `index.html`, `start.html`, or any custom HTML file
  - Automatic font replacement for better compatibility

### Production Deployment

For production deployment, refer to the detailed [Deployment Guide](DEPLOYMENT_GUIDE.md) which includes:
- Environment configuration
- Database backup procedures
- SSL certificate setup
- Performance optimization tips

## Usage Guide

1. **Register/Login**: Create an account.
2. **Create Project**: Go to "Projects" and click "Create Project".
3. **Upload Version**: Click on a project name, then "Upload New Version". Upload a zip file containing your Axure HTML export (ensure `index.html` is in the root or handled by the unzipper).
4. **Preview**: Click "Preview" on a version to view the prototype.
5. **Announcements**: Admins can post announcements visible to all users.

## Development

- **Backend**: `cd backend && npm run start:dev` (Port 3000 - internal only)
- **Frontend**: `cd frontend && npm run dev` (Port 5173 - internal only)
- **Production**: Only the frontend port (8081 by default) is exposed externally for security
