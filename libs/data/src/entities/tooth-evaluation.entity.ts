import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { DentalEvaluation } from './dental-evaluation.entity';
import { SeverityScale, ColorScale, ToothCode, ToothType } from '../enums/dental-evaluation.enums';

@Entity('tooth_evaluation')
export class ToothEvaluation {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({
    type: 'simple-enum',
    enum: ToothCode,
    name: 'tooth_code'
  })
  toothCode: ToothCode;

  @Column({ 
    type: 'simple-enum', 
    enum: ToothType, 
    default: ToothType.PERMANENT, // Assumindo permanente por padrão
    name: 'tooth_type' 
  })
  toothType: ToothType;

  // --- PRIORIDADE 10 (MÁXIMA) ---
  @Column({ name: 'is_present', default: true }) 
  isPresent: boolean;

  @Column({ name: 'crown_reduction_level', type: 'int', default: SeverityScale.NONE })
  crownReductionLevel: number; 

  @Column({ name: 'lingual_wear', type: 'int', default: SeverityScale.NONE })
  lingualWear: SeverityScale;

  @Column({ name: 'gingival_recession_level', type: 'int', default: SeverityScale.NONE })
  gingivalRecessionLevel: number;

  @Column({ name: 'periodontal_lesions', type: 'int', default: SeverityScale.NONE })
  periodontalLesions: SeverityScale;

  // --- PRIORIDADE 8 (ALTA) ---
  @Column({ name: 'fracture_level', type: 'int', default: SeverityScale.NONE })
  fractureLevel: SeverityScale;

  @Column({ name: 'pulpitis', type: 'int', default: SeverityScale.NONE })
  pulpitis: SeverityScale;

  // --- PRIORIDADE 7 (MÉDIA-ALTA) ---
  @Column({ name: 'vitrified_border', type: 'int', default: SeverityScale.NONE })
  vitrifiedBorder: SeverityScale;

  @Column({ name: 'pulp_chamber_exposure', type: 'int', default: SeverityScale.NONE })
  pulpChamberExposure: SeverityScale;

  @Column({ name: 'gingivitis_edema', type: 'int', default: SeverityScale.NONE })
  gingivitisEdema: SeverityScale;

  @Column({ name: 'gingivitis_color', type: 'int', default: ColorScale.NORMAL })
  gingivitisColor: number;

  // --- PRIORIDADE 5 (MÉDIA) ---
  @Column({ name: 'dental_calculus', type: 'int', default: SeverityScale.NONE })
  dentalCalculus: SeverityScale;

  @Column({ name: 'abnormal_color', type: 'int', default: ColorScale.NORMAL })
  abnormalColor: number; 

  @Column({ name: 'caries', type: 'int', default: SeverityScale.NONE })
  caries: SeverityScale;

  // --- RELACIONAMENTO ---
  @ManyToOne(() => DentalEvaluation, (evaluation) => evaluation.teeth, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dental_evaluation_id' })
  evaluation: DentalEvaluation;

  @Column({ name: 'dental_evaluation_id' })
  evaluationId: number;
}