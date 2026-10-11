import { Module } from '@nestjs/common';
import { MensajeriaModule } from '../mensajeria.module.js';
import { MuertosConsumidor } from './muertos.consumidor.js';

@Module({
  imports: [MensajeriaModule],
  providers: [MuertosConsumidor],
})
export class MuertosModule {}