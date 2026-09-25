import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import helmet from 'helmet';
import { TransformInterceptor } from './common/interceptors/transform/transform.interceptor.js';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());// Sử dụng Helmet để bảo vệ ứng dụng khỏi các lỗ hổng bảo mật phổ biến
  app.enableCors({
    origin: [
    'http://localhost:3000',     
     process.env.FRONTEND_URL,
  ], // Chỉ cho phép domain này
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Các HTTP Method được phép
    allowedHeaders: 'Content-Type, Accept, Authorization', // Các Header được phép gửi lên
    credentials: true, // Cho phép gửi Cookie hoặc Header Authorization
  });

  app.useGlobalInterceptors(new TransformInterceptor());
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
