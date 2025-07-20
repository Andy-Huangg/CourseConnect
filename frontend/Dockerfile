# Frontend Dockerfile
FROM node:20-alpine AS build
WORKDIR /app

# Copy and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Accept build-time variables for Vite
ARG VITE_API_URL
ARG VITE_WS_URL

# Inject them into environment for use in build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL

# Optional: Overwrite .env file to ensure correct values are used
RUN echo "VITE_API_URL=$VITE_API_URL" > .env && \
    echo "VITE_WS_URL=$VITE_WS_URL" >> .env

# Build the frontend
RUN npm run build

# Serve using Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
