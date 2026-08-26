import { IsInt, Min } from 'class-validator';

export class ReorderShoppingItemDto {
  @IsInt()
  @Min(0)
  sortOrder!: number;
}
