// src/routes/index.js

const express = require('express');

// version and author from package.json
const { version, author, githubUrl } = require('../../package.json');
const { hostname } = require('os');

// Create a router that we can use to mount our API
const router = express.Router();
const { authenticate } = require('../authorization/index');
const { createSuccessResponse } = require('../response');
/**
 * Expose all of our API routes on /v1/* to include an API version.
 * Protect them all so you have to be authenticated in order to access.
 */
router.use('/v1', authenticate(), require('./api'));
/**
 * Define a simple health check route. If the server is running
 * we'll respond with a 200 OK.  If not, the server isn't healthy.
 */
router.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.status(200).json(
    createSuccessResponse({
      author,
      githubUrl,
      version,
      // Include the hostname in the response
      hostname: hostname(),
    })
  );
});

module.exports = router;
