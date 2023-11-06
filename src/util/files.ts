
import { Stats } from 'fs';
import { stat } from 'fs/promises';

import { isObject } from './validate-primitives';

export async function checkFile(filePath: string): Promise<boolean> {
  let stats: Stats;
  try {
    stats = await stat(filePath);
  } catch(e) {
    if(
      isObject(e)
      && (e?.code === 'ENOENT')
    ) {
      return false;
    }
    throw e;
  }
  return stats.isFile();
}
