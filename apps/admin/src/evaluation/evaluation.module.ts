import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvaluationService } from './evaluation.service';
import { EvaluationController } from './evaluation.controller';

import { DentalEvaluation } from '../../../../libs/data/src/entities/dental-evaluation.entity';
import { ToothEvaluation } from '../../../../libs/data/src/entities/tooth-evaluation.entity';
import { Animal } from '../../../../libs/data/src/entities/animal.entity';
import { User } from '../../../../libs/data/src/entities/user.entity';
import { Media } from '../../../../libs/data/src/entities/media.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DentalEvaluation, 
      ToothEvaluation, 
      Animal, 
      User, 
      Media
    ])
  ],
  controllers: [EvaluationController],
  providers: [EvaluationService],
})
export class EvaluationModule {}