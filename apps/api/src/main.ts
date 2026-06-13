import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('DataBolsa API')
      .setDescription('Portfolio tracker API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  // Health endpoint — público, usado pelo Playwright webServer e probes de infra
  const httpAdapter = app.getHttpAdapter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  httpAdapter.get('/health', (_req: any, res: any) => {
    res.json({ status: 'ok' });
  });

  await app.listen(3001);
}
bootstrap();
