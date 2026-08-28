import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import compression from 'compression';
import { join } from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: true,
  });

  // Gzip Response Compression
  app.use(compression());

  // Serve static files (CDN) with cache headers
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
    maxAge: '7d',
    immutable: true,
  });

  // Global Interceptor
  app.useGlobalInterceptors(new TransformInterceptor());

  // Global Exception Filter
  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      stopAtFirstError: true,
    }),
  );
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, postman) or matching origins
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://maruftech.online',
        'https://course-selling-platform-pfny.vercel.app',
        'https://course-selling-platform-pfny.vercel.app/',
        'https://course-selling-platform-red.vercel.app',
        'https://course-selling-platform-red.vercel.app/',
        'https://www.maruftech.online',
      ];
      if (!origin || allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all Vercel origins smoothly
      }
    },
    credentials: true,
  });

  const port = 5001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
