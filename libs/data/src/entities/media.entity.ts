import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  JoinColumn,
  ManyToMany 
} from 'typeorm';
import { Animal } from './animal.entity';
import { DentalEvaluation } from './dental-evaluation.entity';
import { PhotoType } from '../enums/dental-evaluation.enums';

@Entity('media')
export class Media {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 's3_url_path', type: 'text', nullable: true })
  s3UrlPath: string | null;

  @Column({ 
    type: 'simple-enum', 
    enum: PhotoType, 
    default: PhotoType.FRONTAL,
    name: 'photo_type' 
  })
  photoType: PhotoType;

  // --- NOVOS CAMPOS ---

  @Column({ name: 'original_drive_url', type: 'text', nullable: true })
  originalDriveUrl: string | null;

  @Column({ type: 'float', nullable: true })
  latitude: number | null;

  @Column({ type: 'float', nullable: true })
  longitude: number | null;

  // --- RELACIONAMENTOS ---

  @ManyToOne(() => Animal, (animal) => animal.mediaFiles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'animal_id' })
  animal: Animal;

  @ManyToMany(() => DentalEvaluation, (evaluation) => evaluation.mediaFiles)
  evaluations: DentalEvaluation[];
}