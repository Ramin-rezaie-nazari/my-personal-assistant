import { BadRequestException, Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RecipeLibraryService } from '../services/recipe-library.service';

type AuthenticatedRequest = { user: { id: string } };

@Controller('recipes')
@UseGuards(JwtAuthGuard)
export class RecipeLibraryController {
  constructor(private readonly library: RecipeLibraryService) {}

  @Get('library')
  list(
    @Req() req: AuthenticatedRequest,
    @Query('page') pageText?: string,
    @Query('pageSize') pageSizeText?: string,
    @Query('q') q?: string,
    @Query('verified') verifiedText?: string,
  ) {
    const page = parseIntQuery(pageText, 'page', 1, 100000);
    const pageSize = parseIntQuery(pageSizeText, 'pageSize', 1, 50);
    const verified = verifiedText === undefined ? undefined : parseBoolean(verifiedText, 'verified');
    return this.library.list(req.user.id, { page, pageSize, q, verified });
  }
}

function parseIntQuery(value: string | undefined, name: string, min: number, max: number) {
  if (!value?.trim()) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new BadRequestException(`${name} must be an integer between ${min} and ${max}`);
  }
  return parsed;
}

function parseBoolean(value: string, name: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  throw new BadRequestException(`${name} must be true or false`);
}
