import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, ManyToMany, OneToMany, JoinTable, JoinColumn,
} from 'typeorm';
import { Animal } from './animal.entity';
import { User } from './user.entity';
import { Media } from './media.entity';
import { ToothEvaluation } from './tooth-evaluation.entity'; 

@Entity('dental_evaluation')
export class DentalEvaluation {
  @PrimaryGeneratedColumn('increment')
  id: number;

  // --- RELACIONAMENTOS ---

  @ManyToOne(() => Animal, (animal) => animal.dentalEvaluations)
  @JoinColumn({ name: 'animal_id' })
  animal: Animal;

  @Column({ name: 'animal_id' })
  animalId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'evaluator_user_id' })
  evaluator: User;

  @Column({ name: 'evaluator_user_id', type: 'uuid' })
  evaluatorUserId: string;

  @ManyToMany(() => Media, (media) => media.evaluations, {
    cascade: true
  })
  @JoinTable({
    name: 'evaluation_media_link',
    joinColumn: { name: 'evaluation_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'media_id', referencedColumnName: 'id' }
  })
  mediaFiles: Media[];

  // Uma avaliação tem vários dentes avaliados
  @OneToMany(() => ToothEvaluation, (tooth) => tooth.evaluation, { 
    cascade: true 
  })
  teeth: ToothEvaluation[];

  // --- DADOS GERAIS ---

  @CreateDateColumn({ name: 'evaluation_date' })
  evaluationDate: Date;

  @Column({ name: 'general_observations', type: 'text', nullable: true })
  generalObservations: string;
  
  @Column({ name: 'general_gingivitis_score', type: 'int', default: 0 })
  generalGingivitisScore: number;
}