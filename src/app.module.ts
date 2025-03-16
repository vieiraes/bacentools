import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { BanksModule } from './modules/banks/banks.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    BanksModule, // Isso já importa o BanksController e BanksService
  ],
  controllers: [], // Remova BanksController daqui
  providers: [],   // Remova BanksService daqui
})
export class AppModule {}
