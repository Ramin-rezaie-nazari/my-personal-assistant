import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MemoryIntelligenceService } from '../services/memory-intelligence.service';
import { MemoryType } from '../models/memory.model';

interface AuthenticatedRequest {
  user: {
    id: string;
  };
}

interface RememberMemoryBody {
  type: MemoryType;
  key: string;
  value: unknown;
  importance?: number;
}

@Controller('memory-intelligence')
@UseGuards(AuthGuard('jwt'))
export class MemoryIntelligenceController {
  constructor(
    private readonly memoryIntelligenceService: MemoryIntelligenceService,
  ) {}

  @Post()
  async remember(
    @Req() req: AuthenticatedRequest,
    @Body() body: RememberMemoryBody,
  ) {
    const now = new Date();
    const memory = {
      id: crypto.randomUUID(),
      userId: req.user.id,
      type: body.type,
      key: body.key,
      value: body.value,
      importance: body.importance ?? 0.5,
      createdAt: now,
      updatedAt: now,
    };

    await this.memoryIntelligenceService.remember(memory);
    return memory;
  }

  @Get()
  getMemories(@Req() req: AuthenticatedRequest) {
    return this.memoryIntelligenceService.getMemories(req.user.id);
  }

  @Get('key/:key')
  recallByKey(
    @Req() req: AuthenticatedRequest,
    @Param('key') key: string,
  ) {
    return this.memoryIntelligenceService.recallByKey(key, req.user.id);
  }

  @Get(':id')
  recall(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.memoryIntelligenceService.recall(id, req.user.id);
  }

  @Delete(':id')
  async forget(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    await this.memoryIntelligenceService.forget(id, req.user.id);
    return { success: true };
  }
}
