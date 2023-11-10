
import { z } from 'zod';

const MintCategoryDtoSchema = z.object({
  CategoryID: z.number(),
  Name: z.string(),
});

type MintCategoryDtoType = z.infer<typeof MintCategoryDtoSchema>;

export class MintCategoryDto implements MintCategoryDtoType {
  constructor(
    public CategoryID: number,
    public Name: string,
  ) {}

  static deserialize(rawCategory: unknown): MintCategoryDto {
    let parsedCategory: MintCategoryDtoType;
    parsedCategory = MintCategoryDtoSchema.parse(rawCategory);
    return new MintCategoryDto(
      parsedCategory.CategoryID,
      parsedCategory.Name,
    );
  }
}
