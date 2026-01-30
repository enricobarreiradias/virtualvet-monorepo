import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../../../libs/data/src/entities/audit-log.entity';
import { User } from '../../../../libs/data/src/entities/user.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
  ) {}

  // Grava uma ação
  async log(action: string, entity: string, entityId: string | number, user: User | null, details?: string) {
    try {
        const newLog = this.auditRepository.create({
            action,
            entity,
            entityId: entityId.toString(),
            user: user || undefined, 
            details: details || ''
        });
        await this.auditRepository.save(newLog);
    } catch (e) {
        console.error("Falha ao salvar log de auditoria:", e);
    }
}

  // Lista os logs (Apenas os últimos 100 para não pesar)
  async findAll() {
    return this.auditRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: 100 
    });
  }
}