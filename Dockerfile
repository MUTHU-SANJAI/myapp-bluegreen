# Use a small official Node image
FROM node:18-alpine

# Set working directory inside the container
WORKDIR /app

# Copy only package files first for better caching
COPY package*.json ./

# Install production dependencies
RUN npm ci --production

# Copy the rest of the app source
COPY . .

# Expose the port that our app listens on
EXPOSE 3000

# Define startup command
CMD ["node", "index.js"]
