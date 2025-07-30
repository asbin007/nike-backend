# 🚀 Docker Setup Guide for Beginners

## 📋 Prerequisites

### System Requirements
- **Windows**: Windows 10/11 (64-bit) with WSL2
- **macOS**: macOS 10.15 or later
- **Linux**: Ubuntu 18.04+, CentOS 7+, or similar

### Hardware Requirements
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: At least 20GB free space
- **CPU**: 64-bit processor with virtualization support

## 🔧 Installation Steps

### Step 1: Install Docker Desktop

#### Windows
1. **Download Docker Desktop**
   ```bash
   # Visit: https://www.docker.com/products/docker-desktop/
   # Download Docker Desktop for Windows
   ```

2. **Install Docker Desktop**
   - Run the installer
   - Follow the installation wizard
   - Restart your computer when prompted

3. **Enable WSL2 (if not already enabled)**
   ```powershell
   # Open PowerShell as Administrator
   dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
   dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
   ```

4. **Verify Installation**
   ```bash
   docker --version
   docker-compose --version
   ```

#### macOS
1. **Using Homebrew (Recommended)**
   ```bash
   brew install --cask docker
   ```

2. **Or Download from Website**
   - Visit: https://www.docker.com/products/docker-desktop/
   - Download Docker Desktop for Mac
   - Install and start Docker Desktop

3. **Verify Installation**
   ```bash
   docker --version
   docker-compose --version
   ```

#### Linux (Ubuntu)
1. **Update System**
   ```bash
   sudo apt-get update
   sudo apt-get upgrade
   ```

2. **Install Prerequisites**
   ```bash
   sudo apt-get install apt-transport-https ca-certificates curl gnupg lsb-release
   ```

3. **Add Docker's GPG Key**
   ```bash
   curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
   ```

4. **Add Docker Repository**
   ```bash
   echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
   ```

5. **Install Docker**
   ```bash
   sudo apt-get update
   sudo apt-get install docker-ce docker-ce-cli containerd.io
   ```

6. **Add User to Docker Group**
   ```bash
   sudo usermod -aG docker $USER
   newgrp docker
   ```

7. **Start and Enable Docker**
   ```bash
   sudo systemctl start docker
   sudo systemctl enable docker
   ```

8. **Verify Installation**
   ```bash
   docker --version
   docker-compose --version
   ```

### Step 2: Test Docker Installation

1. **Run Hello World Container**
   ```bash
   docker run hello-world
   ```

2. **Check Docker Info**
   ```bash
   docker info
   ```

3. **List Images**
   ```bash
   docker images
   ```

## 🎯 First Docker Project Setup

### Step 1: Create Project Structure
```bash
# Create project directory
mkdir my-docker-project
cd my-docker-project

# Create necessary files
touch Dockerfile
touch docker-compose.yml
touch .dockerignore
```

### Step 2: Create Basic Dockerfile
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Step 3: Create .dockerignore
```dockerignore
node_modules
npm-debug.log
.git
.gitignore
.env
README.md
```

### Step 4: Create docker-compose.yml
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    volumes:
      - .:/app
      - /app/node_modules
    restart: unless-stopped
```

### Step 5: Build and Run
```bash
# Build the image
docker build -t myapp .

# Run the container
docker run -d -p 3000:3000 myapp

# Or use docker-compose
docker-compose up -d
```

## 🔧 Development Environment Setup

### Step 1: Create Development Dockerfile
```dockerfile
# Dockerfile.dev
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
```

### Step 2: Create Development Compose File
```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  app_dev:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3001:3000"
    environment:
      - NODE_ENV=development
    volumes:
      - .:/app
      - /app/node_modules
    command: npm run dev
    restart: unless-stopped

  postgres_dev:
    image: postgres:15-alpine
    ports:
      - "5433:5432"
    environment:
      POSTGRES_DB: dev_db
      POSTGRES_USER: dev_user
      POSTGRES_PASSWORD: dev_pass
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_dev_data:
```

### Step 3: Start Development Environment
```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f app_dev

# Stop development environment
docker-compose -f docker-compose.dev.yml down
```

## 🚀 Production Setup

### Step 1: Create Production Dockerfile
```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["npm", "start"]
```

### Step 2: Create Production Compose File
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - app
    networks:
      - app-network
    restart: unless-stopped

networks:
  app-network:
    driver: bridge
```

### Step 3: Deploy to Production
```bash
# Build and deploy
docker-compose -f docker-compose.prod.yml up --build -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

## 🔍 Troubleshooting

### Common Issues and Solutions

#### 1. Docker Daemon Not Running
```bash
# Windows/macOS: Start Docker Desktop
# Linux:
sudo systemctl start docker
sudo systemctl status docker
```

#### 2. Permission Denied
```bash
# Linux: Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

#### 3. Port Already in Use
```bash
# Check what's using the port
docker ps | grep 3000
lsof -i :3000

# Use different port
docker run -p 3001:3000 myapp
```

#### 4. Container Not Starting
```bash
# Check container logs
docker logs <container_id>

# Check container details
docker inspect <container_id>
```

#### 5. Build Failures
```bash
# Clean build cache
docker system prune -a

# Rebuild without cache
docker build --no-cache -t myapp .
```

## 📝 Useful Commands for Beginners

### Basic Commands
```bash
# Check Docker version
docker --version

# List running containers
docker ps

# List all containers
docker ps -a

# List images
docker images

# Build image
docker build -t myapp .

# Run container
docker run -d -p 3000:3000 myapp

# Stop container
docker stop <container_id>

# Remove container
docker rm <container_id>

# View logs
docker logs <container_id>
```

### Docker Compose Commands
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild services
docker-compose up --build -d

# List services
docker-compose ps
```

## 🎯 Next Steps

### 1. Learn Docker Concepts
- Containers vs Images
- Volumes and Networks
- Multi-stage builds
- Docker Compose

### 2. Practice with Simple Projects
- Create a simple web app
- Add a database
- Set up development environment
- Deploy to production

### 3. Advanced Topics
- Docker Swarm
- Kubernetes
- CI/CD with Docker
- Security best practices

### 4. Resources
- [Docker Official Documentation](https://docs.docker.com/)
- [Docker Hub](https://hub.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

---

**🎉 Congratulations! You've successfully set up Docker and are ready to containerize your applications!** 