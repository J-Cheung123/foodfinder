# Use a Node image
FROM node:22-alpine

# Set the working directory
WORKDIR /app

# Copy package files FIRST
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of your backend code (including prisma folder)
COPY . .

# Generate the Prisma client INSIDE the Linux container
RUN npx prisma generate

# Expose your Express port
EXPOSE 3000

# Start the server
CMD ["npm", "start"]
