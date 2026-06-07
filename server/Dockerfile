FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 1234
VOLUME ["/app/data"]
ENV HOST=0.0.0.0
ENV YPERSISTENCE=/app/data
CMD ["npm", "start"]
