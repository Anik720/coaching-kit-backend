import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
   app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    // Don't forbid non-whitelisted fields for now
    forbidNonWhitelisted: false,
    // Don't fail on missing fields since we want to allow incomplete submissions
    skipMissingProperties: true,
  }));
}
bootstrap();
