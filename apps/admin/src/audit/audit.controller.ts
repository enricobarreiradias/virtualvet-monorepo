import { Controller, Get, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuditService } from './audit.service';

@Controller('audit')
@UseGuards(AuthGuard('jwt'))
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  async findAll(@Req() req: any) {
    // Segurança: Só Admin vê logs
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Apenas administradores podem acessar a auditoria.');
    }
    return this.auditService.findAll();
  }
}