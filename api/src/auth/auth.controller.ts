import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { I18nLang } from 'nestjs-i18n';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ConfirmEmailDto } from './dto/confirm-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { IsEmail } from 'class-validator';

class ResendConfirmationDto {
  @IsEmail()
  	email: string;
}

const AUTH_THROTTLE = { default: { ttl: 60_000, limit: 5 } };

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle(AUTH_THROTTLE)
	register(@Body() dto: RegisterDto, @I18nLang() lang: string) {
		return this.authService.register(dto, lang);
	}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle(AUTH_THROTTLE)
  login(@Body() dto: LoginDto, @I18nLang() lang: string) {
  	return this.authService.login(dto, lang);
  }

  @Post('confirm-email')
  @HttpCode(HttpStatus.OK)
  @Throttle(AUTH_THROTTLE)
  confirmEmail(@Body() dto: ConfirmEmailDto, @I18nLang() lang: string) {
  	return this.authService.confirmEmail(dto.token, lang);
  }

  @Post('resend-confirmation')
  @HttpCode(HttpStatus.OK)
  @Throttle(AUTH_THROTTLE)
  resendConfirmation(@Body() dto: ResendConfirmationDto, @I18nLang() lang: string) {
  	return this.authService.resendConfirmation(dto.email, lang);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle(AUTH_THROTTLE)
  forgotPassword(@Body() dto: ForgotPasswordDto, @I18nLang() lang: string) {
  	return this.authService.forgotPassword(dto, lang);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle(AUTH_THROTTLE)
  resetPassword(@Body() dto: ResetPasswordDto, @I18nLang() lang: string) {
  	return this.authService.resetPassword(dto, lang);
  }
}
