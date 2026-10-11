import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuditoriaModule } from './mensajeria/consumidores/auditoria.module.js';
import { AvisosModule } from './mensajeria/consumidores/avisos.module.js';
import { CorreosModule } from './mensajeria/consumidores/correos.module.js';
import { MensajeriaModule } from './mensajeria/mensajeria.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MensajeriaModule,
    AuditoriaModule,
    AvisosModule,
    CorreosModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}