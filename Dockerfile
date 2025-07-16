# Use the official Node.js image with Alpine for a lightweight build
FROM node:20-alpine

# Set the default environment variables
ENV PORT 7020
ARG NODE_ENV=devnet
ENV NODE_ENV=${NODE_ENV}

# Set the working directory inside the container
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Expose the application port
EXPOSE ${PORT}

# Define the command to run your application
CMD ["npm", "start"]
