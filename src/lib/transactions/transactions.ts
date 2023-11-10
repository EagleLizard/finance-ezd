
import path from 'path';
import { Dirent } from 'fs';
import { readdir } from 'fs/promises';

import { DATA_DIR_PATH } from '../../constants';

import { CsvReader, getCsvReader } from '../csv/parse-csv';
import { isStringArray } from '../../util/validate-primitives';
import {
  MINT_TRANSACTION_HEADERS,
  MINT_TRANSACTION_HEADERS_ENUM,
  MintTransaction,
} from '../../models/mint-transaction';
import { dateUtils } from '../../util/date-utils';
// import { zonedTimeToUtc } from 'date-fns-tz';
// import { TimeZones } from '../../config/timezones';

export async function transactions() {
  let dataFilePaths: string[];

  dataFilePaths = await getDataFiles();
  dataFilePaths = dataFilePaths.filter(dataFilePath => {
    return path.extname(dataFilePath) === '.csv';
  });
  for(let i = 0; i < dataFilePaths.length; ++i) {
    let currDataFilePath: string;
    currDataFilePath = dataFilePaths[i];
    await parseCsvDataFile(currDataFilePath);
  }
}

async function parseCsvDataFile(filePath: string) {
  let csvReader: CsvReader;
  let rawRecord: unknown;
  let headers: MINT_TRANSACTION_HEADERS_ENUM[] | undefined;

  console.log(`Parsing csv data file: ${filePath}`);
  csvReader = getCsvReader(filePath);
  rawRecord = await csvReader.read();
  if(!validateMintHeaders(rawRecord)) {
    console.error(rawRecord);
    throw new Error('Invalid CSV transaction headers');
  }
  headers = rawRecord;
  while((rawRecord = await csvReader.read()) !== null) {
    let currRecord: string[];
    let mintTxn: MintTransaction;
    if(!isStringArray(rawRecord)) {
      console.error(rawRecord);
      throw new Error(`Encountered record that isn't string[] type, found type: ${typeof rawRecord}`);
    }
    currRecord = rawRecord;
    mintTxn = parseMintRecord(currRecord);
    console.log(mintTxn.date);
  }
  console.log('headers');
  console.log(headers);
}

function parseMintRecord(rawRecord: string[]) {
  let date: Date,
    description: string,
    originalDescription: string,
    amount: number,
    transactionType: string,
    category: string,
    accountName: string,
    labels: string,
    notes: string
  ;
  date = dateUtils.parse(rawRecord[0], 'MM/dd/yyyy', new Date());
  description = rawRecord[1];
  originalDescription = rawRecord[2];
  amount = +rawRecord[3];
  transactionType = rawRecord[4];
  category = rawRecord[5];
  accountName = rawRecord[6];
  labels = rawRecord[7];
  notes = rawRecord[8];

  const rawMintTransaction = {
    date,
    description,
    originalDescription,
    amount,
    transactionType,
    category,
    accountName,
    labels,
    notes,
  };
  return MintTransaction.deserialize(rawMintTransaction);
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
