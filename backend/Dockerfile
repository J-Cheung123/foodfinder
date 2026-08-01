FROM node:22-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY package.json package-lock.json ./

# This guarantees deterministic builds using exactly what is in package-lock.json
RUN npm ci

# Copy the rest of your backend code (including prisma folder)
COPY . .

# Generate the Prisma client INSIDE the Linux container
RUN npx prisma generate

# This ensures the app runs as a restricted user, limiting damage if breached
USER node

EXPOSE 5000

CMD ["npm", "start"]