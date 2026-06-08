const IMAGE_SIGNATURES: Array<(buffer: Buffer) => boolean> = [
  (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  (b) => b.length >= 4 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  (b) =>
    b.length >= 6 &&
    (b.toString('ascii', 0, 6) === 'GIF87a' || b.toString('ascii', 0, 6) === 'GIF89a'),
  (b) =>
    b.length >= 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP',
];

export function isAllowedImageBuffer(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;
  return IMAGE_SIGNATURES.some((check) => check(buffer));
}
