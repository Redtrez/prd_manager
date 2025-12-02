import { IsString } from 'class-validator';

export class CreateDesignVersionDto {
  @IsString()
  version: string;
}
