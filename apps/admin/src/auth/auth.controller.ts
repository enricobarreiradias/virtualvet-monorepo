import { Body, Controller, Post, Get, Patch, Delete, UseGuards, Param, ParseIntPipe, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './auth-credentials.dto';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';
import { UserRole } from '../../../../libs/data/src/enums/user-role.enum';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  signUp(@Body() authCredentialsDto: AuthCredentialsDto): Promise<void> {
    return this.authService.signUp(authCredentialsDto);
  }

  @Post('/signin')
  signIn(@Body() authCredentialsDto: AuthCredentialsDto): Promise<{ accessToken: string }> {
    return this.authService.signIn(authCredentialsDto);
  }

  @Get('/users')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll() {
    return this.authService.findAll();
  }

  @Patch('/users/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN) 
  async update(
      @Param('id', ParseIntPipe) id: number,
      @Body() body: any,
  ) {
      return this.authService.update(id, body);
  }

  @Delete('/users/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN) 
  async remove(
      @Param('id', ParseIntPipe) id: number
  ) {
      return this.authService.remove(id);
  }

  @Get('/test')
  @UseGuards(AuthGuard('jwt'))
  test(@Req() req: any) {
    return { user: req.user };
  }
}