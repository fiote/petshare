import { BadRequestException,
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Query,
	UseGuards } from '@nestjs/common';
import { I18nLang, I18nService } from 'nestjs-i18n';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { CalendarService } from './calendar.service';
import { PetsService } from '../pets/pets.service';
import { SetDayDto } from './dto/set-day.dto';
import { ListRangeDto } from './dto/list-range.dto';

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

@UseGuards(JwtAuthGuard)
@Controller('pets/:petId/calendar')
export class CalendarController {
	constructor(
    private readonly calendarService: CalendarService,
    private readonly petsService: PetsService,
    private readonly i18n: I18nService
	) {}

  @Get()
	async listRange(
    @CurrentUser() user: CurrentUserPayload,
    @Param('petId') petId: string,
    @Query() query: ListRangeDto,
    @I18nLang() lang: string
	) {
		await this.petsService.assertUserIsTutor(petId, user.userId, lang);
		return this.calendarService.listEntriesInRange(petId, query.from, query.to);
	}

  @Get('stats')
  async getStats(
    @CurrentUser() user: CurrentUserPayload,
    @Param('petId') petId: string,
    @I18nLang() lang: string,
    @Query('today') today?: string
  ) {
  	await this.petsService.assertUserIsTutor(petId, user.userId, lang);
  	const validToday = today && /^\d{4}-\d{2}-\d{2}$/.test(today) ? today : undefined;
  	return this.calendarService.getStats(petId, validToday);
  }

  @Post('days')
  async setDay(
    @CurrentUser() user: CurrentUserPayload,
    @Param('petId') petId: string,
    @Body() dto: SetDayDto,
    @I18nLang() lang: string
  ) {
  	await this.petsService.assertUserIsTutor(petId, user.userId, lang);
  	await this.petsService.assertPetTutorBelongsToPet(petId, dto.petTutorId, lang);
  	return this.calendarService.setDay(petId, dto.petTutorId, dto.date);
  }

  @Delete('days/:date')
  async clearDay(
    @CurrentUser() user: CurrentUserPayload,
    @Param('petId') petId: string,
    @Param('date') date: string,
    @I18nLang() lang: string
  ) {
  	if (!DATE_ONLY_PATTERN.test(date)) {
  		throw new BadRequestException(this.i18n.t('calendar.invalidDate', { lang }));
  	}
  	await this.petsService.assertUserIsTutor(petId, user.userId, lang);
  	await this.calendarService.clearDay(petId, date);
  	return { message: 'ok' };
  }
}
