# Use the official Node.js image as the base image
FROM node:20

# Install necessary dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
  wget \
  gnupg \
  libnss3 \
  libx11-xcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxi6 \
  libxtst6 \
  libxrandr2 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libxss1 \
  libglib2.0-0 \
  libnss3-dev \
  libgbm-dev \
  libpango1.0-0 \
  libasound2 \
  libxshmfence1 \
  libxkbcommon0 \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json files
COPY package*.json ./
COPY .env .env

# Install dependencies
RUN npm install

# Install Playwright browsers
RUN npx playwright install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["node", "index.js"]
