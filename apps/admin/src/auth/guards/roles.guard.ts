import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../../../../libs/data/src/enums/user-role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Ler quais roles são exigidas para esta rota
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 2. Se não houver roles exigidas, permite o acesso (público ou apenas logado)
    if (!requiredRoles) {
      return true;
    }

    // 3. Obter o utilizador do request (injetado pelo JwtStrategy)
    const { user } = context.switchToHttp().getRequest();

    // 4. Verificar se o utilizador tem a role necessária
    return requiredRoles.some((role) => user?.role === role);
  }
}