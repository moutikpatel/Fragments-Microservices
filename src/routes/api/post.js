const { createSuccessResponse, createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');
const API_URL = process.env.API_URL || 'http://localhost:8080';

module.exports = async (req, res) => {
  logger.info('Data: ' + req.body);

  if (!Buffer.isBuffer(req.body)) {
    logger.warn('Unsupported Content-Type');
    return res.status(415).json(createErrorResponse(415, 'Unsupported Content-Type'));
  }

  try {
    const fragment = new Fragment({
      ownerId: req.user,
      type: req.get('Content-Type'),
      size: Buffer.byteLength(req.body),
    });
    await fragment.save();
    await fragment.setData(req.body);
    //logger.info('Fragment saved' + fragment);

    res.set('Location', `${API_URL}/v1/fragments/${fragment.id}`);

    res.status(201).json(
      createSuccessResponse({
        fragment: fragment,
      })
    );
  } catch (error) {
    logger.error(error);
    return res.status(500).json(createErrorResponse(500, 'Internal Server Error'));
  }
};
