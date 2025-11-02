# 1. Base image Node 20 LTS
FROM node:20-slim

# 2. Install dependencies needed by Playwright
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libnss3 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libxshmfence1 \
    libdrm2 \
    libxrender1 \
    libxext6 \
    libxfixes3 \
    libxss1 \
    libxcursor1 \
    && rm -rf /var/lib/apt/lists/*

# 3. Set working directory
WORKDIR /usr/src/app

# 4. Copy package.json and package-lock.json
COPY package*.json ./

# 5. Install dependencies
RUN npm install

# 6. Copy the rest of the project
COPY . .

# 7. Install Playwright browsers
RUN npm install -g playwright
RUN npx playwright install --with-deps

# 8. Expose port
EXPOSE 8080

# 9. Start server
CMD ["node", "--loader", "ts-node/esm", "server.ts"]
