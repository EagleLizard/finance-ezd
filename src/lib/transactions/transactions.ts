
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
import { MysqlDb, QueryGenericType } from '../database/mysql-db';
import { config } from '../../config/config';
import { FieldPacket, RowDataPacket } from 'mysql2';
import { MintCategoryDto } from '../../models/category-dto';
import { MysqlInsertResult } from '../../models/mysql-insert-result';
import { MintAccountDto } from '../../models/account-dto';
import { MintTransactionDto } from '../../models/transaction-dto';

export async function transactions() {
  let dataFilePaths: string[];
  let recordCount: number;
  let headers: MINT_TRANSACTION_HEADERS_ENUM[] | undefined;

  let mysqlDb: MysqlDb;

  let duplicateTxnRecordCount: number;

  mysqlDb = await initDb();

  recordCount = 0;
  duplicateTxnRecordCount = 0;

  dataFilePaths = await getDataFiles();
  dataFilePaths = dataFilePaths.filter(dataFilePath => {
    return path.extname(dataFilePath) === '.csv';
  });

  const recordCb = async (rawRecord: unknown, recordIdx: number) => {
    let currRecord: string[];
    let txnRecord: MintTransaction;

    let mintCategory: MintCategoryDto;
    let mintAccount: MintAccountDto;
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
    txnRecord = MintTransaction.deserialize(currRecord);

    let categoryQuery = await mysqlDb.execute<RowDataPacket[]>(
      'SELECT CategoryID, Name FROM category c WHERE c.Name = ?', [
        txnRecord.category,
      ]
    );

    let accountQuery = await mysqlDb.execute<RowDataPacket[]>('SELECT AccountID, Name FROM account a WHERE a.Name = ?', [
      txnRecord.accountName,
    ]);

    if(accountQuery[0].length < 1) {
      let insertAccountQuery = await mysqlDb.execute('INSERT INTO account (Name) VALUE (?)', [
        txnRecord.accountName,
      ]);
      const insertResult = MysqlInsertResult.deserialize(insertAccountQuery[0]);
      mintAccount = new MintAccountDto(insertResult.insertId, txnRecord.accountName);
    } else {
      mintAccount = MintAccountDto.deserialize(accountQuery[0][0]);
    }

    if(categoryQuery[0].length < 1) {
      let insertCategoryQuery = await mysqlDb.execute('INSERT INTO category (Name) VALUES (?)', [
        txnRecord.category,
      ]);
      const insertResult = MysqlInsertResult.deserialize(insertCategoryQuery[0]);
      mintCategory = new MintCategoryDto(insertResult.insertId, txnRecord.category);
    } else {
      mintCategory = MintCategoryDto.deserialize(categoryQuery[0][0]);
    }

    /*
      just assuming USD for everything right now because no currency
      metadata is available
    */
    const currencyID = 1;

    let txnExistsQuery = await mysqlDb.execute<RowDataPacket[]>(`SELECT
      t.TransactionID,
      t.Date,
      t.Description,
      t.OriginalDescription,
      t.Amount,
      t.TransactionType,
      t.Labels,
      t.Notes,
      c.Name AS CategoryName,
      a.Name as AccountName
    FROM transaction t
      INNER JOIN category AS c ON t.CategoryID = c.CategoryID
      INNER JOIN account AS a ON t.AccountID = a.AccountID
    WHERE (
      Date = ?
      AND Description = ?
      AND OriginalDescription = ?
      AND Amount = ?
      AND TransactionType = ?
      AND Labels = ?
      AND Notes = ?
      AND c.Name = ?
      AND a.Name = ?
    )`, [
      txnRecord.date,
      txnRecord.description,
      txnRecord.originalDescription,
      txnRecord.amount,
      txnRecord.transactionType,
      txnRecord.labels,
      txnRecord.notes,
      txnRecord.category,
      txnRecord.accountName,
    ]);

    if(txnExistsQuery[0].length > 0) {
      // console.log('Transaction exists');
      // console.log(txnExistsQuery[0]);
      duplicateTxnRecordCount++;
    }

    let insertTxnQuery: [QueryGenericType, FieldPacket[]];
    if(txnExistsQuery[0].length < 1) {
      insertTxnQuery  = await mysqlDb.execute(`INSERT INTO transaction (
        Date,
        Description,
        OriginalDescription,
        Amount,
        TransactionType,
        Labels,
        Notes,
        CurrencyID,
        CategoryID,
        AccountID
      ) VALUES (?,?,?,?,?,?,?,?,?,?)`, [
        txnRecord.date,
        txnRecord.description,
        txnRecord.originalDescription,
        txnRecord.amount,
        txnRecord.transactionType,
        txnRecord.labels,
        txnRecord.notes,
        currencyID,
        mintCategory.CategoryID,
        mintAccount.AccountID,
      ]);
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
  console.log(`duplicate count: ${duplicateTxnRecordCount}`);

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
