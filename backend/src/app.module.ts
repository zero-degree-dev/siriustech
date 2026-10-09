import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { DatabaseService } from './database/database.service';
import { CatalogService } from './catalog/catalog.service';
import { ConsultationService } from './chat/consultation.service';
import { ChatService } from './chat/chat.service';
import { ApiController } from './http';
import { McpController } from './mcp/mcp.controller';

@Module({
  imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }])],
  controllers: [ApiController, McpController],
  providers: [DatabaseService, CatalogService, ConsultationService, ChatService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
