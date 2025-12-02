import { IsString, IsOptional } from 'class-validator';

export class CreateDesignDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}
