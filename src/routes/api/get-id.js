const path = require('path');
const logger = require('../../logger');
const { Fragment } = require('../../model/fragment');
const { createErrorResponse } = require('../../response');

module.exports = async (req, res) => {
  const ext = path.extname(req.params.id);
  const id = path.basename(req.params.id, ext);

  try {
    const fragment = await Fragment.byId(req.user, id);
    const fragmentRawData = await fragment.getData();

    logger.debug({ fragment }, `User's ${req.user} Fragment`);

    if (ext) {
      // => with extension
      // Extension is present, so we need to return the fragment's content
      logger.debug(`Supported Media Type => ${ext} Converting...`);
      const { convertedData, mimeType } = await fragment.convertor(ext);

      if (!fragment.getValidExts.includes(ext) || !convertedData) {
        logger.error(
          `Abort - Unsupported Media Type => ${ext} can't convert to ${mimeType} and convertedData is ${convertedData} `
        );
        return res.status(415).json(createErrorResponse(415, 'Unsupported Media Type'));
      }
      //logger.debug(createSuccessResponse({ data: convertedData, mimeType }));
      // response with the converted data
      //res.set('Content-Type', mimeType);
      res.type(mimeType);
      res.setHeader('content-length', fragment.size);
      return res.status(200).send(convertedData);
      // => RAW DATA
    } else if (ext === '') {
      res.setHeader('content-length', fragment.size);
      res.set('Content-Type', fragment.type);

      return res.status(200).send(fragmentRawData);
    }
    // potential errors
  } catch (e) {
    logger.error(`${e.message} : Not found => ID: ${id} , ext: ${ext}`);
    return res.status(404).json(createErrorResponse(404, 'Not found'));
  }
};
