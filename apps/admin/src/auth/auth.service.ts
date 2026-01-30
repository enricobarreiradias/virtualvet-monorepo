import { 
  Injectable, 
  UnauthorizedException, 
  ConflictException, 
  InternalServerErrorException, 
  NotFoundException, 
  ForbiddenException,
  Logger 
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthCredentialsDto } from './auth-credentials.dto';
import { JwtPayload } from './jwt-payload.interface';
import { User } from '../../../../libs/data/src/entities/user.entity';
import { UserRole } from '../../../../libs/data/src/enums/user-role.enum'; 
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  private readonly ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || null; 

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private auditService: AuditService,
  ) {
    if (!this.ADMIN_EMAIL) {
        this.logger.warn('⚠️ SEGURANÇA: SUPER_ADMIN_EMAIL não está definido no .env! O administrador principal não está protegido contra remoção.');
    }
  }

  // --- 1. SIGN UP ---
  async signUp(authCredentialsDto: AuthCredentialsDto): Promise<void> {
    const { email, password, fullName } = authCredentialsDto;

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      fullName: fullName || 'Novo Usuário',
      role: UserRole.USER, 
    });

    try {
      await this.userRepository.save(user);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Este email já está cadastrado.');
      } else {
        this.logger.error('Erro ao salvar usuário:', error);
        throw new InternalServerErrorException();
      }
    }
  }

  // --- 2. VALIDATE ---
  async validateUserPassword(authCredentialsDto: AuthCredentialsDto): Promise<User | null> {
    const { email, password } = authCredentialsDto;
    
    const user = await this.userRepository.findOne({ 
        where: { email },
        select: ['id', 'email', 'password', 'role', 'fullName'] 
    });

    if (user && await bcrypt.compare(password, user.password)) {
      return user;
    }

    return null;
  }

  // --- 3. SIGN IN ---
  async signIn(authCredentialsDto: AuthCredentialsDto): Promise<{ accessToken: string, user: any }> {
    const user = await this.validateUserPassword(authCredentialsDto); 

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload: JwtPayload = { 
        email: user.email,
        sub: user.id,   
        role: user.role 
    }; 
    
    const accessToken = await this.jwtService.sign(payload);

    return { 
        accessToken,
        user: { 
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role
        }
    };
  }

  // --- 4. LISTAR TODOS ---
  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      select: ['id', 'fullName', 'email', 'role', 'registrationDate'], 
      order: { fullName: 'ASC' }
    });
  }

  // --- 5. ATUALIZAR (Com Proteção de Admin) ---
  async update(id: number, updateData: { fullName?: string; email?: string; password?: string; role?: UserRole }): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
        throw new NotFoundException(`Usuário com ID ${id} não encontrado.`);
    }

    // 4. Verificação segura: só bloqueia se o email estiver configurado E corresponder
    if (this.ADMIN_EMAIL && user.email === this.ADMIN_EMAIL) {
        throw new ForbiddenException('Não é permitido alterar os dados do Super Administrador Principal.');
    }

    const { fullName, email, password, role } = updateData;

    if (fullName) user.fullName = fullName;
    if (email) user.email = email;
    if (role) user.role = role;

    if (password) {
        const salt = await bcrypt.genSalt();
        user.password = await bcrypt.hash(password, salt);
    }

    try {
        await this.userRepository.save(user);
    } catch (error) {
        if (error.code === '23505') {
            throw new ConflictException('Email já está em uso por outro usuário.');
        } else {
            throw new InternalServerErrorException();
        }
    }
  }

  // --- 6. REMOVER (Com Proteção de Admin) ---
  async remove(id: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
        throw new NotFoundException(`Usuário com ID ${id} não encontrado.`);
    }

    // 5. Verificação segura aqui também
    if (this.ADMIN_EMAIL && user.email === this.ADMIN_EMAIL) {
        throw new ForbiddenException('CRÍTICO: Não é permitido remover o Administrador Principal.');
    }

    await this.userRepository.remove(user);
  }
}