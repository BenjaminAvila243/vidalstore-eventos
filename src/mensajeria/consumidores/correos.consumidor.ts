import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConsumeMessage } from 'amqplib';
import { MensajeriaService } from '../mensajeria.service.js';
import { COLAS } from '../topologia.js';

@Injectable()
export class CorreosConsumidor implements OnModuleInit {
  private readonly log = new Logger(CorreosConsumidor.name);

  constructor(private readonly mensajeria: MensajeriaService) {}

  async onModuleInit(): Promise<void> {
    const canal = this.mensajeria.canal;

    await canal.consume(
      COLAS.correos,
      (mensaje: ConsumeMessage | null) => {
        if (!mensaje) return;

        const { para, asunto, origen } = JSON.parse(mensaje.content.toString());

        this.log.log(`enviando correo a ${para}: "${asunto}" (origen ${origen})`);

        canal.ack(mensaje);
      },
      { noAck: false },
    );

    this.log.log(`escuchando la cola ${COLAS.correos}`);
  }
}