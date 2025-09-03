# Use official Node.js image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source
COPY . .

# Expose app port (Fly expects this)
EXPOSE 3000

# Start the app
CMD ["npm", "run", "dev"]