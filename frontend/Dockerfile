# Use the official, lightweight Nginx image
FROM nginx:alpine

# Remove the default Nginx placeholder files
RUN rm -rf /usr/share/nginx/html/*

# Copy your local frontend files directly into the Nginx web directory
COPY . /usr/share/nginx/html

# Expose port 80 inside the container
EXPOSE 80

# Start the Nginx server
CMD ["nginx", "-g", "daemon off;"]