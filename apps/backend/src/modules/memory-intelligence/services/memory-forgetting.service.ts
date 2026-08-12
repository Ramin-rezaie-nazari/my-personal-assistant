import { Injectable } from '@nestjs/common';
import { ForgetRequest, MemoryGoverned } from '../models/memory-governance.model';

@Injectable()
export class MemoryForgettingService {
  matches(request: ForgetRequest, memory: MemoryGoverned): boolean {
    if (request.kind === 'all') return true;
    if (request.kind === 'memory') return request.memoryIds.includes(memory.memoryId);
    if (request.kind === 'topic') return memory.topicKeys.includes(request.topicKey);
    return memory.createdAt >= request.from && memory.createdAt <= request.to;
  }

  forget(request: ForgetRequest, memories: MemoryGoverned[]): MemoryGoverned[] {
    return memories.filter((memory) => !this.matches(request, memory));
  }

  forgetForUser(userId: string, request: ForgetRequest, memories: MemoryGoverned[]): MemoryGoverned[] {
    return memories.filter((memory) => memory.userId !== userId || !this.matches(request, memory));
  }
}
