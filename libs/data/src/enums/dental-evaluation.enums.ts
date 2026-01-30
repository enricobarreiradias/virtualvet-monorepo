export enum SeverityScale {
  NONE = 0,      
  MODERATE = 1,  
  SEVERE = 2,    
}

export enum ColorScale {
  NORMAL = 0,
  ALTERED = 1,
}

export enum ToothType {
  DECIDUOUS = 'DECIDUOUS', // Dente de Leite
  PERMANENT = 'PERMANENT', // Dente Permanente
}

export enum BinaryStatus {
  ABSENT = 0,
  PRESENT = 1
}

export enum ToothCode {
  I1_LEFT = 'I1_L',
  I1_RIGHT = 'I1_R',
  I2_LEFT = 'I2_L',
  I2_RIGHT = 'I2_R',
  I3_LEFT = 'I3_L',
  I3_RIGHT = 'I3_R',
  I4_LEFT = 'I4_L',
  I4_RIGHT = 'I4_R'
}

export enum PhotoType {
  FRONTAL = 'FRONTAL',
  LINGUAL = 'LINGUAL',
  LATERAL_LEFT = 'LATERAL_LEFT',
  LATERAL_RIGHT = 'LATERAL_RIGHT',
  SUPERIOR = 'SUPERIOR'
}

export enum MoultingStage {
  DL = 'DL', // Dente de Leite (0 permanentes)
  D2 = 'D2', // 2 Permanentes (Pinças)
  D4 = 'D4', // 4 Permanentes (Primeiros Médios)
  D6 = 'D6', // 6 Permanentes (Segundos Médios)
  BC = 'BC'  // Boca Cheia (Todos Permanentes - Cantos)
}