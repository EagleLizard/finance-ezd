import path from 'path';

export const BASE_DIR = path.resolve(__dirname, '..');
console.log({BASE_DIR});

export const DATA_DIRNAME = 'data';
export const DATA_DIR_PATH = [
  BASE_DIR,
  DATA_DIRNAME,
].join(path.sep);
