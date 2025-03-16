import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios'; // Importe do @nestjs/axios
import { BanksController } from './banks.controller';
import { BanksService } from './banks.service';

@Module({
  imports: [HttpModule], // Importe o HttpModule aqui
  controllers: [BanksController],
  providers: [BanksService],
})
export class BanksModule {}