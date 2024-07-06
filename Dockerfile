# # Stage 0: Install alpine Linux + node + npm + dependencies 
FROM node:16.15.1-alpine3.15@sha256:1fafca8cf41faf035192f5df1a5387656898bec6ac2f92f011d051ac2344f5c9 AS dependencies

LABEL maintainer="Batuhan Ipci" \
  description="Fragments node.js microservice"

ENV PORT=8080
ENV NODE_ENV=production
# # Reduce npm spam when installing within Docker
# # https://docs.npmjs.com/cli/v8/using-npm/config#loglevel
ENV NPM_CONFIG_LOGLEVEL=warn
# # Disable colour when run inside Docker
# # https://docs.npmjs.com/cli/v8/using-npm/config#color
ENV NPM_CONFIG_COLOR=false

# # Use /app as our working directory - cd /app
WORKDIR /app

# # Copy the package.json and package-lock.json files into the working dir (/app)
COPY package*.json ./

# # Install dependencies
#RUN npm ci --only=production 
# install sharp 
RUN npm ci --only=production \
  && npm install sharp@0.30.7

# ################################# = Layer = #################################

# # Stage 1: use dependencies to build the site
FROM node:16.15.1-alpine3.15@sha256:1fafca8cf41faf035192f5df1a5387656898bec6ac2f92f011d051ac2344f5c9 AS deploy

WORKDIR /app
# Copy cached dependencies from previous stage, this will be much faster as it doesn't need to generate the dependencies again
COPY --from=dependencies /app /app 

# Copy src to /app/src/
COPY ./src ./src

# Copy our HTPASSWD file
COPY ./tests/.htpasswd ./tests/.htpasswd

RUN apk --update --no-cache add curl=7.80.0-r4

# Run the server
CMD ["node", "./src/server.js"]


EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl --fail localhost:8080 || exit 1

########################################= LAYER =########################################
