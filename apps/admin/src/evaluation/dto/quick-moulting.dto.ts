import { IsEnum, IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export enum MoultingStage {
  DL = 'DL', // Dente de Leite
  D2 = '2D', // 2 Dentes
  D4 = '4D', // 4 Dentes
  D6 = '6D', // 6 Dentes
  BC = 'BC'  // Boca Cheia
}

export class QuickMoultingDto {
  @IsString()
  @IsNotEmpty()
  animalId: string;

  @IsEnum(MoultingStage)
  @IsNotEmpty()
  stage: MoultingStage;

  @IsNumber()
  @IsOptional()
  evaluatorId?: number;
}