# Prototype Management Platform

[English](README.md) | [中文](README_zh.md)

A self-hosted platform for managing Axure HTML prototypes, featuring user authentication, project management, version control, and announcements.

## Features

- **Identity System**: User login/register, Admin/User roles.
  - *Note*: The permission system is currently optimized for internal network usage where sharing direct links is sufficient. For production environments, additional security measures may be needed.
- **Project Management**: Create, edit, delete projects with tags.
- **Version Control**: Upload Axure HTML zip files, auto-unzip, and preview.
- **Announcements**: Admin-managed announcements system.
- **Deployment**: Docker Compose with Nginx reverse proxy.

## Tech Stack

- **Frontend**: Vue 3, Element Plus, Vite, Pinia
- **Backend**: NestJS, TypeORM, PostgreSQL
- **Infrastructure**: Docker, Nginx

## Deployment

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

## Usage Guide

1. **Register/Login**: Create an account.
2. **Create Project**: Go to "Projects" and click "Create Project".
3. **Upload Version**: Click on a project name, then "Upload New Version". Upload a zip file containing your Axure HTML export (ensure `index.html` is in the root or handled by the unzipper).
4. **Preview**: Click "Preview" on a version to view the prototype.
5. **Announcements**: Admins can post announcements visible to all users.

## Development

- **Backend**: `cd backend && npm run start:dev` (Port 3000)
- **Frontend**: `cd frontend && npm run dev` (Port 5173)
