import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MensajeriaModule } from '../mensajeria.module.js';
import { MuertosConsumidor } from './muertos.consumidor.js';
import { MensajeMuerto } from '../../persistencia/mensaje-muerto.entity.js';

@Module({
  imports: [MensajeriaModule, TypeOrmModule.forFeature([MensajeMuerto])],
  providers: [MuertosConsumidor],
})
export class MuertosModule {}