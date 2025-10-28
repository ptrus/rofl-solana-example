FROM node:22-alpine

# Create app directory.
WORKDIR /app

# Copy package files.
COPY package*.json ./

# Install dependencies (production only).
RUN npm ci --omit=dev

# Install tsx globally for running TypeScript.
RUN npm install -g tsx

# Copy application code.
COPY index.ts ./
COPY src/ ./src/

# Run the application.
CMD ["tsx", "index.ts"]
