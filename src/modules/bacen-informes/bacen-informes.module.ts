import { Module } from '@nestjs/common';
import { BacenInformesController } from './bacen-informes.controller';
import { BacenInformesService } from './bacen-informes.service';

@Module({
  controllers: [BacenInformesController],
  providers: [BacenInformesService]
})
export class BacenInformesModule {}
