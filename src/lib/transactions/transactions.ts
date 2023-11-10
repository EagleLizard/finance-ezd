
import path from 'path';
import { Dirent } from 'fs';
import { readdir } from 'fs/promises';

import { DATA_DIR_PATH } from '../../constants';

import { parseCsv } from '../csv/parse-csv';
import { isStringArray } from '../../util/validate-primitives';
import {
  MINT_TRANSACTION_HEADERS,
  MINT_TRANSACTION_HEADERS_ENUM,
  MintTransaction,
} from '../../models/mint-transaction';
import { Timer } from '../../util/timer';
import { getIntuitiveTimeString } from '../../util/print-util';

export async function transactions() {
  let dataFilePaths: string[];
  let recordCount: number;
  let headers: MINT_TRANSACTION_HEADERS_ENUM[] | undefined;
  recordCount = 0;

  dataFilePaths = await getDataFiles();
  dataFilePaths = dataFilePaths.filter(dataFilePath => {
    return path.extname(dataFilePath) === '.csv';
  });

  const recordCb = (rawRecord: unknown, recordIdx: number) => {
    let currRecord: string[];
    let mintTxn: MintTransaction;
    if(recordIdx === 0) {
      if(!validateMintHeaders(rawRecord)) {
        console.error(rawRecord);
        throw new Error('Invalid CSV transaction headers');
      }
      headers = rawRecord;
      return; // continue
    }
    recordCount++;
    if(!isStringArray(rawRecord)) {
      console.error(rawRecord);
      throw new Error(`Encountered record that isn't string[] type, found type: ${typeof rawRecord}`);
    }
    currRecord = rawRecord;
    mintTxn = MintTransaction.deserialize(currRecord);
  };

  for(let i = 0; i < dataFilePaths.length; ++i) {
    let currDataFilePath: string;
    let parseTimer: Timer, parseMs: number;
    currDataFilePath = dataFilePaths[i];
    parseTimer = Timer.start();;
    await parseCsv(currDataFilePath, recordCb);
    parseMs = parseTimer.stop();
    console.log(`Parse took: ${getIntuitiveTimeString(parseMs)}`);
  }

  console.log(headers);
  console.log(`record count: ${recordCount}`);
}

function validateMintHeaders(rawRecord: unknown): rawRecord is MINT_TRANSACTION_HEADERS_ENUM[] {
  let areHeadersValid: boolean;

  if(!isStringArray(rawRecord)) {
    return false;
  }

  areHeadersValid = MINT_TRANSACTION_HEADERS.every((mintTransactionHeader, idx) => {
    return mintTransactionHeader === rawRecord[idx];
  });

  return areHeadersValid;
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
