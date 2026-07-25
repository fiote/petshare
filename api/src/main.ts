import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
	const webBaseUrl = process.env.WEB_BASE_URL;
	if (!webBaseUrl) {
		throw new Error('WEB_BASE_URL não configurado. Defina a origem exata permitida para CORS.');
	}

	const app = await NestFactory.create<NestExpressApplication>(AppModule);

	app.set('trust proxy', 1);

	app.enableCors({
		origin: webBaseUrl
	});

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true
		})
	);

	app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

	app.setGlobalPrefix('api');

	await app.listen(process.env.PORT ?? 5003);
}
void bootstrap();
