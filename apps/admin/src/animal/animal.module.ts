import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnimalService } from './animal.service';
import { AnimalController } from './animal.controller';
import { Animal } from '../../../../libs/data/src/entities/animal.entity';
import { Media } from '../../../../libs/data/src/entities/media.entity'; 
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Animal, Media]),
    AuthModule, 
    AuditModule,
  ],
  controllers: [AnimalController],
  providers: [AnimalService],
  exports: [AnimalService]
})
export class AnimalModule {}