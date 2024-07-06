// src/routes/api/index.js

/**
 * The main entry-point for the v1 version of the fragments API.
 */
const express = require('express');

// Create a router on which to mount our API endpoints
const router = express.Router();
const contentType = require('content-type');
const { Fragment } = require('../../model/fragment');

const rawBody = () =>
  // raw binary body parser
  express.raw({
    inflate: true,
    limit: '5mb',
    type: (req) => {
      const { type } = contentType.parse(req);
      return Fragment.isSupportedType(type);
    },
  });

// == GET == /v1/fragments
router.get('/fragments', require('./get'));
router.get('/fragments/:id', require('./get-id'));
router.get('/fragments/:id/info', require('./get-id-info'));

// == POST == /v1/fragments
// Use a raw body parser for POST, which will give a `Buffer` Object or `{}` at `req.body`
router.post('/fragments', rawBody(), require('./post'));

// == PUT == /v1/fragments/:id
router.put('/fragments/:id', rawBody(), require('./put'));

// DELETE /v1/fragments/:id
router.delete('/fragments/:id', require('./delete'));

module.exports = router;
