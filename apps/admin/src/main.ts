import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'; 
import { ValidationPipe } from '@nestjs/common'; 

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.setGlobalPrefix('api'); 

  app.useGlobalPipes(new ValidationPipe({
      whitelist: true, 
      forbidNonWhitelisted: false, 
      transform: true, 
    }));

  const config = new DocumentBuilder()
    .setTitle('AnimalTools Admin API')
    .setDescription('API para gestão de avaliações de saúde bucal bovina')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3333);
  console.log('API Admin rodando em http://localhost:3333');
  console.log('Swagger disponível em http://localhost:3333/api'); 
}
bootstrap();