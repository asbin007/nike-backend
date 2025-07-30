# 🐳 Complete Docker Cheatsheet - Everything You Need to Know

## 📋 Table of Contents
1. [Installation](#installation)
2. [Basic Commands](#basic-commands)
3. [Dockerfile](#dockerfile)
4. [Docker Compose](#docker-compose)
5. [Environment Variables](#environment-variables)
6. [Volumes & Networks](#volumes--networks)
7. [Monitoring & Debugging](#monitoring--debugging)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)
11. [Quick Start Guide](#quick-start-guide)

---

## 🔧 Installation

### Windows
```bash
# Download Docker Desktop from: https://www.docker.com/products/docker-desktop/
# Install and restart computer
docker --version
docker-compose --version
```

### macOS
```bash
# Using Homebrew
brew install --cask docker

# Or download from Docker website
docker --version
```

### Linux (Ubuntu)
```bash
# Update and install prerequisites
sudo apt-get update
sudo apt-get install apt-transport-https ca-certificates curl gnupg lsb-release

# Add Docker's GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add repository
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker
```

---

## 🚀 Basic Commands

### System Information
```bash
docker --version                    # Check Docker version
docker info                        # System information
docker system df                   # Disk usage
docker system prune                # Clean unused resources
docker system prune -a --volumes   # Clean everything
```

### Image Management
```bash
# List images
docker images
docker image ls

# Pull image from registry
docker pull node:18-alpine
docker pull postgres:15
docker pull nginx:alpine

# Remove image
docker rmi <image_id>
docker rmi <image_name>
docker image rm <image_name>

# Build image from Dockerfile
docker build -t myapp:latest .
docker build -t myapp:v1.0 .
docker build --no-cache -t myapp:latest .

# Save/Load images
docker save myapp:latest > myapp.tar
docker load < myapp.tar

# Tag image
docker tag myapp:latest username/myapp:latest
```

### Container Management
```bash
# List containers
docker ps                          # Running containers
docker ps -a                       # All containers
docker ps -q                       # Only container IDs
docker ps --format "table {{.ID}}\t{{.Names}}\t{{.Status}}\t{{.Ports}}"

# Run container
docker run -d --name myapp -p 3000:3000 myapp:latest
docker run -it --name myapp -p 3000:3000 myapp:latest bash
docker run --rm -it --name myapp -p 3000:3000 myapp:latest

# Stop/Start containers
docker stop <container_id>
docker start <container_id>
docker restart <container_id>
docker pause <container_id>
docker unpause <container_id>

# Remove container
docker rm <container_id>
docker rm -f <container_id>        # Force remove running container
docker container prune             # Remove stopped containers

# Container logs
docker logs <container_id>
docker logs -f <container_id>      # Follow logs
docker logs --tail 100 <container_id>
docker logs --since 1h <container_id>

# Execute commands in running container
docker exec -it <container_id> bash
docker exec -it <container_id> sh
docker exec <container_id> ls /app
docker exec <container_id> cat /etc/os-release
```

---

## 🏗️ Dockerfile

### Basic Dockerfile
```dockerfile
# Base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "start"]
```

### Multi-stage Build
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["npm", "start"]
```

### Security Best Practices
```dockerfile
# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Use specific base image version
FROM node:18.19-alpine

# Update packages
RUN apk update && apk upgrade

# Clean up
RUN npm cache clean --force
```

---

## 🐙 Docker Compose

### Basic Commands
```bash
# Start services
docker-compose up
docker-compose up -d               # Detached mode
docker-compose up --build          # Rebuild images
docker-compose up -d --build       # Detached + rebuild

# Stop services
docker-compose down
docker-compose down -v             # Remove volumes too
docker-compose down --rmi all      # Remove images too

# List services
docker-compose ps
docker-compose ps -a

# View logs
docker-compose logs
docker-compose logs app            # Specific service
docker-compose logs -f app         # Follow logs
docker-compose logs --tail=100 app # Last 100 lines

# Execute commands
docker-compose exec app bash
docker-compose exec postgres psql -U user -d dbname
docker-compose exec redis redis-cli

# Scale services
docker-compose up -d --scale app=3

# Multiple compose files
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### Basic docker-compose.yml
```yaml
version: '3.8'

services:
  app:
    build: .
    container_name: myapp
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@postgres:5432/dbname
    depends_on:
      - postgres
      - redis
    volumes:
      - ./uploads:/app/uploads
    restart: unless-stopped
    networks:
      - app-network

  postgres:
    image: postgres:15-alpine
    container_name: postgres_db
    environment:
      POSTGRES_DB: dbname
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: redis_cache
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - app-network
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: nginx_proxy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - app
    networks:
      - app-network
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:

networks:
  app-network:
    driver: bridge
```

### Development docker-compose.dev.yml
```yaml
version: '3.8'

services:
  app_dev:
    build:
      context: .
      dockerfile: Dockerfile.dev
    container_name: myapp_dev
    ports:
      - "3001:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://dev_user:dev_pass@postgres_dev:5432/dev_db
    volumes:
      - .:/app
      - /app/node_modules
    command: npm run dev
    depends_on:
      - postgres_dev
    networks:
      - dev-network

  postgres_dev:
    image: postgres:15-alpine
    container_name: postgres_dev
    ports:
      - "5433:5432"
    environment:
      POSTGRES_DB: dev_db
      POSTGRES_USER: dev_user
      POSTGRES_PASSWORD: dev_pass
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data
    networks:
      - dev-network

volumes:
  postgres_dev_data:

networks:
  dev-network:
    driver: bridge
```

---

## 🔐 Environment Variables

### Docker Run
```bash
# Single variable
docker run -e NODE_ENV=production myapp

# Multiple variables
docker run -e NODE_ENV=production -e PORT=3000 myapp

# From file
docker run --env-file .env myapp
docker run --env-file .env.production myapp
```

### Docker Compose
```yaml
services:
  app:
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_URL=postgresql://user:pass@postgres:5432/dbname
    
    # Or use env_file
    env_file:
      - .env
      - .env.production
      - .env.local
```

### .env File Example
```env
# Database
DATABASE_URL=postgresql://user:pass@postgres:5432/dbname
DB_HOST=postgres
DB_PORT=5432
DB_NAME=dbname
DB_USER=user
DB_PASS=pass

# Application
NODE_ENV=production
PORT=3000
JWT_SECRET=your_jwt_secret_here

# Email
EMAIL=your_email@example.com
EMAIL_PASSWORD=your_email_password

# Cloudinary
CLOUDINARY_URL=your_cloudinary_url
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin_password
ADMIN_USERNAME=admin
```

---

## 📦 Volumes & Networks

### Volume Commands
```bash
# List volumes
docker volume ls
docker volume inspect my-data

# Create volume
docker volume create my-data

# Remove volume
docker volume rm my-data
docker volume prune

# Backup volume
docker run --rm -v my-data:/data -v $(pwd):/backup alpine tar czf /backup/my-data.tar.gz -C /data .
```

### Network Commands
```bash
# List networks
docker network ls
docker network inspect bridge

# Create custom network
docker network create my-network
docker network create --driver bridge my-network

# Connect container to network
docker network connect my-network <container_id>
docker network disconnect my-network <container_id>

# Remove network
docker network rm my-network
docker network prune
```

### Volume Types
```yaml
services:
  app:
    volumes:
      # Named volume
      - postgres_data:/var/lib/postgresql/data
      
      # Bind mount
      - ./uploads:/app/uploads
      - /host/path:/container/path
      
      # Anonymous volume
      - /app/temp
      
      # Read-only mount
      - ./config:/app/config:ro
```

---

## 🔍 Monitoring & Debugging

### Container Inspection
```bash
# Container details
docker inspect <container_id>
docker inspect --format='{{.State.Status}}' <container_id>

# Resource usage
docker stats
docker stats --no-stream
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# Container processes
docker top <container_id>

# Container changes
docker diff <container_id>

# Container logs with timestamps
docker logs -t <container_id>
```

### Debug Commands
```bash
# Run container with interactive shell
docker run -it --entrypoint /bin/bash myapp
docker run -it --entrypoint /bin/sh myapp

# Execute in running container
docker exec -it <container_id> /bin/bash
docker exec -it <container_id> /bin/sh

# Check container filesystem
docker exec <container_id> ls -la /app
docker exec <container_id> cat /etc/os-release
docker exec <container_id> ps aux

# Copy files from/to container
docker cp <container_id>:/app/file.txt ./file.txt
docker cp ./file.txt <container_id>:/app/file.txt
```

---

## 🚀 Deployment

### Build & Push to Registry
```bash
# Build image
docker build -t username/myapp:latest .
docker build -t username/myapp:v1.0 .

# Tag image
docker tag myapp:latest username/myapp:latest

# Login to Docker Hub
docker login

# Push to Docker Hub
docker push username/myapp:latest
docker push username/myapp:v1.0

# Pull from registry
docker pull username/myapp:latest
```

### Production Deployment
```bash
# Pull latest image
docker pull username/myapp:latest

# Stop old container
docker stop myapp

# Remove old container
docker rm myapp

# Run new container
docker run -d --name myapp -p 3000:3000 username/myapp:latest

# Or using docker-compose
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

### Docker Swarm (Basic)
```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml myapp

# List services
docker service ls

# Scale service
docker service scale myapp_app=3

# Remove stack
docker stack rm myapp
```

---

## 🛠️ Troubleshooting

### Common Issues
```bash
# Container not starting
docker logs <container_id>
docker inspect <container_id>

# Port already in use
docker ps | grep 3000
lsof -i :3000
netstat -tulpn | grep 3000

# Permission issues (Linux)
sudo chown -R $USER:$USER /var/run/docker.sock
sudo usermod -aG docker $USER

# Docker daemon not running
sudo systemctl start docker
sudo systemctl status docker

# Clean up everything
docker system prune -a --volumes
docker container prune
docker image prune
docker volume prune
docker network prune
```

### Debug Commands
```bash
# Check Docker info
docker info
docker version

# Check disk space
docker system df
df -h

# Check memory usage
free -h
docker stats

# Check network connectivity
docker network ls
docker network inspect bridge
ping google.com
```

---

## 📋 Best Practices

### Security
```dockerfile
# Use specific base image version
FROM node:18.19-alpine

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Update packages
RUN apk update && apk upgrade

# Use multi-stage builds
FROM node:18-alpine AS builder
# ... build steps
FROM node:18-alpine AS production
# ... production steps

# Scan for vulnerabilities
docker scan myapp:latest
```

### Performance
```dockerfile
# Use .dockerignore
node_modules
npm-debug.log
.git
.env

# Layer caching
COPY package*.json ./
RUN npm ci --only=production
COPY . .

# Use alpine images
FROM node:18-alpine

# Clean up
RUN npm cache clean --force
RUN apk del .build-deps
```

### Development
```yaml
# Use volumes for development
volumes:
  - .:/app
  - /app/node_modules

# Use different ports
ports:
  - "3001:3000"  # Development
  - "3000:3000"  # Production

# Use environment-specific files
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

---

## 🎯 Quick Start Guide

### First Time Setup
```bash
# 1. Install Docker
# 2. Verify installation
docker --version
docker-compose --version

# 3. Create Dockerfile
# 4. Create docker-compose.yml
# 5. Build and run
docker-compose up --build
```

### Daily Development
```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose logs -f app

# Make changes and rebuild
docker-compose up --build

# Stop development
docker-compose down

# Clean up
docker system prune
```

### Production Deployment
```bash
# Build production image
docker build -t myapp:latest .

# Test locally
docker run -d -p 3000:3000 myapp:latest

# Push to registry
docker tag myapp:latest username/myapp:latest
docker push username/myapp:latest

# Deploy to server
docker pull username/myapp:latest
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📝 Useful Aliases

Add to `~/.bashrc` or `~/.zshrc`:
```bash
# Docker aliases
alias d='docker'
alias dc='docker-compose'
alias dps='docker ps'
alias dpsa='docker ps -a'
alias dimg='docker images'
alias dlog='docker logs'
alias dexec='docker exec -it'
alias dstop='docker stop'
alias drm='docker rm'
alias drmi='docker rmi'
alias dprune='docker system prune'
alias dstat='docker stats'
alias dbuild='docker build'
alias drun='docker run'
alias dpull='docker pull'
alias dpush='docker push'

# Docker Compose aliases
alias dcup='docker-compose up'
alias dcupd='docker-compose up -d'
alias dcdown='docker-compose down'
alias dcbuild='docker-compose build'
alias dclogs='docker-compose logs'
alias dcexec='docker-compose exec'
```

---

## 🔗 Useful Resources

- **Official Documentation**: https://docs.docker.com/
- **Docker Hub**: https://hub.docker.com/
- **Docker Compose**: https://docs.docker.com/compose/
- **Best Practices**: https://docs.docker.com/develop/dev-best-practices/
- **Security**: https://docs.docker.com/engine/security/

---

**🎉 Congratulations! You now have a complete Docker cheatsheet. Save this file and refer to it whenever you need Docker commands and best practices!** 