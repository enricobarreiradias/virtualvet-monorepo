import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateAnimalDto {
  @IsNotEmpty()
  @IsString()
  tagCode: string;

  @IsNotEmpty()
  @IsString()
  breed: string;

  @IsOptional()
  @IsString()
  animalIdentifier?: string;
}