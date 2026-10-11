import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConsumeMessage } from 'amqplib';
import { MensajeriaService } from '../mensajeria.service.js';
import { DLQ } from '../topologia.js';

type MuerteRabbit = {
  queue: string;
  reason: string;
  count?: number;
};

@Injectable()
export class MuertosConsumidor implements OnModuleInit {
  private readonly log = new Logger(MuertosConsumidor.name);

  constructor(private readonly mensajeria: MensajeriaService) {}

  async onModuleInit(): Promise<void> {
    const canal = this.mensajeria.canal;

    for (const dlq of Object.values(DLQ)) {
      await canal.consume(
        dlq,
        (mensaje: ConsumeMessage | null) => {
          if (!mensaje) return;
          this.procesar(dlq, mensaje);
        },
        { noAck: false },
      );
    }

    this.log.log(`escuchando las DLQ: ${Object.values(DLQ).join(', ')}`);
  }

  private procesar(dlq: string, mensaje: ConsumeMessage): void {
    const canal = this.mensajeria.canal;

    // x-death lo agrega RabbitMQ solo, nunca se inventa. Es un arreglo porque un mensaje
    // puede haber muerto mas de una vez, en mas de una cola, por mas de un motivo.
    const muertes = (mensaje.properties.headers?.['x-death'] ?? []) as MuerteRabbit[];
    const ultimaMuerte = muertes[0];

    const colaOrigen = ultimaMuerte?.queue ?? 'desconocida';
    const motivo = ultimaMuerte?.reason ?? 'desconocido';
    const intentos = ultimaMuerte?.count ?? 1;
    const payload = mensaje.content.toString(); // como texto: puede no ser JSON valido

    this.log.warn(
      `mensaje muerto en ${dlq} | cola de origen ${colaOrigen} | motivo ${motivo} | intentos ${intentos} | payload ${payload}`,
    );

    // Aca, mas adelante, se inserta en la tabla mensajes_muertos con TypeORM.
    // Por ahora, el registro es el log.

    canal.ack(mensaje);
  }
}