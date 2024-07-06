const { createSuccessResponse, createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

module.exports = async (req, res) => {
  logger.debug('GET request', JSON.stringify(req.query));

  try {
    const fragments = await Fragment.byUser(req.user, req.query.expand);
    res.status(200).json(createSuccessResponse({ fragments }));
    logger.debug('Fragment data: ' + JSON.stringify(fragments, null, 2));
  } catch (error) {
    res.status(404).json(createErrorResponse(404, error.message));
    logger.error('Fragment not found: ' + error);
  }
};
