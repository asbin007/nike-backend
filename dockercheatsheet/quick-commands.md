# 🚀 Docker Quick Commands Reference

## 📋 Most Used Commands

### System
```bash
docker --version          # Check version
docker info              # System info
docker system prune      # Clean up
```

### Images
```bash
docker images            # List images
docker pull <image>      # Pull image
docker build -t <name> . # Build image
docker rmi <image>       # Remove image
```

### Containers
```bash
docker ps                # Running containers
docker ps -a             # All containers
docker run -d -p 3000:3000 <image>  # Run container
docker stop <container>  # Stop container
docker start <container> # Start container
docker rm <container>    # Remove container
docker logs <container>  # View logs
docker exec -it <container> bash  # Enter container
```

### Docker Compose
```bash
docker-compose up        # Start services
docker-compose up -d     # Start in background
docker-compose down      # Stop services
docker-compose logs      # View logs
docker-compose ps        # List services
docker-compose exec <service> bash  # Enter service
```

## 🎯 Quick Start Commands

### First Time
```bash
# 1. Build image
docker build -t myapp .

# 2. Run container
docker run -d -p 3000:3000 myapp

# 3. Check if running
docker ps
```

### Development
```bash
# Start development
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose logs -f app

# Stop
docker-compose down
```

### Production
```bash
# Build and run
docker-compose up --build -d

# Update
docker-compose pull
docker-compose up -d
```

## 🔧 Troubleshooting

### Common Issues
```bash
# Container not starting
docker logs <container>

# Port in use
docker ps | grep 3000

# Permission issues
sudo chown -R $USER:$USER /var/run/docker.sock

# Clean everything
docker system prune -a --volumes
```

### Debug
```bash
# Check container
docker inspect <container>

# Resource usage
docker stats

# Enter container
docker exec -it <container> bash
```

## 📝 Aliases (Add to ~/.bashrc)
```bash
alias d='docker'
alias dc='docker-compose'
alias dps='docker ps'
alias dpsa='docker ps -a'
alias dimg='docker images'
alias dlog='docker logs'
alias dexec='docker exec -it'
alias dstop='docker stop'
alias drm='docker rm'
alias dprune='docker system prune'
alias dcup='docker-compose up'
alias dcupd='docker-compose up -d'
alias dcdown='docker-compose down'
alias dclogs='docker-compose logs'
```

## 🎯 Daily Workflow

### Morning
```bash
# Start development
docker-compose -f docker-compose.dev.yml up -d

# Check status
docker-compose ps
```

### During Development
```bash
# View logs
docker-compose logs -f app

# Rebuild after changes
docker-compose up --build

# Enter container
docker-compose exec app bash
```

### Evening
```bash
# Stop everything
docker-compose down

# Clean up
docker system prune
```

## 🚀 Deployment Commands

### Build & Push
```bash
# Build
docker build -t username/myapp:latest .

# Push
docker push username/myapp:latest

# Pull
docker pull username/myapp:latest
```

### Production
```bash
# Deploy
docker-compose -f docker-compose.prod.yml up -d

# Update
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

---

**💡 Tip: Use these commands daily to become a Docker expert!** 