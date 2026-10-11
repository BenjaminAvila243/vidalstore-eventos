import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuditoriaModule } from './mensajeria/consumidores/auditoria.module.js';
import { MensajeriaModule } from './mensajeria/mensajeria.module.js';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), MensajeriaModule, AuditoriaModule],
  controllers: [],
  providers: [],
})
export class AppModule {}