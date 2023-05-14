export interface PngChunk {
  type: string;
  length: number;
  data: Uint8Array;
  crc: number;
}

export const listPngChunks = (uint8Array: Uint8Array): PngChunk[] => {
  const chunks: PngChunk[] = [];

  // Skip the PNG header (8 bytes)
  let offset = 8;

  // Iterate over the chunks
  while (offset < uint8Array.length) {
    // Read the length and type of the chunk
    const chunkLength = uint8Array[offset] * 0x1000000 +
      uint8Array[offset + 1] * 0x10000 +
      uint8Array[offset + 2] * 0x100 +
      uint8Array[offset + 3];
    const chunkTypeStr = String.fromCharCode(
      uint8Array[offset + 4],
      uint8Array[offset + 5],
      uint8Array[offset + 6],
      uint8Array[offset + 7]);

    // Read the chunk data
    const chunkData = uint8Array.slice(offset + 8, offset + 8 + chunkLength);

    // Read the CRC of the chunk
    const crc = uint8Array[offset + 8 + chunkLength] * 0x1000000 +
      uint8Array[offset + 8 + chunkLength + 1] * 0x10000 +
      uint8Array[offset + 8 + chunkLength + 2] * 0x100 +
      uint8Array[offset + 8 + chunkLength + 3];

    // Add the chunk to the list
    chunks.push({ type: chunkTypeStr, length: chunkLength, data: chunkData, crc });

    // Move to the next chunk
    offset += chunkLength + 12;

    // Check if we've reached the end of the file
    if (offset >= uint8Array.length) {
      break;
    }
  }

  return chunks;
};

export const removePngChunk = (uint8Array: Uint8Array, chunkIndexes: number[]): Uint8Array => {
  const chunks: PngChunk[] = [];
  let chunkIndex = 0;

  // Skip the PNG header (8 bytes)
  let offset = 8;

  // Iterate over the chunks
  while (offset < uint8Array.length) {
    // Read the length and type of the chunk
    const chunkLength = uint8Array[offset] * 0x1000000 +
      uint8Array[offset + 1] * 0x10000 +
      uint8Array[offset + 2] * 0x100 +
      uint8Array[offset + 3];
    const chunkTypeStr = String.fromCharCode(
      uint8Array[offset + 4],
      uint8Array[offset + 5],
      uint8Array[offset + 6],
      uint8Array[offset + 7]);

    // Read the chunk data
    const chunkData = uint8Array.slice(offset + 8, offset + 8 + chunkLength);

    // Read the CRC of the chunk
    const crc = uint8Array[offset + 8 + chunkLength] * 0x1000000 +
      uint8Array[offset + 8 + chunkLength + 1] * 0x10000 +
      uint8Array[offset + 8 + chunkLength + 2] * 0x100 +
      uint8Array[offset + 8 + chunkLength + 3];

    // Check if this is the chunk we want to remove
    if (chunkIndexes.includes(chunkIndex)) {
      // Move to the next chunk
      offset += chunkLength + 12;
      chunkIndex += 1;
      continue;
    }
    
    // Add the chunk to the list
    chunks.push({ type: chunkTypeStr, length: chunkLength, data: chunkData, crc });
    
    // Move to the next chunk
    offset += chunkLength + 12;
    chunkIndex += 1;
    
    // Check if we've reached the end of the file
    if (offset >= uint8Array.length) {
      break;
    }
  }

  // Reassemble the PNG file from the remaining chunks
  const newPng = new Uint8Array(8 + chunks.reduce((sum, chunk) => sum + chunk.length + 12, 0));
  newPng.set(uint8Array.subarray(0, 8), 0);
  let newOffset = 8;
  chunks.forEach(chunk => {
    newPng.set(new Uint8Array([
      (chunk.length >> 24) & 0xff,
      (chunk.length >> 16) & 0xff,
      (chunk.length >> 8) & 0xff,
      chunk.length & 0xff,
      chunk.type.charCodeAt(0),
      chunk.type.charCodeAt(1),
      chunk.type.charCodeAt(2),
      chunk.type.charCodeAt(3),
    ]), newOffset);
    newPng.set(chunk.data, newOffset + 8);
    newPng.set(new Uint8Array([
      (chunk.crc >> 24) & 0xff,
      (chunk.crc >> 16) & 0xff,
      (chunk.crc >> 8) & 0xff,
      chunk.crc & 0xff,
    ]), newOffset + 8 + chunk.length);
    newOffset += chunk.length + 12;
  });

  return newPng;
};

export const arrayBufferToBase64 = (byteArray: Uint8Array) => {
  let binary = '';
	const len = byteArray.byteLength;
	for (let i = 0; i < len; i++) {
		binary += String.fromCharCode(byteArray[i]);
	}
	return btoa(binary);
};
