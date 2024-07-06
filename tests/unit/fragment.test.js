const { Fragment } = require('../../src/model/fragment');
const fs = require('fs');
const path = require('path');
// Wait for a certain number of ms. Returns a Promise.
const wait = async (ms = 10) => new Promise((resolve) => setTimeout(resolve, ms));

const validTypes = ['text/plain', 'text/markdown', 'text/html', 'application/json'];

describe('Fragment class', () => {
  test('common formats are supported', () => {
    validTypes.forEach((format) => expect(Fragment.isSupportedType(format)).toBe(true));
  });

  describe('Fragment()', () => {
    test('ownerId and type are required', () => {
      expect(() => new Fragment({})).toThrow();
    });

    test('ownerId is required', () => {
      expect(() => new Fragment({ type: 'text/plain', size: 1 })).toThrow();
    });

    test('type is required', () => {
      expect(() => new Fragment({ ownerId: '1234', size: 1 })).toThrow();
    });

    test('type can be a simple media type', () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 7 });
      expect(fragment.type).toEqual('text/plain');
    });

    test('type can include a charset', () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/plain; charset=utf-8',
        size: 0,
      });
      expect(fragment.type).toEqual('text/plain; charset=utf-8');
    });

    test('size gets set to 0 if missing', () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain' });
      expect(fragment.size).toBe(0);
    });

    test('size must be a number', () => {
      expect(() => new Fragment({ ownerId: '1234', type: 'text/plain', size: '1' })).toThrow();
    });

    test('size can be 0', () => {
      expect(() => new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 })).not.toThrow();
    });

    test('size cannot be negative', () => {
      expect(() => new Fragment({ ownerId: '1234', type: 'text/plain', size: -1 })).toThrow();
    });

    test('invalid types throw', () => {
      expect(
        () => new Fragment({ ownerId: '1234', type: 'application/msword', size: 1 })
      ).toThrow();
    });

    test('valid types can be set', () => {
      validTypes.forEach((format) => {
        const fragment = new Fragment({ ownerId: '1234', type: format, size: 1 });
        expect(fragment.type).toEqual(format);
      });
    });

    test('fragments have an id', () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 1 });
      expect(fragment.id).toMatch(
        /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/
      );
    });

    test('fragments use id passed in if present', () => {
      const fragment = new Fragment({
        id: 'id',
        ownerId: '1234',
        type: 'text/plain',
        size: 1,
      });
      expect(fragment.id).toEqual('id');
    });

    test('fragments get a created datetime string', () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/plain',
        size: 1,
      });
      expect(Date.parse(fragment.created)).not.toBeNaN();
    });

    test('fragments get an updated datetime string', () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/plain',
        size: 1,
      });
      expect(Date.parse(fragment.updated)).not.toBeNaN();
    });
  });

  describe('isSupportedType()', () => {
    test('common text types are supported, with and without charset', () => {
      expect(Fragment.isSupportedType('text/plain')).toBe(true);
      expect(Fragment.isSupportedType('text/plain')).toBe(true);
    });

    test('other types are not supported', () => {
      expect(Fragment.isSupportedType('application/octet-stream')).toBe(false);
      expect(Fragment.isSupportedType('application/msword')).toBe(false);
      expect(Fragment.isSupportedType('audio/webm')).toBe(false);
      expect(Fragment.isSupportedType('video/ogg')).toBe(false);
    });
  });

  describe('mimeType, isText', () => {
    test('mimeType returns the mime type without charset', () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/plain; charset=utf-8',
        size: 0,
      });
      expect(fragment.mimeType).toEqual('text/plain');
    });

    test('mimeType returns the mime type if charset is missing', () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 });
      expect(fragment.type).toEqual('text/plain');
      expect(fragment.mimeType).toEqual('text/plain');
    });

    test('isText return expected results', () => {
      // Text fragment
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/plain; charset=utf-8',
        size: 0,
      });
      expect(fragment.isText).toBe(true);

      const fragment2 = new Fragment({
        ownerId: '1234',
        type: 'application/json',
        size: 0,
      });
      expect(fragment2.isText).toBe(false);
    });
  });

  describe('save(), getData(), setData(), byId(), byUser(), delete()', () => {
    test('byUser() returns an empty array if there are no fragments for this user', async () => {
      expect(await Fragment.byUser('1234')).toEqual([]);
    });

    test('a fragment can be created and save() stores a fragment for the user', async () => {
      const data = Buffer.from('hello');
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 });
      await fragment.save();
      await fragment.setData(data);

      const fragment2 = await Fragment.byId('1234', fragment.id);
      expect(fragment2).toEqual(fragment);
      expect(await fragment2.getData()).toEqual(data);
    });

    test('save() updates the updated date/time of a fragment', async () => {
      const ownerId = '7777';
      const fragment = new Fragment({ ownerId, type: 'text/plain', size: 0 });
      const modified1 = fragment.updated;
      await wait();
      await fragment.save();
      const fragment2 = await Fragment.byId(ownerId, fragment.id);
      expect(Date.parse(fragment2.updated)).toBeGreaterThan(Date.parse(modified1));
    });

    test('setData() updates the updated date/time of a fragment', async () => {
      const data = Buffer.from('hello');
      const ownerId = '7777';
      const fragment = new Fragment({ ownerId, type: 'text/plain', size: 0 });
      await fragment.save();
      const modified1 = fragment.updated;
      await wait();
      await fragment.setData(data);
      await wait();
      const fragment2 = await Fragment.byId(ownerId, fragment.id);
      expect(Date.parse(fragment2.updated)).toBeGreaterThan(Date.parse(modified1));
    });

    test('a fragment is added to the list of a users fragments', async () => {
      const data = Buffer.from('hello');
      const ownerId = '5555';
      const fragment = new Fragment({ ownerId, type: 'text/plain', size: 0 });
      await fragment.save();
      await fragment.setData(data);

      expect(await Fragment.byUser(ownerId)).toEqual([fragment.id]);
    });

    test('full fragments are returned when requested for a user', async () => {
      const data = Buffer.from('hello');
      const ownerId = '6666';
      const fragment = new Fragment({ ownerId, type: 'text/plain', size: 0 });
      await fragment.save();
      await fragment.setData(data);

      expect(await Fragment.byUser(ownerId, true)).toEqual([fragment]);
    });

    test('setData() throws if not give a Buffer', () => {
      const fragment = new Fragment({ ownerId: '123', type: 'text/plain', size: 0 });
      expect(() => fragment.setData()).rejects.toThrow();
    });

    test('setData() updates the fragment size', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 });
      await fragment.save();
      await fragment.setData(Buffer.from('a'));
      expect(fragment.size).toBe(1);

      await fragment.setData(Buffer.from('aa'));
      const { size } = await Fragment.byId('1234', fragment.id);
      expect(size).toBe(2);
    });

    test('a fragment can be deleted', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 });
      await fragment.save();
      await fragment.setData(Buffer.from('a'));

      await Fragment.delete('1234', fragment.id);
      expect(() => Fragment.byId('1234', fragment.id)).rejects.toThrow();
    });
  });

  describe('getValidExts returns the corresponding extensions', () => {
    test('getValidExts returns the corresponding extensions', () => {
      const validExts = {
        'text/plain': ['.txt'],
        'text/markdown': ['.md', '.html', '.txt'],
        'text/html': ['.html', '.txt'],
        'application/json': ['.json', '.txt'],
        'image/png': ['.png', '.jpg', '.jpeg', '.webp', '.gif'],
        'image/jpeg': ['.png', '.jpg', '.jpeg', '.webp', '.gif'],
        'image/webp': ['.png', '.jpg', '.jpeg', '.webp', '.gif'],
        'image/gif': ['.png', '.jpg', '.jpeg', '.webp', '.gif'],
      };
      Object.keys(validExts).forEach((type) => {
        expect(new Fragment({ ownerId: '1234', type, size: 0 }).getValidExts).toEqual(
          validExts[type]
        );
      });
    });
  });

  describe('convertor()', () => {
    test('converts markdown to html', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/markdown', size: 0 });
      await fragment.save();
      await fragment.setData(Buffer.from('# hello'));
      const { convertedData, mimeType } = await fragment.convertor('.html');
      expect(convertedData).toBe('<h1>hello</h1>\n');
      expect(mimeType).toBe('text/html');
    });

    test('converts markdown to markdown', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/markdown', size: 0 });
      await fragment.save();
      await fragment.setData(Buffer.from('# hello'));
      const { convertedData, mimeType } = await fragment.convertor('.md');
      expect(convertedData).toBe('# hello');
      expect(mimeType).toBe('text/markdown');
    });

    test('converts markdown to txt', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/markdown', size: 0 });
      await fragment.save();
      await fragment.setData(Buffer.from('# hello'));
      const { convertedData, mimeType } = await fragment.convertor('.txt');
      expect(convertedData).toBe('# hello');
      expect(mimeType).toBe('text/plain');
    });

    // MD to MD
    test('converts markdown to markdown', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/markdown', size: 0 });
      await fragment.save();
      await fragment.setData(Buffer.from('# hello'));
      const { convertedData, mimeType } = await fragment.convertor('.md');
      expect(convertedData).toBe('# hello');
      expect(mimeType).toBe('text/markdown');
    });

    // md to text/markdown
    test('converts markdown to markdown', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/markdown', size: 0 });
      await fragment.save();
      await fragment.setData(Buffer.from('# hello'));
      const { convertedData, mimeType } = await fragment.convertor('.md');
      expect(convertedData).toBe('# hello');

      expect(mimeType).toBe('text/markdown');
    });

    test('converts html to txt', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/html', size: 0 });
      await fragment.save();
      await fragment.setData(Buffer.from('<h1>hello</h1>'));
      const { convertedData, mimeType } = await fragment.convertor('.txt');
      expect(convertedData).toBe('<h1>hello</h1>');
      expect(mimeType).toBe('text/plain');
    });

    test('converts html to html', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/html', size: 0 });
      await fragment.save();
      await fragment.setData(Buffer.from('<h1>hello</h1>'));
      const { convertedData, mimeType } = await fragment.convertor('.html');
      expect(convertedData).toBe('<h1>hello</h1>');
      expect(mimeType).toBe('text/html');
    });

    test('converts json to txt', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'application/json', size: 0 });
      await fragment.save();
      await fragment.setData(Buffer.from('{"hello":"world"}'));
      const { convertedData, mimeType } = await fragment.convertor('.txt');
      expect(convertedData).toBe('{"hello":"world"}');
      expect(mimeType).toBe('text/plain');
    });

    // json to json
    test('converts json to json', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'application/json', size: 0 });
      await fragment.save();
      await fragment.setData(Buffer.from('{"hello":"world"}'));
      const { convertedData, mimeType } = await fragment.convertor('.json');
      expect(convertedData).toBe('{"hello":"world"}');
      expect(mimeType).toBe('application/json');
    });
  });

  describe('formats function properly returns the supported formats for the given mime type', () => {
    test('formats function returns the supported formats for the given mime type', () => {
      expect(new Fragment({ ownerId: '1234', type: 'text/plain', size: 7 }).formats).toEqual([
        'text/plain',
      ]);
      expect(new Fragment({ ownerId: '1234', type: 'text/markdown', size: 7 }).formats).toEqual([
        'text/markdown',
        'text/html',
        'text/plain',
      ]);
      expect(new Fragment({ ownerId: '1234', type: 'text/html', size: 7 }).formats).toEqual([
        'text/html',
        'text/plain',
      ]);
      expect(new Fragment({ ownerId: '1234', type: 'application/json', size: 7 }).formats).toEqual([
        'application/json',
        'text/plain',
      ]);

      const formats = new Fragment({ ownerId: '1234', type: 'image/gif', size: 7 }).formats;
      formats.forEach((format) => {
        expect(new Fragment({ ownerId: '1234', type: format, size: 7 }).formats).toEqual(formats);
      });

      // get the formats for each mime type and then test it
      const formats1 = new Fragment({ ownerId: '1234', type: 'image/webp', size: 7 }).formats;
      formats1.forEach((format) => {
        expect(new Fragment({ ownerId: '1234', type: format, size: 7 }).formats).toEqual(formats1);
      });

      // get the formats for each mime type and then test it
      const formats2 = new Fragment({ ownerId: '1234', type: 'image/jpeg', size: 7 }).formats;
      formats2.forEach((format) => {
        expect(new Fragment({ ownerId: '1234', type: format, size: 7 }).formats).toEqual(formats2);
      });

      // get the formats for each mime type and then test it
      const formats3 = new Fragment({ ownerId: '1234', type: 'image/png', size: 7 }).formats;
      formats3.forEach((format) => {
        expect(new Fragment({ ownerId: '1234', type: format, size: 7 }).formats).toEqual(formats3);
      });
    });
  });

  /* ===== IMAGE CONVERTER TEST ALGORITHM =====  */
  describe('converts image files to other formats', () => {
    const testImageConversion = async (imageFormat, expectedFormat) => {
      const fragment = new Fragment({ ownerId: '1234', type: `image/${imageFormat}`, size: 0 });
      await fragment.setData(
        fs.readFileSync(path.join(__dirname, '..', `img/${imageFormat}File.${imageFormat}`))
      );
      await fragment.save();
      const { mimeType } = await fragment.convertor(`.${expectedFormat}`);
      expect(mimeType).toBe(`image/${expectedFormat}`);
      expect(fragment.data).not.toBeNull();
    };

    const imageFormats = ['gif', 'jpeg', 'png', 'webp'];
    const expectedFormats = ['gif', 'jpeg', 'png', 'webp'];

    imageFormats.forEach((imageFormat) => {
      expectedFormats.forEach((expectedFormat) => {
        test(`converts ${imageFormat} to ${expectedFormat}`, async () => {
          await testImageConversion(imageFormat, expectedFormat);
        });
      });
    });

    test('converts image to image', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'image/gif', size: 0 });
      await fragment.setData(fs.readFileSync(path.join(__dirname, '..', 'img/gifFile.gif')));
      await fragment.save();
      const { mimeType } = await fragment.convertor('.gif');
      expect(mimeType).toBe('image/gif');
      expect(fragment.data).not.toBeNull();
    });
  });
});
