import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MensajeriaModule } from '../mensajeria.module.js';
import { CorreosConsumidor } from './correos.consumidor.js';
import { Notificacion } from '../../persistencia/notificacion.entity.js';

@Module({
  imports: [MensajeriaModule, TypeOrmModule.forFeature([Notificacion])],
  providers: [CorreosConsumidor],
})
export class CorreosModule {}