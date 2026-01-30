import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, IsDateString } from 'class-validator';
import { Type, Expose } from 'class-transformer';

export class ExternalPhotoDto {
  @Expose({ name: 'foto_id' }) 
  @IsNumber()
  photoId: number;

  @Expose({ name: 'link_do_driver' })
  @IsString()
  driveLink: string;

  // Atualizado para aceitar o novo padrão "latitude"
  @Expose({ name: 'latitude' }) 
  @IsNumber()
  @IsOptional()
  latitude?: number;

  // Mantendo o antigo como opcional caso a API reverter
  @Expose({ name: 'latitude_latitude' }) 
  @IsNumber()
  @IsOptional()
  latitudeOld?: number;

  @Expose({ name: 'longitude' })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @Expose({ name: 'latitude_longitude' })
  @IsNumber()
  @IsOptional()
  longitudeOld?: number;
}

export class ExternalAnimalDto {
  @Expose({ name: 'n°_do_Animal' }) 
  @IsString()
  tagCode: string;

  @Expose({ name: 'chip' })
  @IsString()
  @IsOptional()
  chip?: string;

  @Expose({ name: 'n°_do_SISBOV' })
  @IsString()
  @IsOptional()
  sisbov?: string;


  @Expose({ name: 'categoria_id' })
  @IsNumber()
  @IsOptional()
  categoryId?: number;

  @Expose({ name: 'nome_categoria_id' })
  @IsString()
  @IsOptional()
  categoryName?: string;

  @Expose({ name: 'data_de_nascimento' })
  @IsDateString() 
  @IsOptional()
  birthDate?: string;

  @Expose({ name: 'raca_id' })
  @IsNumber()
  @IsOptional()
  breedId?: number;

  @Expose({ name: 'nome_raca_id' })
  @IsString()
  @IsOptional()
  breedName?: string;

  @Expose({ name: 'pelagem_id' })
  @IsNumber()
  @IsOptional()
  coatId?: number;

  @Expose({ name: 'nome_pelagem_id' })
  @IsString()
  @IsOptional()
  coatName?: string;

  @Expose({ name: 'peso_atual' })
  @IsNumber()
  @IsOptional()
  weight?: number;

  @Expose({ name: 'score' })
  @IsNumber()
  @IsOptional()
  score?: number;

  @Expose({ name: 'nome_centro_de_custo_id' })
  @IsString()
  @IsOptional()
  farmName?: string;

  @Expose({ name: 'nome_local_de_estoque_id' })
  @IsString()
  @IsOptional()
  locationName?: string;

  @Expose({ name: 'nome_lote_id' })
  @IsString()
  @IsOptional()
  lotName?: string;

  @Expose({ name: 'centro_de_custo_id' })
  @IsNumber()
  @IsOptional()
  costCenterId?: number; 

  @Expose({ name: 'local_de_estoque_id' })
  @IsNumber()
  @IsOptional()
  stockLocationId?: number; 

  @Expose({ name: 'lote_id' })
  @IsNumber()
  @IsOptional()
  lotId?: number; 

  @Expose({ name: 'data_de_entrada_modificado' })
  @IsString()
  @IsOptional()
  modificationDateRaw?: string; 

  @Expose({ name: 'horário_de_entrada_modificado' })
  @IsString()
  @IsOptional()
  modificationTimeRaw?: string; 

  @Expose({ name: 'data_de_entrada_criado' })
  @IsString()
  @IsOptional()
  entryDateRaw?: string;

  @Expose({ name: 'horário_de_entrada_criado' })
  @IsString()
  @IsOptional()
  entryTimeRaw?: string;

  @Expose({ name: 'status' })
  @IsString()
  @IsOptional()
  status?: string;

  @Expose({ name: 'fotos' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExternalPhotoDto)
  photos: ExternalPhotoDto[];
}