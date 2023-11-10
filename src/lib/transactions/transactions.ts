
import path from 'path';
import { Dirent } from 'fs';
import { readdir } from 'fs/promises';

import { DATA_DIR_PATH, DEFAULT_MYSQL_DB_PORT } from '../../constants';

import { parseCsv } from '../csv/parse-csv';
import { isStringArray } from '../../util/validate-primitives';
import {
  MINT_TRANSACTION_HEADERS,
  MINT_TRANSACTION_HEADERS_ENUM,
  MintTransaction,
} from '../../models/mint-transaction';
import { Timer } from '../../util/timer';
import { getIntuitiveTimeString } from '../../util/print-util';
import { MysqlDb } from '../database/mysql-db';
import { config } from '../../config/config';
import { RowDataPacket } from 'mysql2';
import { MintCategoryDto } from '../../models/category-dto';
import { MysqlInsertResult } from '../../models/mysql-insert-result';
import { MintAccountDto } from '../../models/account-dto';
import { MintTransactionDto } from '../../models/transaction-dto';

export async function transactions() {
  let dataFilePaths: string[];
  let recordCount: number;
  let headers: MINT_TRANSACTION_HEADERS_ENUM[] | undefined;

  let mysqlDb: MysqlDb;

  mysqlDb = await initDb();

  recordCount = 0;

  dataFilePaths = await getDataFiles();
  dataFilePaths = dataFilePaths.filter(dataFilePath => {
    return path.extname(dataFilePath) === '.csv';
  });

  const recordCb = async (rawRecord: unknown, recordIdx: number) => {
    let currRecord: string[];
    let mintTxn: MintTransaction;

    let mintCategory: MintCategoryDto;
    let mintAccount: MintCategoryDto;
    let mintTransaction: MintTransactionDto;

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

    let categoryQuery = await mysqlDb.execute<RowDataPacket[]>(
      'SELECT CategoryID, Name FROM category c WHERE c.Name = ?', [
        mintTxn.category,
      ]
    );

    let accountQuery = await mysqlDb.execute<RowDataPacket[]>('SELECT AccountID, Name FROM account a WHERE a.Name = ?', [
      mintTxn.accountName,
    ]);

    if(accountQuery[0].length < 1) {
      let insertAccountQuery = await mysqlDb.execute('INSERT INTO account (Name) VALUE (?)', [
        mintTxn.accountName,
      ]);
      const insertResult = MysqlInsertResult.deserialize(insertAccountQuery[0]);
      mintAccount = new MintAccountDto(insertResult.insertId, mintTxn.accountName);
    } else {
      mintAccount = MintAccountDto.deserialize(accountQuery[0][0]);
    }

    if(categoryQuery[0].length < 1) {
      let insertCategoryQuery = await mysqlDb.execute('INSERT INTO category (Name) VALUES (?)', [
        mintTxn.category,
      ]);
      const insertResult = MysqlInsertResult.deserialize(insertCategoryQuery[0]);
      mintCategory = new MintCategoryDto(insertResult.insertId, mintTxn.category);
    } else {
      mintCategory = MintCategoryDto.deserialize(categoryQuery[0][0]);
    }
  };



  for(let i = 0; i < dataFilePaths.length; ++i) {
    let currDataFilePath: string;
    let parseTimer: Timer, parseMs: number;
    currDataFilePath = dataFilePaths[i];
    parseTimer = Timer.start();
    await parseCsv(currDataFilePath, recordCb);
    parseMs = parseTimer.stop();
    console.log(`Parse took: ${getIntuitiveTimeString(parseMs)}`);
  }
  
  console.log(headers);
  console.log(`record count: ${recordCount}`);

  await mysqlDb.$destroy();
}

async function initDb(): Promise<MysqlDb> {
  return MysqlDb.init({
    host: config.MYSQL_DB_HOST,
    port: config.MYSQL_DB_PORT ?? DEFAULT_MYSQL_DB_PORT,
    user: config.MYSQL_DB_USER,
    password: config.MYSQL_DB_PASSSWORD,
    database: 'ezd_finance_db',
  });
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
