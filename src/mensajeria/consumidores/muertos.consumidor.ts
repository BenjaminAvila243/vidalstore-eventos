import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConsumeMessage } from 'amqplib';
import { Repository } from 'typeorm';
import { MensajeriaService } from '../mensajeria.service.js';
import { DLQ } from '../topologia.js';
import { MensajeMuerto } from '../../persistencia/mensaje-muerto.entity.js';

type MuerteRabbit = {
  queue: string;
  reason: string;
  count?: number;
};

@Injectable()
export class MuertosConsumidor implements OnModuleInit {
  private readonly log = new Logger(MuertosConsumidor.name);

  constructor(
    private readonly mensajeria: MensajeriaService,
    @InjectRepository(MensajeMuerto) private readonly repo: Repository<MensajeMuerto>,
  ) {}

  async onModuleInit(): Promise<void> {
    const canal = this.mensajeria.canal;

    for (const dlq of Object.values(DLQ)) {
      await canal.consume(
        dlq,
        (mensaje: ConsumeMessage | null) => {
          if (!mensaje) return;
          void this.procesar(dlq, mensaje);
        },
        { noAck: false },
      );
    }

    this.log.log(`escuchando las DLQ: ${Object.values(DLQ).join(', ')}`);
  }

  private async procesar(dlq: string, mensaje: ConsumeMessage): Promise<void> {
    const canal = this.mensajeria.canal;

    const muertes = (mensaje.properties.headers?.['x-death'] ?? []) as MuerteRabbit[];
    const ultimaMuerte = muertes[0];

    const colaOrigen = ultimaMuerte?.queue ?? 'desconocida';
    const motivo = ultimaMuerte?.reason ?? 'desconocido';
    const intentos = ultimaMuerte?.count ?? 1;
    const payload = mensaje.content.toString();

    try {
      await this.repo.insert({
        colaOrigen,
        routingKey: mensaje.fields.routingKey,
        motivo,
        intentos,
        payload,
      });

      this.log.warn(
        `mensaje muerto en ${dlq} | cola de origen ${colaOrigen} | motivo ${motivo} | intentos ${intentos} | guardado en mensajes_muertos`,
      );
      canal.ack(mensaje);
    } catch (error) {
      // Si Postgres no responde, NO se hace ack: se devuelve a su propia DLQ con nack + requeue.
      this.log.error(`no se pudo guardar el mensaje muerto: ${(error as Error).message}`);
      canal.nack(mensaje, false, true);
    }
  }
}