
import { z } from 'zod';

const MysqlInsertResultSchema = z.object({
  insertId: z.number(),
});

type MysqlInsertResultType = z.infer<typeof MysqlInsertResultSchema>;

export class MysqlInsertResult implements MysqlInsertResultType {
  constructor(
    public insertId: number,
  ) {}

  static deserialize(rawResult: unknown): MysqlInsertResult {
    let parsedResult: MysqlInsertResultType;
    parsedResult = MysqlInsertResultSchema.parse(rawResult);
    return new MysqlInsertResult(
      parsedResult.insertId,
    );
  }
}
