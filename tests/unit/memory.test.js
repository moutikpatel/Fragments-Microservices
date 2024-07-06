// /* tests fir memory.js file */
const appDB = require('../../src/model/data/memory/index');

describe('fragment data and metadata calls', () => {
  const data = { ownerId: '1', id: '7', value: Buffer.from('filetxt') }; // fragments metadata
  const metadata = { ownerId: '1', id: '7', fragment: 'f1' };

  //== metadata
  test('writeFragment() returns nothing', async () => {
    const emptyMetadata = { ownerId: '', id: '', fragment: {} };
    const result = await appDB.writeFragment(emptyMetadata);
    expect(result).toBe(undefined);
  });
  //==

  //== metadata
  test('readFragment() returns same fragment from writeFragment()', async () => {
    await appDB.writeFragment(metadata);
    const result = await appDB.readFragment(metadata.ownerId, metadata.id);
    expect(result).toEqual(metadata);
  });
  //==

  //== write Buffer - works with binary
  test('writeFragmentData() returns nothing if buffer is empty', async () => {
    const result = await appDB.writeFragmentData(data.ownerId, data.id, Buffer.from('', 'utf8'));
    expect(result).toBe(undefined);
  });
  //==

  //== read Buffer - works with binary
  test('readFragmentData() returns what writeFragmentData() does', async () => {
    //binary data
    await appDB.writeFragmentData(data.ownerId, data.id, Buffer.from('filetxt'));
    const binaryResults = await appDB.readFragmentData(data.ownerId, data.id);
    expect(binaryResults).toEqual(Buffer.from('filetxt', 'utf8')); // check if binary data is correct for filetxt
  });
  //==

  //== listFragments
  test('listFragments() always return array, even if empty', async () => {
    const results = await appDB.listFragments('not eleven', false);
    expect(Array.isArray(results)).toBe(true);
    expect(results).toEqual([]);
  });

  test('listFragments() - map fragments to return ids only - outside branch', async () => {
    await appDB.writeFragment(metadata);
    const metaResults = await appDB.listFragments('1', false); // return only ids
    expect(metaResults).toEqual([metadata.id]); // check objects metadata
  });

  test('listFragments() returns accurate metadata if ownerId is accurate', async () => {
    const metaResults = await appDB.listFragments(metadata.ownerId, true); // return the entire object
    expect(metaResults).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fragment: metadata.fragment,
          id: metadata.id,
          ownerId: metadata.ownerId,
        }),
      ])
    );
  });
  //==

  //== deleteFragment()
  test('deleteFragment() deletes metadata and buffer from db', async () => {
    await appDB.writeFragment(metadata); // write metadata
    expect(await appDB.readFragment(metadata.ownerId, metadata.id)).toEqual({
      fragment: metadata.fragment,
      id: metadata.id,
      ownerId: metadata.ownerId,
    }); // read the metadata

    await appDB.writeFragmentData(data.ownerId, data.id, Buffer.from('filetxt')); // write buffer
    expect(await appDB.readFragmentData(data.ownerId, data.id)).toEqual(
      Buffer.from('filetxt', 'utf8')
    ); // read the buffer

    await appDB.deleteFragment(metadata.ownerId, metadata.id);

    expect(await appDB.readFragment(metadata.ownerId, metadata.id)).toEqual(undefined); // check if metadata is deleted
    expect(await appDB.readFragmentData(data.ownerId, data.id)).toEqual(undefined); // check if buffer is deleted
  });
  //==

  test('deleteFragment() returns nothing if ownerId/id is wrong', async () => {
    expect(() => appDB.deleteFragment('not ownerId', metadata.id)).rejects.toThrow();
    expect(() => appDB.deleteFragment(metadata.ownerId, 'not id')).rejects.toThrow();
  });
});
