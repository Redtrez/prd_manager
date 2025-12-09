import { IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateDesignVersionDto {
  @IsString()
  version: string;

  @IsOptional()
  @IsEnum(['axure', 'html'])
  type?: 'axure' | 'html';

  @IsOptional()
  @IsString()
  entry?: string;
}
