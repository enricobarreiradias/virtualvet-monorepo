import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn,
  OneToMany 
} from 'typeorm';
import { DentalEvaluation } from './dental-evaluation.entity';
import { Media } from './media.entity';

@Entity('animal')
export class Animal {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'tag_code', type: 'varchar', length: 50 })
  tagCode: string;
  
  @Column({ type: 'varchar', nullable: true })
  chip: string | null; 

  @Column({ name: 'sisbov_number', type: 'varchar', nullable: true })
  sisbovNumber: string | null;

  @Column({ type: 'date', nullable: true, name: 'birth_date' })
  birthDate: Date | null;

  @Column({ type: 'float', nullable: true, name: 'current_weight' })
  currentWeight: number | null; 

  @Column({ type: 'varchar', nullable: true })
  breed: string | null;

  @Column({ type: 'varchar', nullable: true })
  farm: string | null;

  @Column({ type: 'varchar', nullable: true })
  lot: string | null;

  @Column({ type: 'varchar', nullable: true })
  client: string | null;

  @Column({ type: 'varchar', nullable: true })
  location: string | null;

  @Column({ type: 'int', nullable: true })
  age: number | null;

  @Column({ name: 'collection_date', type: 'timestamp', nullable: true })
  collectionDate: Date | null;

  @Column({ type: 'float', nullable: true, name: 'body_score' })
  bodyScore: number | null; 

  @Column({ type: 'varchar', nullable: true, name: 'coat_color' })
  coatColor: string | null; 

  @Column({ type: 'varchar', nullable: true })
  category: string | null; 

  @Column({ type: 'varchar', nullable: true })
  status: string | null; 

  @Column({ type: 'timestamp', nullable: true, name: 'entry_date' })
  entryDate: Date | null; 

  // Campos de IDs externos 
  @Column({ type: 'int', nullable: true, name: 'external_category_id' })
  externalCategoryId: number | null;

  @Column({ type: 'int', nullable: true, name: 'external_breed_id' })
  externalBreedId: number | null;

  @Column({ type: 'int', nullable: true, name: 'external_coat_id' })
  externalCoatId: number | null;

  @Column({ type: 'int', nullable: true, name: 'external_cost_center_id' })
  externalCostCenterId: number | null; // Para o "centro_de_custo_id"

  @Column({ type: 'int', nullable: true, name: 'external_stock_location_id' })
  externalStockLocationId: number | null; // Para o "local_de_estoque_id"

  @Column({ type: 'int', nullable: true, name: 'external_lot_id' })
  externalLotId: number | null; // Para o "lote_id"

  @Column({ type: 'timestamp', nullable: true, name: 'external_modification_date' })
  externalModificationDate: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => DentalEvaluation, (evaluation) => evaluation.animal)
  dentalEvaluations: DentalEvaluation[];

  @OneToMany(() => Media, (media) => media.animal)
  mediaFiles: Media[];
}