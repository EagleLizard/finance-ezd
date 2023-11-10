
import { z } from 'zod';

const MintTransactionDtoSchema = z.object({
  TransactionID: z.number(),
  Date: z.date(),
  Description: z.string(),
  OriginalDescription: z.string(),
  Amount: z.number(),
  Labels: z.string(),
  CurrencyID: z.number(),
  CategoryID: z.number(),
  AccountID: z.number(),
  CreatedAt: z.date(),
  LastModified: z.date(),
});

type MintTransactionDtoType = z.infer<typeof MintTransactionDtoSchema>;

export class MintTransactionDto implements MintTransactionDtoType {
  constructor(
    public TransactionID: number,
    public Date: Date,
    public Description: string,
    public OriginalDescription: string,
    public Amount: number,
    public Labels: string,
    public CurrencyID: number,
    public CategoryID: number,
    public AccountID: number,
    public CreatedAt: Date,
    public LastModified: Date,
  ) {}

  static deserialize(rawTransaction: unknown): MintTransactionDto {
    let parsedTransaction: MintTransactionDto;
    parsedTransaction = MintTransactionDtoSchema.parse(rawTransaction);
    return new MintTransactionDto(
      parsedTransaction.TransactionID,
      parsedTransaction.Date,
      parsedTransaction.Description,
      parsedTransaction.OriginalDescription,
      parsedTransaction.Amount,
      parsedTransaction.Labels,
      parsedTransaction.CurrencyID,
      parsedTransaction.CategoryID,
      parsedTransaction.AccountID,
      parsedTransaction.CreatedAt,
      parsedTransaction.LastModified,
    );
  }
}
