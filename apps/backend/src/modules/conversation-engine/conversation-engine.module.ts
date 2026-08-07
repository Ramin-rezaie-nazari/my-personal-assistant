import { Module } from '@nestjs/common';

import { ConversationStyleService } from './services/conversation-style.service';

@Module({
  providers: [ConversationStyleService],
  exports: [ConversationStyleService],
})
export class ConversationEngineModule {}
