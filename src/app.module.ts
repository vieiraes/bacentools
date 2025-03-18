import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BanksModule } from './modules/banks/banks.module';
import { PixParticipantsModule } from './modules/pix-participants/pix-participants.module';
import { BacenInformesModule } from './modules/bacen-informes/bacen-informes.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    BanksModule,
    PixParticipantsModule,
    BacenInformesModule
  ],
})
export class AppModule {}
