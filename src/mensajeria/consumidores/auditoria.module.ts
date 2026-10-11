import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MensajeriaModule } from '../mensajeria.module.js';
import { AuditoriaConsumidor } from './auditoria.consumidor.js';
import { EventoAuditoria } from '../../persistencia/evento-auditoria.entity.js';

@Module({
  imports: [MensajeriaModule, TypeOrmModule.forFeature([EventoAuditoria])],
  providers: [AuditoriaConsumidor],
})
export class AuditoriaModule {}