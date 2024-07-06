// src/app.js

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const logger = require('./logger');
const pino = require('pino-http')({ logger });

const passport = require('passport');
const authentication = require('./authorization/index');
const { createErrorResponse } = require('./response');
const app = express();

// Use logging middleware
app.use(pino);
// Use security middleware
app.use(helmet());
// Use CORS middleware so we can make requests across origins
app.use(cors());
// Use gzip/deflate compression middleware
app.use(compression());
// Set up our passport authentication middleware
passport.use(authentication.strategy());
app.use(passport.initialize());

// Routes
app.use('/', require('./routes'));
// Pass along an error object to the error-handling middleware
app.use((_, res) => {
  res.status(404).json(createErrorResponse(404, 'not found'));
});
// Add error-handling middleware to deal with anything else
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'unable to process request';

  if (status > 499) logger.error({ err }, 'Error processing request');
  res.status(status).json(createErrorResponse(status, message));
});

module.exports = app;
