import { 
  Controller, Get, Post, Body, UseInterceptors, UploadedFiles, 
  ValidationPipe, UsePipes, Param, Delete, Patch, Query, 
  DefaultValuePipe, ParseIntPipe, UseGuards, Req
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport'; 
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { EvaluationService } from './evaluation.service';
import { QuickMoultingDto } from './dto/quick-moulting.dto';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto';

@Controller('evaluations')
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService) {}

  // --- ROTA PÚBLICA  ---
  @Get('seed') 
  async seed() {
    return await this.evaluationService.seed();
  }

  // --- ROTAS PROTEGIDAS ---

  @Post()
  @UseGuards(AuthGuard('jwt')) 
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true })) 
  async create(@Body() createEvaluationDto: CreateEvaluationDto, @Req() req: any) { 
    const payload = {
      ...createEvaluationDto,
      evaluatorId: req.user.id
    };

    return await this.evaluationService.create(payload);
  }
  
  @Post('upload-animal')
  @UseGuards(AuthGuard('jwt')) 
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'frontal', maxCount: 1 },
    { name: 'vestibular', maxCount: 1 }, 
  ], {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
      },
    }),
  }))
  async uploadAnimal(
    @UploadedFiles() files: { frontal?: Express.Multer.File[], vestibular?: Express.Multer.File[] },
    @Body() body: { code: string, breed: string }
  ) {
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3333'; 
    
    const frontalPath = files.frontal 
      ? `${baseUrl}/uploads/${files.frontal[0].filename}` 
      : null;
      
    const vestibularPath = files.vestibular 
      ? `${baseUrl}/uploads/${files.vestibular[0].filename}` 
      : null;

    return await this.evaluationService.createAnimalFromUpload(
      body.code, 
      body.breed, 
      [frontalPath, vestibularPath].filter(Boolean) as string[]
    );
  }

  @Get('pending')
  @UseGuards(AuthGuard('jwt')) 
  async findPending(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('filterFarm') filterFarm?: string,
    @Query('filterClient') filterClient?: string, 
  ) {
    return await this.evaluationService.findPendingEvaluations(page, limit, search, filterFarm, filterClient);
  }

  @Get('history')
  @UseGuards(AuthGuard('jwt')) 
  async findHistory(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('filterFarm') filterFarm?: string,
    @Query('filterClient') filterClient?: string,
    @Query('filterPathology') filterPathology?: string, 
  ) {
    return await this.evaluationService.findAllHistory(page, limit, search, filterFarm, filterClient, filterPathology);
  }

  @Get('dashboard')
  @UseGuards(AuthGuard('jwt')) 
  async dashboard() {
    return await this.evaluationService.getDashboardStats();
  }

  @Get('animal/:idOrTag')
  @UseGuards(AuthGuard('jwt')) 
  async findByAnimal(@Param('idOrTag') idOrTag: string) {
    return await this.evaluationService.findHistoryByAnimal(idOrTag);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt')) 
  async findOne(@Param('id') id: string) {
    return await this.evaluationService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt')) 
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async update(
    @Param('id') id: string, 
    @Body() updateEvaluationDto: UpdateEvaluationDto,
    @Req() req: any 
  ) {
    return await this.evaluationService.update(+id, updateEvaluationDto, req.user);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt')) 
  async remove(@Param('id') id: string) {
    return await this.evaluationService.remove(+id);
  }

  @Get('reports/stats')
  @UseGuards(AuthGuard('jwt')) 
  async getReportStats(
    @Query('filterFarm') filterFarm?: string,
    @Query('filterClient') filterClient?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return await this.evaluationService.getReportStats(filterFarm, filterClient, startDate, endDate);
  }

  @Post('quick-moulting')
  @UseGuards(AuthGuard('jwt')) 
  @UsePipes(new ValidationPipe({ transform: true }))
  async quickMoulting(@Body() payload: QuickMoultingDto) {
    return await this.evaluationService.applyQuickMoulting(payload);
  }
}