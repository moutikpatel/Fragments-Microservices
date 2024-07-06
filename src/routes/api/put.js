const { createSuccessResponse, createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

module.exports = async (req, res) => {
  try {
    const fragment = await Fragment.byId(req.user, req.params.id);

    // If fragment content type is trying to be converted
    // 400 Bad Request
    if (req.get('Content-Type') !== fragment.type) {
      logger.error('Bad Request');
      return res.status(400).json(createErrorResponse(400, 'Bad Request'));
    }

    await fragment.setData(req.body);
    await fragment.save();
    /* 
    add a toJSON() method to an object, which returns the Object to serialize, and you can strip things out that you don't want
    */
    fragment.toJSON = () => {
      return {
        id: fragment.id,
        created: fragment.created,
        updated: fragment.updated,
        size: fragment.size,
        type: fragment.type,
        formats: fragment.formats,
      };
    };

    res.status(200).json(createSuccessResponse({ fragment: fragment }));
  } catch (err) {
    logger.error({ err }, 'Error getting fragment by id');

    res.status(404).json(createErrorResponse(404, 'Error getting fragment information'));
  }
};
