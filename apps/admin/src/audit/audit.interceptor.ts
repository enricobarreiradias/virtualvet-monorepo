import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { AuditService } from "./audit.service";

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, user, params } = req;

    // Se for apenas leitura (GET), não auditamos
    if (method === "GET") {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async (data) => {
        try {
          // --- 1. Tenta descobrir o ID da entidade ---
          let entityId = params.id
            ? params.id
            : data && data.id
              ? data.id
              : "N/A";

          // --- 2. Define o Nome da Entidade  ---
          const cleanUrl = url.split("?")[0]; // Remove query params
          const urlParts = cleanUrl.split("/").filter((p: string) => p !== ""); // Remove strings vazias

          // Se a URL começar com 'api', pegamos o próximo segmento (ex: /api/animals -> animals)
          let mainResource = urlParts[0] === "api" ? urlParts[1] : urlParts[0];

          if (!mainResource) mainResource = "System";

          // Capitaliza a primeira letra (ex: animals -> Animal)
          let entityName =
            mainResource.charAt(0).toUpperCase() + mainResource.slice(1);
          // Remove o 's' final para ficar no singular (ex: Animals -> Animal), lógica básica
          if (entityName.endsWith("s")) entityName = entityName.slice(0, -1);

          // --- 3. Define a Ação  ---
          let action = "UNKNOWN";

          // Mapeamento Padrão
          if (method === "POST") action = "CREATE";
          if (method === "PUT" || method === "PATCH") action = "UPDATE";
          if (method === "DELETE") action = "DELETE";

          // --- 4. OVERRIDES (Regras Específicas) ---

          if (
            cleanUrl.includes("/auth/signin") ||
            cleanUrl.includes("/login")
          ) {
            action = "LOGIN";
            entityName = "Auth";
            entityId = data?.user?.id || user?.id || "N/A"; // Tenta pegar o ID do user logado
          } else if (
            cleanUrl.includes("/auth/signup") ||
            cleanUrl.includes("/register")
          ) {
            action = "REGISTER";
            entityName = "Auth";
          }

          // Formata a ação final (ex: CREATE_ANIMAL, LOGIN, DELETE_EVALUATION)
          // Se for LOGIN, mantemos só LOGIN. Se for CRUD, juntamos com a entidade.
          const finalAction =
            action === "LOGIN" || action === "REGISTER"
              ? action
              : `${action}_${entityName.toUpperCase()}`;

          // Prepara os detalhes
          const details = `Method: ${method} | Path: ${cleanUrl}`;

          // Grava o log
          await this.auditService.log(
            finalAction,
            entityName,
            entityId,
            user,
            details,
          );
        } catch (err) {
          this.logger.error("Erro ao salvar log automático", err);
        }
      }),
    );
  }
}
