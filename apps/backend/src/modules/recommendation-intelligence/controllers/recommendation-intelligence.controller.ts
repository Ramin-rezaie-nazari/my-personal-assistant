import { BadRequestException, Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateRecommendationDto } from '../dto/create-recommendation.dto';
import { RecommendationEngineService } from '../services/recommendation-engine.service';

@Controller('recommendation-intelligence')
@UseGuards(JwtAuthGuard)
export class RecommendationIntelligenceController {
  constructor(private readonly engine: RecommendationEngineService) {}

  @Post('food')
  generateFoodRecommendations(
    @Request() req: { user: { id: string } },
    @Body() dto: CreateRecommendationDto,
  ) {
    validateRequest(dto);
    return this.engine.generateRecommendations(req.user.id, dto);
  }
}

function validateRequest(dto: CreateRecommendationDto): void {
  if (!Number.isInteger(dto.targetServings) || dto.targetServings <= 0 || dto.targetServings > 10000) {
    throw new BadRequestException('targetServings must be an integer between 1 and 10000');
  }
  for (const [name, value] of [
    ['maxCalories', dto.maxCalories],
    ['minProteinGrams', dto.minProteinGrams],
    ['maxMissingIngredients', dto.maxMissingIngredients],
  ] as const) {
    if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
      throw new BadRequestException(`${name} must be a non-negative number`);
    }
  }
  if (dto.maxMissingIngredients !== undefined && !Number.isInteger(dto.maxMissingIngredients)) {
    throw new BadRequestException('maxMissingIngredients must be an integer');
  }
  if (dto.countryCode !== undefined && dto.countryCode.trim().length > 8) {
    throw new BadRequestException('countryCode is invalid');
  }
}
