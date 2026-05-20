FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY ./front/bFOPSSYS/package.json ./front/bFOPSSYS/package-lock.json* ./

# Install dependencies
RUN npm install

# Copy frontend source
COPY ./front/bFOPSSYS/ .

EXPOSE 5173

# Vite required to run on 0.0.0.0 for Docker port mapping
CMD ["npm", "run", "dev", "--", "--host"]