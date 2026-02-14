# Development stage
FROM node:22-alpine AS development

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

CMD ["npm", "run", "start:dev"]

# Build stage
FROM development AS build

RUN npm run build

# Production stage
FROM node:22-alpine AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --only=production

COPY --from=build /usr/src/app/dist ./dist

CMD ["node", "dist/main"]
