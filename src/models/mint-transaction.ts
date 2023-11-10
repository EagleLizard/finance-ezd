
import { z } from 'zod';

/*
[
  'Date',
  'Description',
  'Original Description',
  'Amount',
  'Transaction Type',
  'Category',
  'Account Name',
  'Labels',
  'Notes',
];
*/
const MintTransactionSchmea = z.object({
  date: z.date(),
  description: z.string(),
  originalDescription: z.string(),
  amount: z.number(),
  transactionType: z.string(),
  category: z.string(),
  accountName: z.string(),
  labels: z.string(),
  notes: z.string(),
});

type MintTransactionType = z.infer<typeof MintTransactionSchmea>

export enum MINT_TRANSACTION_HEADERS_ENUM {
  DATE = 'Date',
  DESCRIPTION = 'Description',
  ORIGNAL_DESCRIPTION = 'Original Description',
  AMOUNT = 'Amount',
  TRANSACTION_TYPE = 'Transaction Type',
  CATEGORY = 'Category',
  ACCOUNT_NAME = 'Account Name',
  LABELS = 'Labels',
  NOTES = 'Notes',
}

export const MINT_TRANSACTION_HEADERS = [
  MINT_TRANSACTION_HEADERS_ENUM.DATE,
  MINT_TRANSACTION_HEADERS_ENUM.DESCRIPTION,
  MINT_TRANSACTION_HEADERS_ENUM.ORIGNAL_DESCRIPTION,
  MINT_TRANSACTION_HEADERS_ENUM.AMOUNT,
  MINT_TRANSACTION_HEADERS_ENUM.TRANSACTION_TYPE,
  MINT_TRANSACTION_HEADERS_ENUM.CATEGORY,
  MINT_TRANSACTION_HEADERS_ENUM.ACCOUNT_NAME,
  MINT_TRANSACTION_HEADERS_ENUM.LABELS,
  MINT_TRANSACTION_HEADERS_ENUM.NOTES,
];

const MINT_TRANSACTION_HEADER_KEY_MAP: Record<MINT_TRANSACTION_HEADERS_ENUM, keyof MintTransactionType> = {
  [MINT_TRANSACTION_HEADERS_ENUM.DATE]: 'date',
  [MINT_TRANSACTION_HEADERS_ENUM.DESCRIPTION]: 'description',
  [MINT_TRANSACTION_HEADERS_ENUM.ORIGNAL_DESCRIPTION]: 'originalDescription',
  [MINT_TRANSACTION_HEADERS_ENUM.AMOUNT]: 'amount',
  [MINT_TRANSACTION_HEADERS_ENUM.TRANSACTION_TYPE]: 'transactionType',
  [MINT_TRANSACTION_HEADERS_ENUM.CATEGORY]: 'category',
  [MINT_TRANSACTION_HEADERS_ENUM.ACCOUNT_NAME]: 'accountName',
  [MINT_TRANSACTION_HEADERS_ENUM.LABELS]: 'labels',
  [MINT_TRANSACTION_HEADERS_ENUM.NOTES]: 'notes',
};

// export const MINT_TRANSACTION_INDEX_TO_HEADER_KEY_PROPS: (keyof MintTransactionType)[] = MINT_TRANSACTION_HEADERS.reduce((acc, curr) => {
//   acc.push(MINT_TRANSACTION_HEADER_KEY_MAP[curr]);
//   return acc;
// }, [] as (keyof MintTransaction)[]);

// type IMintTransaction = ;

// 'YYYY-MM-DD hh:mm:ss'
export class MintTransaction implements MintTransactionType {
  constructor(
    public date: Date,
    public description: string,
    public originalDescription: string,
    public amount: number,
    public transactionType: string,
    public category: string,
    public accountName: string,
    public labels: string,
    public notes: string,
  ) {}

  static deserialize(rawTransaction: unknown): MintTransaction {
    let parsedTransaction: MintTransactionType;
    parsedTransaction = MintTransactionSchmea.parse(rawTransaction);
    return new MintTransaction(
      parsedTransaction.date,
      parsedTransaction.description,
      parsedTransaction.originalDescription,
      parsedTransaction.amount,
      parsedTransaction.transactionType,
      parsedTransaction.category,
      parsedTransaction.accountName,
      parsedTransaction.labels,
      parsedTransaction.notes,
    );
  }
}
