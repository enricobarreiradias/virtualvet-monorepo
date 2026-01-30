import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, DeepPartial } from 'typeorm'; 
import { QuickMoultingDto, MoultingStage } from './dto/quick-moulting.dto';
import { DentalEvaluation } from '@app/data/entities/dental-evaluation.entity';
import { ToothEvaluation } from '@app/data/entities/tooth-evaluation.entity';
import { Animal } from '@app/data/entities/animal.entity';
import { User } from '@app/data/entities/user.entity';
import { Media } from '@app/data/entities/media.entity'; 
import { PhotoType, SeverityScale, ToothCode, ColorScale, ToothType } from '@app/data/enums/dental-evaluation.enums'; 
// REMOVIDO: import { AuditService } ...

@Injectable()
export class EvaluationService {
  constructor(
    @InjectRepository(DentalEvaluation)
    private readonly evaluationRepository: Repository<DentalEvaluation>,

    @InjectRepository(ToothEvaluation)
    private readonly toothRepository: Repository<ToothEvaluation>,
    
    @InjectRepository(Animal)
    private readonly animalRepository: Repository<Animal>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>, 
    
    private dataSource: DataSource,
    
    // REMOVIDO: private readonly auditService: AuditService 
  ) {}

  // --- 1. CRIAR AVALIAÇÃO ---
  async create(createDto: any): Promise<DentalEvaluation> {
    const animalIdNumber = Number(createDto.animalId);

    const animal = await this.animalRepository.findOne({ 
        where: { id: animalIdNumber } 
    });
    if (!animal) throw new NotFoundException(`Animal #${animalIdNumber} não encontrado.`);

    const evaluatorId = createDto.evaluatorId || 1; 
    const evaluator = await this.userRepository.findOne({ where: { id: evaluatorId } });
    
    if (!evaluator) {
        throw new NotFoundException(`Avaliador (User ID: ${evaluatorId}) não encontrado.`);
    }

    let evaluation = await this.evaluationRepository.findOne({
        where: { animal: { id: animal.id } },
        relations: ['teeth'],
        order: { evaluationDate: 'DESC' }
    });
    
    const isSameDay = evaluation && new Date().toDateString() === new Date(evaluation.evaluationDate).toDateString();
    
    // Nota: O Interceptor vai detectar isto como um POST e logar 'CREATE_EVALUATION'
    if (evaluation && isSameDay) {
        evaluation.generalObservations = createDto.notes || evaluation.generalObservations;
        evaluation.evaluationDate = new Date(); 
    } else {
        evaluation = this.evaluationRepository.create({
            animal: animal, 
            evaluator: evaluator, 
            generalObservations: createDto.notes || '',
            evaluationDate: new Date()
        });
    }
    
    const savedEvaluation = await this.evaluationRepository.save(evaluation);

    // REMOVIDO: Log Manual. O Interceptor tratará disto.

    if (createDto.teeth && Array.isArray(createDto.teeth)) {
        for (const toothData of createDto.teeth) {
          let tooth = await this.toothRepository.findOne({
              where: { evaluation: { id: savedEvaluation.id }, toothCode: toothData.toothCode }
          });

          if (!tooth) {
             tooth = this.toothRepository.create({
                 evaluation: savedEvaluation,
                 toothCode: toothData.toothCode,
             });
          }

          tooth.toothType = toothData.toothType || ToothType.PERMANENT;
          tooth.isPresent = toothData.isPresent !== false;
          tooth.crownReductionLevel = toothData.crownReductionLevel || SeverityScale.NONE;
          tooth.lingualWear = toothData.lingualWear || SeverityScale.NONE;
          tooth.gingivalRecessionLevel = toothData.gingivalRecessionLevel || SeverityScale.NONE;
          tooth.periodontalLesions = toothData.periodontalLesions || SeverityScale.NONE;
          tooth.fractureLevel = toothData.fractureLevel || SeverityScale.NONE;
          tooth.pulpitis = toothData.pulpitis || SeverityScale.NONE;
          tooth.vitrifiedBorder = toothData.vitrifiedBorder || SeverityScale.NONE;
          tooth.pulpChamberExposure = toothData.pulpChamberExposure || SeverityScale.NONE;
          tooth.gingivitisEdema = toothData.gingivitisEdema || SeverityScale.NONE;
          tooth.gingivitisColor = toothData.gingivitisColor || ColorScale.NORMAL;
          tooth.dentalCalculus = toothData.dentalCalculus || SeverityScale.NONE;
          tooth.abnormalColor = toothData.abnormalColor || ColorScale.NORMAL;
          tooth.caries = toothData.caries || SeverityScale.NONE;

          await this.toothRepository.save(tooth);
        }
    } else if (!isSameDay) {
        await this.createDefaultHealthyTeeth(savedEvaluation);
    }
    
    return this.findOne(savedEvaluation.id);
  }

  async applyQuickMoulting(dto: QuickMoultingDto) {
    const allTeethCodes = [
      'I1_LEFT', 'I1_RIGHT', 'I2_LEFT', 'I2_RIGHT', 
      'I3_LEFT', 'I3_RIGHT', 'I4_LEFT', 'I4_RIGHT'
    ];

    const teethData = allTeethCodes.map(code => {
      const isPermanent = this.checkIsPermanent(code, dto.stage);
      return {
        toothCode: code,
        isPresent: true,
        toothType: isPermanent ? 'PERMANENT' : 'DECIDUOUS',
        fractureLevel: 0, pulpitis: 0, crownReductionLevel: 0, gingivalRecessionLevel: 0,
        lingualWear: 0, periodontalLesions: 0, caries: 0, abnormalColor: 0, gingivitisColor: 0
      };
    });

    return this.create({
      animalId: dto.animalId,
      evaluatorId: dto.evaluatorId || 1, 
      notes: `Muda rápida aplicada: ${dto.stage}`,
      teeth: teethData
    });
  }

  private checkIsPermanent(code: string, stage: MoultingStage): boolean {
    const prefix = code.split('_')[0]; 
    switch (prefix) {
      case 'I1': return [MoultingStage.D2, MoultingStage.D4, MoultingStage.D6, MoultingStage.BC].includes(stage);
      case 'I2': return [MoultingStage.D4, MoultingStage.D6, MoultingStage.BC].includes(stage);
      case 'I3': return [MoultingStage.D6, MoultingStage.BC].includes(stage);
      case 'I4': return [MoultingStage.BC].includes(stage);
      default: return false;
    }
  }

  // --- 2. PENDENTES  ---
  async findPendingEvaluations(
      page: number = 1, limit: number = 20, 
      search?: string, filterFarm?: string, filterClient?: string
  ) {
      const query = this.animalRepository.createQueryBuilder('animal')
        .leftJoinAndSelect('animal.mediaFiles', 'media')
        .leftJoin('animal.dentalEvaluations', 'evaluation')
        .where('evaluation.id IS NULL'); 

      if (search) query.andWhere('(animal.tagCode ILIKE :search OR animal.id::text ILIKE :search)', { search: `%${search}%` });
      if (filterFarm) query.andWhere('animal.farm ILIKE :farm', { farm: `%${filterFarm}%` });
      if (filterClient) query.andWhere('animal.client ILIKE :client', { client: `%${filterClient}%` });
      
      const [animals, total] = await query
        .orderBy('animal.id', 'DESC')
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();
      
      return {
          data: animals.map(a => ({
            id: a.id.toString(), 
            code: a.tagCode, 
            breed: a.breed, 
            farm: a.farm, 
            client: a.client,
            age: a.age, 
            chip: a.chip, 
            sisbov: a.sisbovNumber, 
            currentWeight: a.currentWeight, 
            lot: a.lot,
            birthDate: a.birthDate ? new Date(a.birthDate).toLocaleDateString('pt-BR') : undefined,
            entryDate: a.collectionDate ? new Date(a.collectionDate).toLocaleDateString('pt-BR') : 'N/A',
            createdAt: a.createdAt, 
            media: a.mediaFiles?.map(m => m.s3UrlPath) || []
          })),
          meta: { total, page, limit, lastPage: Math.ceil(total / limit) }
      };
  }

  private calculateStatus(teeth: ToothEvaluation[]): 'CRITICAL' | 'MODERATE' | 'HEALTHY' {
      if (!teeth || teeth.length === 0) return 'HEALTHY';
      const hasCritical = teeth.some(t => 
          t.fractureLevel === SeverityScale.SEVERE || 
          t.pulpitis === SeverityScale.SEVERE ||
          t.gingivalRecessionLevel === SeverityScale.SEVERE
      );
      if (hasCritical) return 'CRITICAL';

      const hasModerate = teeth.some(t => 
          t.fractureLevel === SeverityScale.MODERATE || t.pulpitis === SeverityScale.MODERATE || t.gingivalRecessionLevel === SeverityScale.MODERATE ||
          t.crownReductionLevel >= SeverityScale.MODERATE || t.periodontalLesions >= SeverityScale.MODERATE ||
          t.dentalCalculus >= SeverityScale.MODERATE || t.lingualWear >= SeverityScale.MODERATE || t.caries >= SeverityScale.MODERATE
      );
      if (hasModerate) return 'MODERATE';
      return 'HEALTHY';
  }

  // --- 3. HISTÓRICO ---
  async findAllHistory(
      page: number = 1, limit: number = 10, 
      search?: string, filterFarm?: string, filterClient?: string, filterPathology?: string 
  ) {
    const query = this.evaluationRepository.createQueryBuilder('evaluation')
        .leftJoinAndSelect('evaluation.animal', 'animal')
        .leftJoinAndSelect('evaluation.mediaFiles', 'mediaFiles')
        .leftJoinAndSelect('evaluation.evaluator', 'evaluator') 
        .innerJoinAndSelect('evaluation.teeth', 'teeth'); 

    if (search) query.andWhere('(animal.tagCode ILIKE :search OR animal.id::text ILIKE :search)', { search: `%${search}%` });
    if (filterFarm && filterFarm !== 'all') query.andWhere('animal.farm ILIKE :farm', { farm: `%${filterFarm}%` });
    if (filterClient && filterClient !== 'all') query.andWhere('animal.client ILIKE :client', { client: `%${filterClient}%` });

    if (filterPathology) {
        const map: Record<string, string> = {
            'fracture': 'teeth.fracture_level', 'pulpitis': 'teeth.pulpitis', 'recession': 'teeth.gingival_recession_level',
            'crown': 'teeth.crown_reduction_level', 'calculus': 'teeth.dental_calculus', 'periodontal': 'teeth.periodontal_lesions',
            'lingual': 'teeth.lingual_wear', 'caries': 'teeth.caries', 'vitrified': 'teeth.vitrified_border',
            'exposure': 'teeth.pulp_chamber_exposure', 'edema': 'teeth.gingivitis_edema',
        };
        const column = map[filterPathology];
        if (column) query.andWhere(`${column} > 0`);
    }

    const [evaluations, total] = await query
        .orderBy('evaluation.evaluationDate', 'DESC')
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

    return {
      data: evaluations.map(ev => {
        const maxFracture = ev.teeth?.length ? Math.max(...ev.teeth.map(t => t.fractureLevel)) : 0;
        const status = this.calculateStatus(ev.teeth);
        return {
            id: ev.id.toString(),
            animalId: ev.animal.id.toString(),
            code: ev.animal.tagCode,
            breed: ev.animal.breed,
            farm: ev.animal.farm,
            client: ev.animal.client,
            chip: ev.animal.chip,
            age: ev.animal.age, 
            lastEvaluationDate: ev.evaluationDate,
            media: ev.mediaFiles?.map(m => m.s3UrlPath) || [],
            worstFracture: maxFracture,
            status: status,
            evaluatorName: ev.evaluator ? ev.evaluator.fullName : 'Sistema', 
            evaluatorId: ev.evaluator ? ev.evaluator.id : null
        };
      }),
      meta: { total, page, limit }
    };
  }

  // --- 4. FIND ONE ---
  async findOne(id: number) {
    const evaluation = await this.evaluationRepository.findOne({
      where: { id },
      relations: ['animal', 'evaluator', 'mediaFiles', 'teeth'], 
    });
    if (!evaluation) throw new NotFoundException(`Avaliação #${id} não encontrada.`);
    return evaluation;
  }

  // --- 5. ATUALIZAR ---
  async update(id: number, updateDto: any, user: any) { 
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const evaluation = await queryRunner.manager.findOne(DentalEvaluation, { 
          where: { id },
          relations: ['evaluator'] 
      });
      if (!evaluation) throw new NotFoundException(`Avaliação #${id} não encontrada.`);

      const isAdmin = user.role === 'admin';
      const isOwner = evaluation.evaluator && evaluation.evaluator.id === user.id;

      if (!isAdmin && !isOwner) {
          throw new ForbiddenException('Você não tem permissão para editar esta avaliação.');
      }

      if (updateDto.notes !== undefined) {
          evaluation.generalObservations = updateDto.notes;
          await queryRunner.manager.save(evaluation);
      }

      if (updateDto.teeth && Array.isArray(updateDto.teeth)) {
          for (const t of updateDto.teeth) {
              let tooth = await queryRunner.manager.findOne(ToothEvaluation, {
                  where: { evaluation: { id: id }, toothCode: t.toothCode }
              });

              if (!tooth) {
                  tooth = queryRunner.manager.create(ToothEvaluation, {
                      evaluation: evaluation,
                      toothCode: t.toothCode
                  });
              }

              Object.assign(tooth, {
                  toothType: t.toothType ?? tooth.toothType,
                  isPresent: t.isPresent ?? tooth.isPresent,
                  fractureLevel: t.fractureLevel ?? tooth.fractureLevel,
                  pulpitis: t.pulpitis ?? tooth.pulpitis,
                  gingivalRecessionLevel: t.gingivalRecessionLevel ?? tooth.gingivalRecessionLevel,
                  crownReductionLevel: t.crownReductionLevel ?? tooth.crownReductionLevel,
                  lingualWear: t.lingualWear ?? tooth.lingualWear,
                  periodontalLesions: t.periodontalLesions ?? tooth.periodontalLesions,
                  dentalCalculus: t.dentalCalculus ?? tooth.dentalCalculus,
                  caries: t.caries ?? tooth.caries,
                  vitrifiedBorder: t.vitrifiedBorder ?? tooth.vitrifiedBorder,
                  pulpChamberExposure: t.pulpChamberExposure ?? tooth.pulpChamberExposure,
                  gingivitisEdema: t.gingivitisEdema ?? tooth.gingivitisEdema,
                  gingivitisColor: t.gingivitisColor ?? tooth.gingivitisColor,
                  abnormalColor: t.abnormalColor ?? tooth.abnormalColor,
              });
              await queryRunner.manager.save(tooth);
          }
      }
      
      // REMOVIDO: Log manual. O Interceptor tratará disto.

      await queryRunner.commitTransaction();

    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
    return this.findOne(id);
  }

  // --- 6. REMOVER ---
  async remove(id: number) {
    const evaluation = await this.findOne(id);
    return await this.evaluationRepository.remove(evaluation);
  }

  // --- 7. HISTÓRICO POR ANIMAL ---
  async findHistoryByAnimal(animalIdOrTag: string) {
    const isId = !isNaN(Number(animalIdOrTag));
    const query = this.evaluationRepository.createQueryBuilder('evaluation')
      .leftJoinAndSelect('evaluation.animal', 'animal')
      .leftJoinAndSelect('evaluation.mediaFiles', 'media')
      .leftJoinAndSelect('evaluation.evaluator', 'evaluator')
      .leftJoinAndSelect('evaluation.teeth', 'teeth');

    if (isId) query.where('animal.id = :id', { id: animalIdOrTag });
    else query.where('animal.tagCode = :tag', { tag: animalIdOrTag });

    return await query.orderBy('evaluation.evaluationDate', 'DESC').getMany();
  }

  // --- 8. DASHBOARD STATS ---
  async getDashboardStats() {
    const totalAnimals = await this.animalRepository.count();
    const totalEvaluations = await this.evaluationRepository.count();
    
    const pendingEvaluations = await this.animalRepository.createQueryBuilder('animal')
        .leftJoin('animal.dentalEvaluations', 'evaluation') 
        .where('evaluation.id IS NULL')
        .getCount();
    
    const criticalStats = await this.evaluationRepository.createQueryBuilder('eval')
        .innerJoin('eval.teeth', 'tooth')
        .where('tooth.fracture_level >= :level', { level: SeverityScale.SEVERE })
        .orWhere('tooth.pulpitis >= :level', { level: SeverityScale.SEVERE })
        .orWhere('tooth.gingival_recession_level >= :level', { level: SeverityScale.SEVERE })
        .select('COUNT(DISTINCT eval.id)', 'count')
        .getRawOne();
        
    return {
      totalAnimals, totalEvaluations, pendingEvaluations, 
      criticalCases: parseInt(criticalStats?.count || '0', 10),
    };
  }

 // --- 9. UPLOAD ANIMAL  ---
  async createAnimalFromUpload(
    code: string, breed: string, mediaPaths: string[],
    details?: { 
        farm?: string; client?: string; location?: string; collectionDate?: Date; age?: number;
        chip?: string; sisbovNumber?: string; currentWeight?: number; lot?: string; 
        bodyScore?: number; coatColor?: string;
    }
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const animalPayload: DeepPartial<Animal> = {
        tagCode: code, 
        breed: breed, 
        farm: details?.farm, 
        client: details?.client,
        location: details?.location, 
        collectionDate: details?.collectionDate || new Date(), 
        age: details?.age || 24,
        chip: details?.chip,
        sisbovNumber: details?.sisbovNumber,
        currentWeight: details?.currentWeight,
        lot: details?.lot,
        bodyScore: details?.bodyScore,
        coatColor: details?.coatColor,
        status: 'Ativo' // Padrão se não vier
      };

      const newAnimal = this.animalRepository.create(animalPayload);
      const savedAnimal = await queryRunner.manager.save(newAnimal);

      for (const [index, path] of mediaPaths.entries()) {
        const mediaPayload: DeepPartial<Media> = {
          s3UrlPath: path, photoType: index === 0 ? PhotoType.FRONTAL : PhotoType.LATERAL_LEFT, animal: savedAnimal
        };
        const newMedia = this.mediaRepository.create(mediaPayload);
        await queryRunner.manager.save(newMedia);
      }
      await queryRunner.commitTransaction();
      return savedAnimal;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // --- 10. SEED (Simula API Externa) ---
  async seed() {
    const farms = ['Faz. Animaltools', 'Fazenda Santa Fé', 'Agropecuária Boi Gordo'];
    const lots = ['Baia 12', 'Piquet 4', 'Confinamento A', 'Lote Engorda 03'];
    const breeds = ['Nelore', 'Angus', 'Brahman', 'Senepol'];
    const coatColors = ['Branca', 'Preta', 'Vermelha', 'Mestiça'];
    
    for (let i = 0; i < 3; i++) {
        const randomNum = Math.floor(Math.random() * 9000) + 1000;
        const tag = `${randomNum}${Math.random() > 0.5 ? 'G' : 'F'}`; 
        
        const breed = breeds[Math.floor(Math.random() * breeds.length)];
        const farm = farms[Math.floor(Math.random() * farms.length)];
        const lot = lots[Math.floor(Math.random() * lots.length)];
        const color = coatColors[Math.floor(Math.random() * coatColors.length)];
        
        const weight = 200 + Math.floor(Math.random() * 400);
        const score = (Math.random() * (5 - 1) + 1).toFixed(1);
        
        const chip = Math.floor(Math.random() * 1000000000000000).toString();
        const sisbov = Math.floor(Math.random() * 1000000000000000).toString();

        await this.createAnimalFromUpload(
            tag, 
            breed, 
            ['https://img.freepik.com/fotos-gratis/vacas-no-curral-da-fazenda-de-carne_181624-52327.jpg'], 
            { 
                farm: farm, 
                client: 'Cliente API Teste', 
                location: lot.split(' ')[0], 
                lot: lot, 
                collectionDate: new Date(), 
                age: 18 + Math.floor(Math.random() * 36), 
                chip: chip,
                sisbovNumber: sisbov,
                currentWeight: weight + 0.5,
                bodyScore: Number(score),
                coatColor: color
            }
        );
    }
    
    return { message: `✅ Seed executado: 3 animais realistas criados com sucesso!` };
  }

  // --- HELPER PRIVADO ---
  private async createDefaultHealthyTeeth(evaluation: DentalEvaluation) {
      const teethCodes = Object.values(ToothCode);
      const teethEntities = teethCodes.map(code => this.toothRepository.create({
          evaluation, toothCode: code, toothType: ToothType.DECIDUOUS, fractureLevel: SeverityScale.NONE, isPresent: true
      }));
      await this.toothRepository.save(teethEntities);
  }

  // --- 11. RELATÓRIOS (ATUALIZADO) ---
  async getReportStats(filterFarm?: string, filterClient?: string, startDate?: string, endDate?: string) {
    // 1. QUERY BASE (Filtros Comuns)
    const baseQuery = this.evaluationRepository.createQueryBuilder('evaluation')
        .leftJoin('evaluation.animal', 'animal')
        .leftJoin('evaluation.teeth', 'tooth');

    if (filterFarm && filterFarm !== 'all') baseQuery.andWhere('animal.farm ILIKE :farm', { farm: `%${filterFarm}%` });
    if (filterClient && filterClient !== 'all') baseQuery.andWhere('animal.client ILIKE :client', { client: `%${filterClient}%` });

    if (startDate && endDate) {
        const start = new Date(startDate); start.setHours(0, 0, 0, 0);
        const end = new Date(endDate); end.setHours(23, 59, 59, 999);
        baseQuery.andWhere('evaluation.evaluationDate BETWEEN :start AND :end', { start, end });
    }

    // 2. DADOS PARA CLASSIFICAÇÃO (Healthy / Moderate / Critical)
    const classificationQuery = baseQuery.clone();
    const evaluationsData = await classificationQuery
        .select([
            'evaluation.id',
            'MAX(tooth.fracture_level) as max_fracture', 
            'MAX(tooth.pulpitis) as max_pulpitis',
            'MAX(tooth.gingival_recession_level) as max_recession', 
            'MAX(tooth.crown_reduction_level) as max_crown',
            'MAX(tooth.dental_calculus) as max_calculus', 
            'MAX(tooth.periodontal_lesions) as max_periodontal',
            'MAX(tooth.lingual_wear) as max_lingual', 
            'MAX(tooth.caries) as max_caries',
            'MAX(tooth.vitrified_border) as max_vitrified', 
            'MAX(tooth.pulp_chamber_exposure) as max_exposure',
            'MAX(tooth.gingivitis_edema) as max_edema'
        ])
        .groupBy('evaluation.id')
        .getRawMany();

    let healthy = 0, moderate = 0, critical = 0;

    evaluationsData.forEach(ev => {
        // Converte tudo para número para evitar erros de tipo
        const fracture = Number(ev.max_fracture || 0);
        const pulpitis = Number(ev.max_pulpitis || 0);
        const recession = Number(ev.max_recession || 0);
        const exposure = Number(ev.max_exposure || 0);     // Adicionado
        const periodontal = Number(ev.max_periodontal || 0); // Adicionado

        // CRITÉRIO DE CRITICIDADE AJUSTADO:
        if (fracture >= 2 || pulpitis >= 2 || recession >= 3 || exposure > 0 || periodontal >= 3) {
            critical++;
        } else {
            // Verifica se tem QUALQUER outra patologia menor
            const values = [
                fracture, pulpitis, recession,
                Number(ev.max_crown || 0), Number(ev.max_calculus || 0), periodontal, Number(ev.max_lingual || 0),
                Number(ev.max_caries || 0), Number(ev.max_vitrified || 0), exposure, Number(ev.max_edema || 0)
            ];
            // Se tiver qualquer valor >= 1, é Moderado. Se tudo for 0, é Saudável.
            if (values.some(v => v >= 1)) moderate++; else healthy++;
        }
    });

    // 3. ESTATÍSTICAS GERAIS (CONTAGEM POR PATOLOGIA)
    const total = evaluationsData.length;
    const statsQuery = baseQuery.clone();
    
    const stats = await statsQuery
        .select([
            'COUNT(DISTINCT CASE WHEN tooth.fracture_level > 0 THEN evaluation.id END) as fractures',
            'COUNT(DISTINCT CASE WHEN tooth.pulpitis > 0 THEN evaluation.id END) as pulpitis',
            'COUNT(DISTINCT CASE WHEN tooth.gingival_recession_level > 0 THEN evaluation.id END) as recession',
            'COUNT(DISTINCT CASE WHEN tooth.crown_reduction_level > 0 THEN evaluation.id END) as crown_reduction',
            'COUNT(DISTINCT CASE WHEN tooth.dental_calculus > 0 THEN evaluation.id END) as calculus',
            'COUNT(DISTINCT CASE WHEN tooth.periodontal_lesions > 0 THEN evaluation.id END) as periodontal',
            'COUNT(DISTINCT CASE WHEN tooth.lingual_wear > 0 THEN evaluation.id END) as lingual_wear',
            'COUNT(DISTINCT CASE WHEN tooth.caries > 0 THEN evaluation.id END) as caries',
            'COUNT(DISTINCT CASE WHEN tooth.vitrified_border > 0 THEN evaluation.id END) as vitrified_border',
            'COUNT(DISTINCT CASE WHEN tooth.pulp_chamber_exposure > 0 THEN evaluation.id END) as pulp_exposure',
            'COUNT(DISTINCT CASE WHEN tooth.gingivitis_edema > 0 THEN evaluation.id END) as gingivitis_edema',
        ])
        .getRawOne();

    const safeStats = stats || {}; 
    const totalLesions = Object.values(safeStats).reduce((acc: number, val) => acc + Number(val || 0), 0) as number;

    // --- 4. TOP 5 ANIMAIS CRÍTICOS ---
    const criticalAnimalsQuery = this.evaluationRepository.createQueryBuilder('evaluation')
        .leftJoinAndSelect('evaluation.animal', 'animal')
        .leftJoinAndSelect('evaluation.teeth', 'tooth')
        .where('1=1'); 

    if (filterFarm && filterFarm !== 'all') criticalAnimalsQuery.andWhere('animal.farm ILIKE :farm', { farm: `%${filterFarm}%` });
    if (filterClient && filterClient !== 'all') criticalAnimalsQuery.andWhere('animal.client ILIKE :client', { client: `%${filterClient}%` });
    if (startDate && endDate) {
        const start = new Date(startDate); start.setHours(0, 0, 0, 0);
        const end = new Date(endDate); end.setHours(23, 59, 59, 999);
        criticalAnimalsQuery.andWhere('evaluation.evaluationDate BETWEEN :start AND :end', { start, end });
    }

    criticalAnimalsQuery.andWhere(
        '(tooth.fracture_level >= 2 OR tooth.pulpitis >= 2 OR tooth.pulp_chamber_exposure > 0 OR tooth.periodontal_lesions >= 3)'
    );

    const topCritical = await criticalAnimalsQuery
        .orderBy('tooth.fractureLevel', 'DESC')     
        .addOrderBy('tooth.pulpitis', 'DESC')         
        .addOrderBy('tooth.pulpChamberExposure', 'DESC') 
        .take(5)
        .getMany();

    const criticalList = topCritical.map(ev => {
        const badTooth = ev.teeth.find(t => 
            t.fractureLevel >= 2 || t.pulpitis >= 2 || t.pulpChamberExposure > 0 || t.periodontalLesions >= 3
        );

        let mainIssue = 'Patologia Diversa';
        if (badTooth) {
            if (badTooth.fractureLevel >= 2) mainIssue = `Fratura Grau ${badTooth.fractureLevel} (Dente ${badTooth.toothCode})`;
            else if (badTooth.pulpitis >= 2) mainIssue = `Pulpite Grau ${badTooth.pulpitis} (Dente ${badTooth.toothCode})`;
            else if (badTooth.pulpChamberExposure > 0) mainIssue = `Exp. Câmara Pulpar (Dente ${badTooth.toothCode})`;
            else if (badTooth.periodontalLesions >= 3) mainIssue = `Lesão Periodontal G${badTooth.periodontalLesions}`;
        }

        return {
            id: ev.animal.id,
            tag: ev.animal.tagCode,
            farm: ev.animal.farm,
            location: ev.animal.location || 'N/I',
            diagnosis: mainIssue,
            date: ev.evaluationDate 
        };
    });

    return {
        general: {
            total, healthy, moderate, critical, totalLesions,
            healthyPercentage: total ? ((healthy / total) * 100).toFixed(1) : '0.0',
            moderatePercentage: total ? ((moderate / total) * 100).toFixed(1) : '0.0',
            criticalPercentage: total ? ((critical / total) * 100).toFixed(1) : '0.0',
        },
        pathologies: {
            fraturas: { label: 'Fraturas', count: Number(safeStats.fractures || 0), key: 'fracture' },
            pulpite: { label: 'Pulpite', count: Number(safeStats.pulpitis || 0), key: 'pulpitis' },
            recessao: { label: 'Recessão Gengival', count: Number(safeStats.recession || 0), key: 'recession' },
            reducao: { label: 'Redução de Coroa', count: Number(safeStats.crown_reduction || 0), key: 'crown' },
            calculo: { label: 'Cálculo Dentário', count: Number(safeStats.calculus || 0), key: 'calculus' },
            periodontal: { label: 'Lesões Periodontais', count: Number(safeStats.periodontal || 0), key: 'periodontal' },
            desgaste: { label: 'Desgaste Lingual', count: Number(safeStats.lingual_wear || 0), key: 'lingual' },
            carie: { label: 'Cáries', count: Number(safeStats.caries || 0), key: 'carie' },
            vitrificado: { label: 'Bordo Vitrificado', count: Number(safeStats.vitrified_border || 0), key: 'vitrified' },
            exposicao: { label: 'Exp. Câmara Pulpar', count: Number(safeStats.pulp_exposure || 0), key: 'exposure' },
            edema: { label: 'Edema Gengival', count: Number(safeStats.gingivitis_edema || 0), key: 'edema' },
        },
        criticalAnimals: criticalList
    };
  }
}