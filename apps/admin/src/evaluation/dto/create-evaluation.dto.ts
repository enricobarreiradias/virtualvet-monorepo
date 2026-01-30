import { 
  IsString, 
  IsInt, 
  IsArray, 
  ValidateNested, 
  IsOptional, 
  IsEnum, 
  IsBoolean, 
  Min, 
  Max 
} from 'class-validator';
import { Type } from 'class-transformer';

// Enums alinhados com o Frontend
export enum ToothType {
  DECIDUOUS = 'DECIDUOUS',
  PERMANENT = 'PERMANENT'
}

export enum EvaluationStatus {
  HEALTHY = 'HEALTHY',
  MODERATE = 'MODERATE',
  CRITICAL = 'CRITICAL'
}

// DTO para cada Dente individual
export class ToothEvaluationDto {
  @IsString()
  toothCode: string; 

  @IsBoolean()
  isPresent: boolean;

  @IsEnum(ToothType)
  toothType: ToothType;

  // --- PARÂMETROS CRÍTICOS (Escala 0 a 2) ---
  // 0 = Normal, 1 = Moderado, 2 = Crítico 
  
  @IsInt() @Min(0) @Max(2) @IsOptional()
  fractureLevel?: number;

  @IsInt() @Min(0) @Max(2) @IsOptional()
  pulpitis?: number;

  @IsInt() @Min(0) @Max(2) @IsOptional()
  gingivalRecessionLevel?: number;

  @IsInt() @Min(0) @Max(2) @IsOptional()
  crownReductionLevel?: number;

  // --- OUTROS INDICADORES (Escala 0 a 2) ---

  @IsInt() @Min(0) @Max(2) @IsOptional()
  lingualWear?: number;

  @IsInt() @Min(0) @Max(2) @IsOptional()
  periodontalLesions?: number;

  @IsInt() @Min(0) @Max(2) @IsOptional()
  dentalCalculus?: number;

  @IsInt() @Min(0) @Max(2) @IsOptional()
  caries?: number;

  // --- CORES (Escala 0 a 1) ---
  // 0 = Normal, 1 = Alterada 

  @IsInt() @Min(0) @Max(1) @IsOptional()
  gingivitisColor?: number;

  @IsInt() @Min(0) @Max(1) @IsOptional()
  abnormalColor?: number;

  // --- DETALHES ESPECÍFICOS ---

  @IsInt() @Min(0) @Max(2) @IsOptional()
  vitrifiedBorder?: number;

  @IsInt() @Min(0) @Max(2) @IsOptional()
  pulpChamberExposure?: number;

  @IsInt() @Min(0) @Max(2) @IsOptional()
  gingivitisEdema?: number;
}

// DTO Principal da Avaliação
export class CreateEvaluationDto {
  @IsString()
  animalId: string;

  @IsInt()
  @IsOptional()
  evaluatorId?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  // Validação do Array de Dentes
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ToothEvaluationDto)
  teeth: ToothEvaluationDto[];
}