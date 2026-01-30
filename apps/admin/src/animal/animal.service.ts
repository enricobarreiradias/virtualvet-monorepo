import { Injectable, HttpException, NotFoundException, Logger, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, DeepPartial } from 'typeorm';
import axios from 'axios';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { CreateAnimalDto } from './dto/create-animal.dto';
import { UpdateAnimalDto } from './dto/update-animal.dto';
import { Animal } from '../../../../libs/data/src/entities/animal.entity';
import { Media } from '../../../../libs/data/src/entities/media.entity'; 
import { PhotoType } from '../../../../libs/data/src/enums/dental-evaluation.enums'; 
import { AuditService } from '../audit/audit.service';
import { User } from '../../../../libs/data/src/entities/user.entity';

@Injectable()
export class AnimalService {
  private readonly logger = new Logger(AnimalService.name);
  private s3Client: S3Client;
  private readonly bucketName = process.env.AWS_S3_BUCKET_NAME || 'animaltools-media';

  constructor(
    @InjectRepository(Animal)
    private animalRepository: Repository<Animal>,

    @InjectRepository(Media) 
    private mediaRepository: Repository<Media>,

    private dataSource: DataSource,
    private auditService: AuditService, // Mantido apenas para o SYNC
  ) {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }

  // --- PROCESSAR WEBHOOK ---
  async processWebhook(data: any) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        const tagCode = data['n_do_Animal'] || data['n°_do_Animal'];
        const sisbov = data['n_do_SISBOV'] || data['n°_do_SISBOV'];

        let entryDate = new Date(); 

        const dateStr = data['data_de_entrada_criado'];
        const timeStr = data['horario_de_entrada_criado'] || data['horário_de_entrada_criado'] || '00:00:00';
        
        if (dateStr) {
            const fullDateString = `${dateStr}T${timeStr}`;
            const parsedDate = new Date(fullDateString);
            
            if (!isNaN(parsedDate.getTime())) {
                entryDate = parsedDate;
            }
        }

        const mappedData: DeepPartial<Animal> = {
            tagCode: tagCode, 
            chip: data['chip'],
            sisbovNumber: sisbov,
            externalCategoryId: data['categoria_id'],
            category: data['nome_categoria_id'],
            externalBreedId: data['raca_id'],
            breed: data['nome_raca_id'], 
            externalCoatId: data['pelagem_id'],
            coatColor: data['nome_pelagem_id'],
            currentWeight: data['peso_atual'] ? Number(data['peso_atual']) : 0,
            bodyScore: data['score'] ? Number(data['score']) : 0,
            
            externalCostCenterId: data['centro_de_custo_id'],
            farm: data['nome_centro_de_custo_id'],
            externalStockLocationId: data['local_de_estoque_id'],
            location: data['nome_local_de_estoque_id'],
            externalLotId: data['lote_id'],
            lot: data['nome_lote_id'],
            
            birthDate: data['data_de_nascimento'] ? new Date(data['data_de_nascimento']) : undefined,
            status: data['status'] || 'Ativo',
            
            collectionDate: entryDate, 
            entryDate: entryDate,

            externalModificationDate: data['data_de_entrada_modificado'] 
              ? new Date(data['data_de_entrada_modificado']) 
              : undefined,
        };

        let animal: Animal | null = null;
        let actionType = 'CREATED'; 

        // Upsert via SISBOV
        if (mappedData.sisbovNumber) {
            animal = await queryRunner.manager.findOne(Animal, { 
                where: { sisbovNumber: mappedData.sisbovNumber } 
            });
        }
        // Upsert via CHIP (Lógica de Teste)
        if (!animal && mappedData.chip) {
             animal = await queryRunner.manager.findOne(Animal, { 
                where: { chip: mappedData.chip } 
            });
            
            if (animal) {
                this.logger.warn(`Animal encontrado pelo CHIP (${mappedData.chip}) em vez do SISBOV.`);
            }
        }

        if (animal) {
            Object.assign(animal, mappedData);
            actionType = 'UPDATED'; 
        } else {
            animal = queryRunner.manager.create(Animal, mappedData);
            actionType = 'CREATED'; 
        }

        const savedAnimal = await queryRunner.manager.save(animal);

        // --- TRATAMENTO DE FOTOS ---
        let photosArray: any[] = [];
        if (data.fotos) {
            if (Array.isArray(data.fotos)) {
                photosArray = data.fotos;
            } else if (typeof data.fotos === 'object') {
                photosArray = Object.values(data.fotos);
            }
        }

        if (photosArray.length > 0) {
            for (const [index, foto] of photosArray.entries()) {
                const link = foto['link_do_driver'];
                
                const existingMedia = await this.mediaRepository.findOne({ 
                    where: { s3UrlPath: link, animal: { id: savedAnimal.id } } 
                });

                // Se a foto ainda não existe no nosso banco...
                if (!existingMedia) {
                    let finalUrl = link; // Começamos com o link do Drive por segurança

                    // LÓGICA DO FLUXO: Drive -> Download -> AWS -> Link AWS
                    if (link.includes('drive.google.com')) {
                        try {
                             // Tenta realizar o processo de migração
                             // Se a conta AWS não estiver configurada, vai dar erro aqui e cair no catch
                             const s3Url = await this.processDriveImageToS3(link, savedAnimal.tagCode, index);
                             
                             // Se deu certo (retornou string), o link final passa a ser o da AWS
                             if (s3Url) {
                                finalUrl = s3Url;
                                this.logger.log(`Imagem migrada para S3: ${finalUrl}`);
                             }
                        } catch (e) {
                            // Se falhar (ex: sem credenciais), loga o aviso mas não para o sistema
                            this.logger.warn(`Upload S3 pendente (usando link original): ${e.message}`);
                        }
                    }

                    // Salva no banco. Se o upload funcionou, 'finalUrl' é AWS. Se não, é Drive.
                    // O Frontend vai ler o que estiver em 's3UrlPath'.
                    const newMedia = this.mediaRepository.create({
                        animal: savedAnimal,
                        s3UrlPath: finalUrl, 
                        originalDriveUrl: link,
                        latitude: foto['latitude'] || foto['latitude_latitude'],
                        longitude: foto['longitude'] || foto['latitude_longitude'],
                        photoType: index === 0 ? PhotoType.FRONTAL : PhotoType.LATERAL_LEFT,
                    });
                    
                    await queryRunner.manager.save(newMedia);
                }
            }
        }

        await queryRunner.commitTransaction();

        return { 
            action: actionType, 
            id: savedAnimal.id,
            tag: savedAnimal.tagCode
        };

    } catch (err) {
        await queryRunner.rollbackTransaction();
        this.logger.error(`Erro no Webhook: ${err.message}`);
        throw new HttpException('Erro ao processar dados externos', HttpStatus.BAD_REQUEST);
    } finally {
        await queryRunner.release();
    }
  }

  // --- SINCRONIZAÇÃO PULL (Mantém logs personalizados) ---
  async syncFromExternalApi(start?: string, end?: string) {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    const dtInit = start || formatDate(sevenDaysAgo);
    const dtEnd = end || formatDate(today);
    
    const url = `https://apicatwork.gerenteboviplan.com.br/animals_in?client=animaltools&dt_init=${dtInit}&dt_end=${dtEnd}`;

    this.logger.log(`🔄 Iniciando sincronização: ${url}`);

    // LOG DE INÍCIO - Mantido pois é uma ação de sistema importante
    await this.auditService.log(
        'SYNC_START',
        'ExternalApi',
        'SISBOV', 
        null, 
        `Iniciando sincronização do período: ${dtInit} a ${dtEnd}`
    );
    
    try {
      const response = await axios.get(url);
      const externalAnimals = response.data.data || response.data;

      if (!Array.isArray(externalAnimals)) {
        throw new Error('Formato inválido: esperava um array em "data" ou na raiz.');
      }

      let countTotal = 0;
      let countCreated = 0;
      let countUpdated = 0;

      for (const item of externalAnimals) {
        const result = await this.processWebhook(item);
        countTotal++;
        if (result.action === 'CREATED') countCreated++;
        if (result.action === 'UPDATED') countUpdated++;
      }

      const details = `Sincronização concluída. Total: ${countTotal}. Novos: ${countCreated}. Atualizados: ${countUpdated}.`;

      // LOG DE SUCESSO - Mantido com estatísticas detalhadas
      await this.auditService.log(
          'SYNC_SUCCESS',
          'ExternalApi',
          'SISBOV',
          null,
          details
      );

      return { 
          message: `✅ Sincronização concluída!`,
          period: `${dtInit} a ${dtEnd}`,
          stats: { total: countTotal, created: countCreated, updated: countUpdated }
      };

    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
             return { message: 'Nenhum animal encontrado ou alterado neste período.', period: `${dtInit} a ${dtEnd}` };
        }
        
        // LOG DE ERRO - Mantido
        await this.auditService.log(
            'SYNC_ERROR',
            'ExternalApi',
            'SISBOV',
            null,
            `Falha na sincronização: ${error.message}`
        );
        throw new HttpException(`Falha na API Externa: ${error.message}`, HttpStatus.BAD_GATEWAY);
    }
  }

  // --- MÉTODOS CRUD PADRÃO ---

  create(createAnimalDto: CreateAnimalDto) {
    const animal = this.animalRepository.create(createAnimalDto);
    return this.animalRepository.save(animal);
    // Interceptor gravará CREATE_ANIMAL automaticamente
  }

  findAll() {
    return this.animalRepository.find();
  }

  async findOne(id: number) {
    const animal = await this.animalRepository.findOne({
      where: { id },
      relations: ['mediaFiles'],
    });

    if (!animal) {
      throw new NotFoundException(`Animal com ID ${id} não encontrado.`);
    }

    const geoMedia = animal.mediaFiles?.find(m => m.latitude && m.longitude);
    const coordinates = geoMedia 
      ? { lat: geoMedia.latitude, lng: geoMedia.longitude } 
      : undefined;

    return {
      ...animal,
      id: animal.id.toString(),
      code: animal.tagCode, 
      coordinates: coordinates,
      media: animal.mediaFiles?.map(m => ({
         s3UrlPath: m.s3UrlPath,
         originalDriveUrl: m.originalDriveUrl,
         latitude: m.latitude,
         longitude: m.longitude
      })) || [],
    };
  }

  async update(id: number, updateAnimalDto: UpdateAnimalDto, user: User) {
    const animal = await this.animalRepository.findOne({ where: { id } });
    if (!animal) throw new NotFoundException(`Animal com ID ${id} não encontrado.`);

    await this.animalRepository.update(id, updateAnimalDto);
    
    // REMOVIDO: await this.auditService.log(...) 
    // O Interceptor captura o PATCH/PUT e loga automaticamente
    
    return this.findOne(id);
  }

  async remove(id: number, user: User) {
    const animalEntity = await this.animalRepository.findOneBy({ id });
    if (!animalEntity) {
        throw new NotFoundException(`Animal #${id} não encontrado.`);
    }
    
    await this.animalRepository.remove(animalEntity);

    // REMOVIDO: await this.auditService.log(...)
    // O Interceptor captura o DELETE e loga automaticamente
    
    return animalEntity;
  }

  async findUniqueFarms() {
    return this.animalRepository.createQueryBuilder('animal')
      .select('DISTINCT animal.farm', 'farm')
      .where('animal.farm IS NOT NULL')
      .orderBy('animal.farm', 'ASC')
      .getRawMany()
      .then(res => res.map(f => f.farm));
  }

  async findUniqueClients() {
    return this.animalRepository.createQueryBuilder('animal')
      .select('DISTINCT animal.client', 'client')
      .where("animal.client IS NOT NULL AND animal.client != ''")
      .orderBy('animal.client', 'ASC')
      .getRawMany()
      .then(res => res.map(c => c.client));
  }

  // --- S3 HELPER ---
  private async processDriveImageToS3(driveLink: string, animalCode: string, index: number): Promise<string> {
      const fileIdMatch = driveLink.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (!fileIdMatch) return '';
      
      const fileId = fileIdMatch[1];
      const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

      const response = await axios({
          url: downloadUrl,
          method: 'GET',
          responseType: 'arraybuffer' 
      });

      const fileName = `integrations/${animalCode}-${Date.now()}-${index}.jpg`;

      await this.s3Client.send(new PutObjectCommand({
          Bucket: this.bucketName,
          Key: fileName,
          Body: response.data,
          ContentType: 'image/jpeg',
          ACL: 'public-read' 
      }));

      return `https://${this.bucketName}.s3.amazonaws.com/${fileName}`;
  }
}