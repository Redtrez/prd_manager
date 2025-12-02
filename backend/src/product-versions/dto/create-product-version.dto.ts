import { IsString, IsOptional } from 'class-validator';

export class CreateProductVersionDto {
  @IsString()
  version: string;

  @IsString()
  @IsOptional()
  description?: string;
}
