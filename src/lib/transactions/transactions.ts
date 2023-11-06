
import path from 'path';
import { Dirent } from 'fs';
import { readdir } from 'fs/promises';

import { DATA_DIR_PATH } from '../../constants';

import { CsvReader, getCsvReader } from '../csv/parse-csv';
import { isString, isStringArray } from '../../util/validate-primitives';

export async function transactions() {
  let dataFilePaths: string[];
  
  dataFilePaths = await getDataFiles();
  for(let i = 0; i < dataFilePaths.length; ++i) {
    let currDataFilePath: string;
    currDataFilePath = dataFilePaths[i];
    await parseCsvDataFile(currDataFilePath);
  }
}

async function parseCsvDataFile(filePath: string) {
  let csvReader: CsvReader;
  let rawRecord: unknown;
  let recordIdx: number;
  let headers: string[] | undefined;
  
  let maxSizes: Record<number, number>;
  maxSizes = {};

  console.log(`Parsing csv data file: ${filePath}`);
  csvReader = getCsvReader(filePath);
  recordIdx = 0;
  while((rawRecord = await csvReader.read()) !== null) {
    let currRecord: unknown[];
    if(!Array.isArray(rawRecord)) {
      console.error(rawRecord);
      throw new Error(`Encountered record that isn't array type, found type: ${typeof rawRecord}`);
    }
    currRecord = rawRecord;
    if(recordIdx++ === 0) {
      if(!isStringArray(currRecord)) {
        console.error(rawRecord);
        throw new Error(`Encountered record that isn't array type, found type: ${typeof rawRecord}`);
      }
      headers = currRecord;
    } else {
      // parse the record
      for(let i = 0; i < currRecord.length; ++i) {
        let rawCell: unknown;
        let currCell: string;
        rawCell = currRecord[i];
        if(!isString(rawCell)) {
          console.error(rawCell);
          throw new Error(`Unexpected cell type in row #${recordIdx}, expected 'string' but received: ${typeof rawCell}`);
        }
        currCell = rawCell;
        if(maxSizes[i] === undefined) {
          maxSizes[i] = -Infinity;
        }
        if(currCell.length > maxSizes[i]) {
          maxSizes[i] = currCell.length;
        }
      }
      // console.log(currRecord);
    }
  }
  console.log('headers');
  console.log(headers);
  console.log({ maxSizes });
}

async function getDataFiles(): Promise<string[]> {
  let dirents: Dirent[];
  let filePaths: string[];
  /*
    For now, just parse the csv files in the first level ./data/ directory
  */
  dirents = await readdir(DATA_DIR_PATH, {
    withFileTypes: true,
  });
  filePaths = dirents.map(dirent => {
    return `${dirent.path}${path.sep}${dirent.name}`;
  });
  return filePaths;
}
