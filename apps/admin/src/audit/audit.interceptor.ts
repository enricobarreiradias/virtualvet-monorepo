import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, user, params } = req;

    // Se for apenas leitura (GET), não auditamos para economizar espaço
    if (method === 'GET') {
      return next.handle();
    }

    // O 'tap' permite executar uma ação secundária sem alterar a resposta original
    return next.handle().pipe(
      tap(async (data) => {
        try {
          // Tenta descobrir o ID da entidade
          // 1. Se for DELETE/PUT, geralmente está na URL (params.id)
          // 2. Se for POST, o ID do novo item costuma vir na resposta (data.id)
          let entityId = params.id ? params.id : (data && data.id ? data.id : 'N/A');

          // Tenta "adivinhar" o nome da entidade pela URL (ex: /animals -> Animal)
          // Pega a primeira parte da URL após a barra
          const entityPath = url.split('/')[1] || 'Unknown'; 
          const entityName = entityPath.charAt(0).toUpperCase() + entityPath.slice(1);

          // Prepara os detalhes (ex: Body da requisição)
          // Cuidado: Evite salvar senhas ou dados sensíveis aqui
          const details = `Method: ${method} | Path: ${url}`;

          // Mapeia o método HTTP para uma Ação legível
          let action = 'UNKNOWN';
          if (method === 'POST') action = 'CREATE';
          if (method === 'PUT' || method === 'PATCH') action = 'UPDATE';
          if (method === 'DELETE') action = 'DELETE';

          // Chama o serviço de auditoria em "background" (sem travar a resposta)
          await this.auditService.log(
            `${action}_${entityName.toUpperCase()}`, // Ex: CREATE_ANIMAL
            entityName,                              // Ex: Animal
            entityId,
            user,                                    // O usuário que veio do JWT
            details
          );

        } catch (err) {
          this.logger.error('Erro ao salvar log automático', err);
          // Não lançamos erro aqui para não quebrar a requisição do usuário
        }
      })
    );
  }
}