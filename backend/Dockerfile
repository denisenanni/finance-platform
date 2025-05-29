# Stage 1: Base development image
FROM node:20-alpine AS development

# Set working directory
WORKDIR /app

# Install required dependencies
COPY package*.json ./
RUN yarn install

# Copy the rest of the application code
COPY . .

# Prisma: generate client
RUN npx prisma generate

# Expose backend port
EXPOSE 3001

# Default command (can be overridden in docker-compose)
CMD ["yarn", "run", "dev"]


# Stage 2: Production build (optional for final deployment)
# FROM node:20-alpine AS production

# WORKDIR /app

# COPY package*.json ./
# RUN npm ci --only=production

# COPY . .

# RUN npx prisma generate

# EXPOSE 3001

# CMD ["npm", "run", "start"]

