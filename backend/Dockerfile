# Stage 1: Base development image
FROM node:20-slim AS development

# Install OpenSSL and other required dependencies
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files first (for better Docker layer caching)
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Remove any existing Prisma installations and reinstall
RUN rm -rf node_modules/@prisma node_modules/.prisma 2>/dev/null || true
RUN yarn install --frozen-lockfile --force

# Debug: Check Prisma installation
RUN ls -la node_modules/@prisma/
RUN ls -la node_modules/@prisma/client/ || echo "client directory not found"

RUN npx prisma generate

# Expose backend port
EXPOSE 3001

# Default command (can be overridden in docker-compose)
CMD ["yarn", "run", "dev"]

# Stage 2: Production build (uncomment for production)
# FROM node:20-slim AS production
# 
# # Install OpenSSL and other required dependencies
# RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
# 
# WORKDIR /app
# 
# # Copy package files
# COPY package.json yarn.lock ./
# 
# # Install only production dependencies
# RUN yarn install --frozen-lockfile --production
# 
# # Copy application code
# COPY . .
# 
# # Generate Prisma client
# RUN npx prisma generate
# 
# # Expose port
# EXPOSE 3001
# 
# # Start the application
# CMD ["yarn", "run", "start"]