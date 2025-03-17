import { Module } from '@nestjs/common';
import { PixParticipantsController } from './pix-participants.controller';
import { PixParticipantsService } from './pix-participants.service';

@Module({
  controllers: [PixParticipantsController],
  providers: [PixParticipantsService],
})
export class PixParticipantsModule {}
