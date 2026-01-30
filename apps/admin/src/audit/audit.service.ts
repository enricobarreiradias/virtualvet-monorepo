import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm'; // Adicionado Like
import { AuditLog } from '../../../../libs/data/src/entities/audit-log.entity';
import { User } from '../../../../libs/data/src/entities/user.entity';

// Interface para os filtros
export interface AuditFilterParams {
  category?: string;
  userId?: number;
  page?: number;
  limit?: number;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
  ) {}

  // Grava uma ação (Mantém igual)
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

  // NOVA VERSÃO: Com paginação e filtros reais
  async findAll(params: AuditFilterParams) {
    const { category, userId, page = 1, limit = 10 } = params;
    
    // Calcula quantos registros pular (skip)
    const skip = (page - 1) * limit;

    // Constrói a query dinâmica
    const queryBuilder = this.auditRepository.createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user')
      .orderBy('log.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    // Filtro por Categoria (Entity)
    if (category && category !== 'ALL') {
       if (category === 'SYNC') {
         queryBuilder.andWhere("(log.entity = :extApi OR log.action LIKE :sync)", { extApi: 'ExternalApi', sync: '%SYNC%' });
       } else if (category === 'EVALUATION') {
         queryBuilder.andWhere("log.entity = :entity", { entity: 'Evaluation' });
       } else if (category === 'ANIMAL') {
         queryBuilder.andWhere("log.entity = :entity", { entity: 'Animal' });
       } else if (category === 'USER_MGMT') {
         queryBuilder.andWhere("log.entity = :entity", { entity: 'User' });
       }
    }

    // Filtro por Usuário
    if (userId) {
       queryBuilder.andWhere("user.id = :userId", { userId });
    }

    // Retorna os dados e o total de registros encontrados (para a paginação funcionar)
    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit)
    };
  }
}