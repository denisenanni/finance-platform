# Stage 1: Base development image
FROM node:20-alpine AS development

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN yarn install

# Copy the rest of the project
COPY . .

# Expose the development port
EXPOSE 3000

# Start the development server (with hot-reloading)
CMD ["npm", "run", "dev"]


# Stage 2: Build the app for production
# FROM node:18-alpine AS build

# WORKDIR /app

# COPY package*.json ./
# RUN npm install

# COPY . .

# Generate optimized production build
# RUN npm run build


# Stage 3: Run the production build with Next.js server
# FROM node:18-alpine AS production

# WORKDIR /app

# # Only install production dependencies
# COPY package*.json ./
# RUN npm install --production

# # Copy built assets from previous stage
# COPY --from=build /app/.next ./.next
# COPY --from=build /app/public ./public
# COPY --from=build /app/next.config.js ./next.config.js
# COPY --from=build /app/node_modules ./node_modules
# COPY --from=build /app/package.json ./package.json
# COPY --from=build /app/tailwind.config.js ./tailwind.config.js
# COPY --from=build /app/postcss.config.js ./postcss.config.js
# COPY --from=build /app/tsconfig.json ./tsconfig.json

# EXPOSE 3000

# # Start Next.js in production mode
# CMD ["npm", "run", "start"]

