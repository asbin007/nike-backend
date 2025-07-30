# Nike Backend - Docker Setup Guide

## Prerequisites
- Docker Desktop installed
- Docker Compose installed

## Quick Start

### 1. Development Environment
```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up --build

# Stop development environment
docker-compose -f docker-compose.dev.yml down
```

### 2. Production Environment
```bash
# Create .env file with your environment variables
cp .env.example .env

# Edit .env file with your actual values
# DATABASE_URL, JWT_SECRETE_KEY, EMAIL, PASSWORD, etc.

# Start production environment
docker-compose up --build

# Stop production environment
docker-compose down
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL=postgresql://nike_user:nike_password@postgres:5432/nike_db

# JWT Configuration
JWT_SECRETE_KEY=your_super_secret_jwt_key_here

# Email Configuration
EMAIL=your_email@gmail.com
PASSWORD=your_email_app_password

# Admin Configuration
ADMIN_EMAIL=admin@nike.com
ADMIN_PASSWORD=admin123
ADMIN_USERNAME=admin

# Cloudinary Configuration (optional)
CLOUDINARY_URL=your_cloudinary_url
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Server Configuration
PORT=3000
NODE_ENV=production
```

## Services

### Development Environment (docker-compose.dev.yml)
- **App**: Node.js backend on port 5001
- **PostgreSQL**: Database on port 5432
- **Redis**: Cache on port 6379

### Production Environment (docker-compose.yml)
- **App**: Node.js backend on port 3000
- **PostgreSQL**: Database on port 5432
- **Redis**: Cache on port 6379

## Useful Commands

```bash
# View logs
docker-compose logs -f app

# Access database
docker exec -it nike_postgres psql -U nike_user -d nike_db

# Access Redis
docker exec -it nike_redis redis-cli

# Rebuild containers
docker-compose up --build

# Remove all containers and volumes
docker-compose down -v

# View running containers
docker ps
```

## Health Checks

- **App**: `http://localhost:3000/api/health` (production)
- **App**: `http://localhost:5001/api/health` (development)
- **PostgreSQL**: Automatic health check
- **Redis**: Automatic health check

## Troubleshooting

### Port Already in Use
If ports are already in use, modify the port mappings in docker-compose files.

### Database Connection Issues
1. Check if PostgreSQL container is running
2. Verify DATABASE_URL in environment variables
3. Check database logs: `docker-compose logs postgres`

### Build Issues
1. Clear Docker cache: `docker system prune -a`
2. Rebuild without cache: `docker-compose build --no-cache`

### Volume Issues
1. Check file permissions
2. Ensure uploads directory exists
3. Restart containers: `docker-compose restart`

## Production Deployment

### 1. Build Production Image
```bash
docker build -t nike-backend:latest .
```

### 2. Run Production Container
```bash
docker run -d \
  --name nike-backend \
  -p 3000:3000 \
  --env-file .env \
  nike-backend:latest
```

### 3. Using Docker Compose
```bash
# Start all services
docker-compose up -d

# Scale application
docker-compose up -d --scale app=3
```

## Security Notes

- Change default passwords in production
- Use strong JWT secrets
- Enable SSL/TLS in production
- Regularly update base images
- Use secrets management for sensitive data 