// Use crypto.randomUUID() to create unique IDs, see:
// https://nodejs.org/api/crypto.html#cryptorandomuuidoptions
const { randomUUID } = require('crypto');
// Use https://www.npmjs.com/package/content-type to create/parse Content-Type headers
const contentType = require('content-type');
const sharp = require('sharp');

const md = require('markdown-it')({
  html: true,
  linkify: true,
  typographer: true,
});

// Functions for working with fragment metadata/data using our DB
const {
  readFragment,
  writeFragment,
  readFragmentData,
  writeFragmentData,
  listFragments,
  deleteFragment,
} = require('./data');

const validTypes = [
  'text/plain',
  'text/markdown',
  'text/html',
  'application/json',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
];

class Fragment {
  constructor({ id, ownerId, type, created, updated, size = 0 }) {
    if (!ownerId || !type) throw new Error('ownerId and/or type missing');
    if (typeof size !== 'number') throw new Error(`Fragment size must be a number (got ${size})`);
    else if (size < 0) throw new Error(`Fragment size must be a positive number (got: ${size})`);
    else if (!validTypes.some((validType) => type.includes(validType)))
      throw new Error('type not supported');

    this.id = id || randomUUID();
    this.ownerId = ownerId;
    this.created = created || new Date().toISOString();
    this.updated = updated || new Date().toISOString();
    this.type = type;
    this.size = size;
  }

  /**
   * Get all fragments (id or full) for the given user
   * @param {string} ownerId user's hashed email
   * @param {boolean} expand whether to expand ids to full fragments
   * @returns Promise<Array<Fragment>>
   */
  static async byUser(ownerId, expand = false) {
    const results = await listFragments(ownerId, expand);
    if (expand) {
      return results.map((fragment) => new Fragment(fragment));
    }
    return results;
  }

  /**
   * Gets a fragment for the user by the given id.
   * @param {string} ownerId user's hashed email
   * @param {string} id fragment's id
   * @returns Promise<Fragment>
   */
  static async byId(ownerId, id) {
    const fragment = await readFragment(ownerId, id);
    if (fragment) return new Fragment(fragment);
    throw new Error(`Fragment ${id} not found`);
  }

  /**
   * Delete the user's fragment data and metadata for the given id
   * @param {string} ownerId user's hashed email
   * @param {string} id fragment's id
   * @returns Promise
   */
  static async delete(ownerId, id) {
    return await deleteFragment(ownerId, id);
  }

  /**
   * Saves the current fragment to the database
   * @returns Promise
   */
  async save() {
    this.updated = new Date().toISOString();
    return await writeFragment(this);
  }

  /**
   * Gets the fragment's data from the database
   * @returns Promise<Buffer>
   */
  async getData() {
    return await readFragmentData(this.ownerId, this.id);
  }

  /**
   * Set's the fragment's data in the database
   * @param {Buffer} data
   * @returns Promise
   */
  async setData(data) {
    // if (!data) {
    //   throw new Error('Data is missing');
    // }
    // this.size = Buffer.byteLength(data);
    // await this.save();
    // return writeFragmentData(this.ownerId, this.id, data);
    if (!Buffer.isBuffer(data)) {
      throw new Error('data is not a Buffer');
    } else {
      this.size = Buffer.byteLength(data);
      this.save();
      return await writeFragmentData(this.ownerId, this.id, data);
    }
  }

  /**
   * Returns the mime type (e.g., without encoding) for the fragment's type:
   * "text/html; charset=utf-8" -> "text/html"
   * @returns {string} fragment's mime type (without encoding)
   */
  get mimeType() {
    const { type } = contentType.parse(this.type);
    return type;
  }

  /**
   * Returns true if this fragment is a text/* mime type
   * @returns {boolean} true if fragment's type is text/*
   */
  get isText() {
    return this.mimeType.startsWith('text/') ? true : false;
  }

  get formats() {
    const mimeTypes = {
      'text/plain': ['text/plain'],
      'text/markdown': ['text/markdown', 'text/html', 'text/plain'],
      'text/html': ['text/html', 'text/plain'],
      'application/json': ['application/json', 'text/plain'],
      'image/png': ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
      'image/jpeg': ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
      'image/webp': ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
      'image/gif': ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
    };

    let supportedFormats;
    switch (this.mimeType) {
      case 'text/plain':
        supportedFormats = mimeTypes['text/plain'];
        break;
      case 'text/markdown':
        supportedFormats = mimeTypes['text/markdown'];
        break;
      case 'text/html':
        supportedFormats = mimeTypes['text/html'];
        break;
      case 'application/json':
        supportedFormats = mimeTypes['application/json'];
        break;
      case 'image/png':
        supportedFormats = mimeTypes['image/png'];
        break;
      case 'image/jpeg':
        supportedFormats = mimeTypes['image/jpeg'];
        break;
      case 'image/webp':
        supportedFormats = mimeTypes['image/webp'];
        break;
      case 'image/gif':
        supportedFormats = mimeTypes['image/gif'];
        break;
    }
    return supportedFormats;
  }

  get getValidExts() {
    let validExts;
    if (this.mimeType === 'text/plain') validExts = ['.txt'];
    if (this.mimeType === 'text/markdown') validExts = ['.md', '.html', '.txt'];
    if (this.mimeType === 'text/html') validExts = ['.html', '.txt'];
    if (this.mimeType === 'application/json') validExts = ['.json', '.txt'];
    if (this.mimeType.startsWith('image/')) validExts = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
    return validExts;
  }

  /**
   * Returns true if we know how to work with this content type
   * @param {string} value a Content-Type value (e.g., 'text/plain' or 'text/plain: charset=utf-8')
   * @returns {boolean} true if we support this Content-Type (i.e., type/subtype)
   */
  static isSupportedType(value) {
    const { type } = contentType.parse(value);
    return validTypes.includes(type);
  }

  async convertor(extension) {
    let mimeType, convertedData;
    // ============ convert to TXT ============
    if (this.mimeType === 'text/markdown') {
      if (extension === '.html') {
        const rawData = await this.getData();
        convertedData = md.render(rawData.toString());
        mimeType = 'text/html';
      } else if (extension === '.txt') {
        convertedData = (await this.getData()).toString();
        mimeType = 'text/plain';
      } else if (extension === '.md') {
        convertedData = (await this.getData()).toString();
        mimeType = 'text/markdown';
      }
    }
    if (this.mimeType === 'text/html') {
      if (extension === '.txt') {
        convertedData = (await this.getData()).toString();
        mimeType = 'text/plain';
      } else if (extension === '.html') {
        convertedData = (await this.getData()).toString();
        mimeType = 'text/html';
      }
    }
    if (this.mimeType === 'text/plain') {
      if (extension === '.txt') {
        convertedData = (await this.getData()).toString();
        mimeType = 'text/plain';
      }
    }
    // // ============ convert to JSON ============
    if (this.mimeType === 'application/json') {
      if (extension === '.txt') {
        convertedData = (await this.getData()).toString();
        mimeType = 'text/plain';
      } else if (extension === '.json') {
        convertedData = (await this.getData()).toString();
        mimeType = 'application/json';
      }
    }

    // ============ convert to PNG ============
    if (this.mimeType === 'image/png') {
      // use sharp to convert to other formats
      if (extension === '.png') {
        const rawData = await this.getData();
        convertedData = await sharp(rawData).toFormat('png').toBuffer();
        mimeType = 'image/png';
      } else if (extension === '.jpg' || extension === '.jpeg') {
        const rawData = await this.getData();
        convertedData = await sharp(rawData).toFormat('jpeg').toBuffer();
        mimeType = 'image/jpeg';
      } else if (extension === '.webp') {
        const rawData = await this.getData();
        convertedData = await sharp(rawData).toFormat('webp').toBuffer();
        mimeType = 'image/webp';
      } else if (extension === '.gif') {
        const rawData = await this.getData();
        convertedData = await sharp(rawData).toFormat('gif').toBuffer();
        mimeType = 'image/gif';
      }
    }

    // ============ convert to JPG ============
    if (this.mimeType === 'image/jpeg') {
      if (extension === '.jpg' || extension === '.jpeg') {
        const rawData = await this.getData();
        convertedData = await sharp(rawData).toFormat('jpeg').toBuffer();
        mimeType = 'image/jpeg';
      } else if (extension === '.png') {
        const rawData = await this.getData();
        convertedData = await sharp(rawData).toFormat('png').toBuffer();
        mimeType = 'image/png';
      } else if (extension === '.webp') {
        const rawData = await this.getData();
        convertedData = await sharp(rawData).toFormat('webp').toBuffer();
        mimeType = 'image/webp';
      } else if (extension === '.gif') {
        const rawData = await this.getData();
        convertedData = await sharp(rawData).toFormat('gif').toBuffer();
        mimeType = 'image/gif';
      }
    }

    // ============ convert to WEBP ============
    if (this.mimeType === 'image/webp') {
      if (extension === '.webp') {
        const rawData = await this.getData();
        convertedData = await sharp(rawData).toFormat('webp').toBuffer();
        mimeType = 'image/webp';
      } else if (extension === '.png') {
        const rawData = await this.getData();
        convertedData = await sharp(rawData).toFormat('png').toBuffer();
        mimeType = 'image/png';
      } else if (extension === '.jpg' || extension === '.jpeg') {
        const rawData = await this.getData();
        convertedData = await sharp(rawData).toFormat('jpeg').toBuffer();
        mimeType = 'image/jpeg';
      } else if (extension === '.gif') {
        const rawData = await this.getData();
        convertedData = await sharp(rawData).toFormat('gif').toBuffer();
        mimeType = 'image/gif';
      }
    }

    // ============ convert to GIF ============
    if (this.mimeType === 'image/gif') {
      if (extension === '.gif') {
        const rawData = await this.getData();
        convertedData = await sharp(rawData).toFormat('gif').toBuffer();
        mimeType = 'image/gif';
      } else if (extension === '.png') {
        const rawData = await this.getData();
        convertedData = await sharp(rawData).toFormat('png').toBuffer();
        mimeType = 'image/png';
      } else if (extension === '.jpg' || extension === '.jpeg') {
        const rawData = await this.getData();
        convertedData = await sharp(rawData).toFormat('jpeg').toBuffer();
        mimeType = 'image/jpeg';
      } else if (extension === '.webp') {
        const rawData = await this.getData();
        convertedData = await sharp(rawData).toFormat('webp').toBuffer();
        mimeType = 'image/webp';
      }
    }
    // use .replace(/(\r?\n)?$/, '') to remove trailing newline
    //convertedData = convertedData.replace(/(\r?\n)?$/, '');
    return { convertedData, mimeType };
  }
}

module.exports.Fragment = Fragment;
