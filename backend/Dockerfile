FROM node:20-alpine

WORKDIR /app

# backend creates an uploads directory for storing uploaded files.
RUN mkdir -p /app/uploads

# Copy dependency definitions
COPY package*.json ./

# Install dependencies cleanly
RUN npm ci --only=production

ARG FASTAPI_URL
ENV FASTAPI_URL=$FASTAPI_URL


# Copy application source code
COPY . .

EXPOSE 5000

CMD ["npm", "start"]