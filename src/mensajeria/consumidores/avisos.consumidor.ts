import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConsumeMessage } from 'amqplib';
import { MensajeriaService } from '../mensajeria.service.js';
import { COLAS, EXCHANGES, ROUTING_KEYS } from '../topologia.js';

@Injectable()
export class AvisosConsumidor implements OnModuleInit {
  private readonly log = new Logger(AvisosConsumidor.name);

  constructor(private readonly mensajeria: MensajeriaService) {}

  async onModuleInit(): Promise<void> {
    const canal = this.mensajeria.canal;

    await canal.consume(
      COLAS.avisos,
      (mensaje: ConsumeMessage | null) => {
        if (!mensaje) return;

        const evento = JSON.parse(mensaje.content.toString());
        const eventoId = mensaje.properties.headers?.['x-evento-id'];

        this.log.log(`${mensaje.fields.routingKey} | aviso para ${evento.usuarioSub ?? 'nadie'}`);

        this.mensajeria.publicar(EXCHANGES.comandos.nombre, ROUTING_KEYS.correoEnviar, {
          para: evento.usuarioSub,
          asunto: 'Se revocó tu licencia',
          cuerpo: `La licencia del juego ${evento.juegoId} fue revocada. Motivo: ${evento.motivo ?? 'no especificado'}.`,
          origen: mensaje.fields.routingKey,
          eventoId: eventoId,
        });

        canal.ack(mensaje);
      },
      { noAck: false },
    );

    this.log.log(`escuchando la cola ${COLAS.avisos}`);
  }
}