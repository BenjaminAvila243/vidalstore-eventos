import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MensajeriaModule } from './mensajeria/mensajeria.module.js';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), MensajeriaModule],
  controllers: [],
  providers: [],
})
export class AppModule {}