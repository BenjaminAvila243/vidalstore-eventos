import { Module } from '@nestjs/common';
import { MensajeriaModule } from '../mensajeria.module.js';
import { AvisosConsumidor } from './avisos.consumidor.js';

@Module({
  imports: [MensajeriaModule],
  providers: [AvisosConsumidor],
})
export class AvisosModule {}