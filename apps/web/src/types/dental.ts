// apps/web/src/types/dental.ts

// ALINHADO COM A DECISÃO DE 06/01/2026: Escala simplificada de 3 níveis
export enum SeverityScale {
  NONE = 0,      // Saudável / Normal
  MODERATE = 1,  // Moderado / Atenção
  SEVERE = 2     // Crítico / Severo
}

export enum ColorScale {
  NORMAL = 0,
  ALTERED = 1
}

export enum ToothType {
  DECIDUOUS = 'DECIDUOUS', // Dente de Leite
  PERMANENT = 'PERMANENT'  // Dente Permanente
}

export enum ToothCode {
  I1_LEFT = 'I1_L',   // Pinça Esq
  I1_RIGHT = 'I1_R',  // Pinça Dir
  I2_LEFT = 'I2_L',   // Primeiro Médio Esq
  I2_RIGHT = 'I2_R',  // Primeiro Médio Dir
  I3_LEFT = 'I3_L',   // Segundo Médio Esq
  I3_RIGHT = 'I3_R',  // Segundo Médio Dir
  I4_LEFT = 'I4_L',   // Canto Esq
  I4_RIGHT = 'I4_R'   // Canto Dir
}

export interface ToothEvaluationData {
  toothCode: ToothCode;
  
  // Parâmetros Críticos e Visuais
  fractureLevel: SeverityScale;
  pulpitis: SeverityScale;
  gingivalRecessionLevel: SeverityScale; 
  crownReductionLevel: SeverityScale;    
  
  // Outros Indicadores
  lingualWear: SeverityScale;
  periodontalLesions: SeverityScale;
  vitrifiedBorder: SeverityScale;
  pulpChamberExposure: SeverityScale;
  gingivitisEdema: SeverityScale;
  dentalCalculus: SeverityScale;
  caries: SeverityScale;

  // Cores
  gingivitisColor: ColorScale;
  abnormalColor: ColorScale;

  // Metadados
  toothType: ToothType;
  isPresent: boolean;
}

export interface EvaluationPayload {
  animalId: string | number;
  evaluatorId: string | number;
  notes: string;
  teeth: ToothEvaluationData[];
}

export enum MoultingStage {
  DL = 'DL', 
  D2 = 'D2', 
  D4 = 'D4', 
  D6 = 'D6', 
  BC = 'BC', 
}
