import { Controller, Get, UseGuards, Req, ForbiddenException, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuditService } from './audit.service';

@Controller('audit')
@UseGuards(AuthGuard('jwt'))
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  async findAll(
    @Req() req: any,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('category') category: string,
    @Query('userId') userId: number,
  ) {
    // Segurança: Só Admin vê logs
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Apenas administradores podem acessar a auditoria.');
    }

    // Passamos os query params convertidos para o serviço
    return this.auditService.findAll({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      category,
      userId
    });
  }
}