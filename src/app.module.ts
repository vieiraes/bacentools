import { Module } from '@nestjs/common';
import { BanksModule } from './modules/banks/banks.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BanksModule, // Mantém apenas o módulo Banks
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
