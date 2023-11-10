
import { z } from 'zod';

const MintAccountDtoSchema = z.object({
  AccountID: z.number(),
  Name: z.string(),
});

type MintAccountDtoType = z.infer<typeof MintAccountDtoSchema>;

export class MintAccountDto implements MintAccountDtoType {
  constructor(
    public AccountID: number,
    public Name: string,
  ) {}

  static deserialize(rawAccount: unknown): MintAccountDto {
    let parsedAccount: MintAccountDto;
    parsedAccount = MintAccountDtoSchema.parse(rawAccount);
    return new MintAccountDto(
      parsedAccount.AccountID,
      parsedAccount.Name,
    );
  }
}
