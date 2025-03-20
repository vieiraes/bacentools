import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PixParticipantsController } from './pix-participants.controller';
import { PixParticipantsService } from './pix-participants.service';

@Module({
  imports: [HttpModule],
  controllers: [PixParticipantsController],
  providers: [PixParticipantsService],
})
export class PixParticipantsModule {}
