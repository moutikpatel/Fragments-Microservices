# Fragments Microservice

> Back-end cloud-based microservice using AWS cloud technologies.

## Overview

Unlike the monolithic architectures, [microservice](https://aws.amazon.com/microservices/) allows each service to be independently scaled to meet demand for the application feature it supports.

## Instructions on running the service

1. `npm install` to install all the dependencies along with node modules folder.

2. After installing all the dependencies, you can `run` the service with the following methods:

```sh
npm start # normal - ready for the production
npm run dev # Run with nodemon and watch src/** folder for any changes
npm run debug # Run with nodemon and node inspector
```

Run [Eslint](https://eslint.org/docs/latest/user-guide/getting-started) to make sure the code is following the proper JS coding standards

```sh
npm run lint # Run eslint
```

---

## Commands

> **Warning**: You first need to `POST` a fragment and paste into `<FRAGMENT-ID>` to work with GET method
> **GET**

```bash
curl -i -u user1@email.com:password1 \
"http://localhost:8080/v1/fragments/aabce737-9e66-445d-9be3-51d38304ccf1"
```

**POST (md)**

```bash
curl -s -u user1@email.com:password1 \
-H "Content-Type: text/markdown" \
-d "sample markdown fragment" -X POST localhost:8080/v1/fragments | jq
```

**POST (txt)**

```bash
curl -s -u user1@email.com:password1 \
-H "Content-Type: text/plain" \
-d "sample text fragment" -X POST localhost:8080/v1/fragments | jq
```

**POST (JSON)**

```bash
curl -s -u user1@email.com:password1 \
-H "Content-Type: application/json" \
-d "{"coffee": "macchiato"}" -X POST localhost:8080/v1/fragments | jq
```

**PUT**

```bash
curl -i \
  -X PUT \
  -u user1@email.com:password1 \
  -H "Content-Type: text/plain" \
  -d "This is updated data" \
 "http://localhost:8080/v1/fragments?expand=1/4dcc65b6-9d57-453a-bd3a-63c107a51698"
```

**EXPAND**

```bash
curl -s -u user1@email.com:password1 \
"http://localhost:8080/v1/fragments?expand=1" | jq
```

**INFO**

```bash
curl -s -u user1@email.com:password1 \
"http://localhost:8080/v1/fragments/aabce737-9e66-445d-9be3-51d38304ccf1/info" | jq
```

**DELETE**

```bash
curl -i -X DELETE -u user1@email.com:password1 \
"localhost:8080/v1/fragments/6d3dc284-309f-487a-a544-7d30cf2f1a07"
```

## Notes

### ◎ ESLint

If you have issues with process.env, add node:true to the env section of your .eslintrc file. Eslint needs to know if you are using node variables like `process`.

### ◎ node-inspector

To debug Node, `--inspect` lets you listen for debugging client.
Before running, first make sure you have launch.json. Also ensure you have toggled attach to process in the debugger. If not, do this by `cmd + shift + p` and search for `attach to process` and select smart option. [References](https://code.visualstudio.com/docs/nodejs/nodejs-debugging)

### ◎ Curl

You can use this command in terminal to test the service. Make sure you pipe it with `jq` when required this will make it more readable.

```sh
curl localhost:8080 | jq
curl -i localhost:8080 # to get the response headers
```

### ◎ Pino-colada

If you want to use simpler than the default (Pino) logger you can use the following minimalistic logger (pino-colada).

1. Comment out the `logger` in `src/logger.js`
2. Add the following script to your package.json

```json
"dev": "LOG_LEVEL=debug nodemon ./src/server.js --watch src | pino-colada"
```
