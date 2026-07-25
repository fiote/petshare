import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { I18nLang } from 'nestjs-i18n';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

  @Get('me')
	async getMe(@CurrentUser() user: CurrentUserPayload) {
		return this.usersService.findById(user.userId);
	}

  @Patch('me')
  async updateMe(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateProfileDto,
    @I18nLang() lang: string
  ) {
  	return this.usersService.updateName(user.userId, dto.name, lang);
  }
}
