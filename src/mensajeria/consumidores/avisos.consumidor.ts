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
        this.procesar(mensaje);
      },
      { noAck: false },
    );

    this.log.log(`escuchando la cola ${COLAS.avisos}`);
  }

  private procesar(mensaje: ConsumeMessage): void {
    const canal = this.mensajeria.canal;

    // 1 · ¿El mensaje esta bien formado?
    let evento: Record<string, unknown>;
    try {
      evento = JSON.parse(mensaje.content.toString());
    } catch {
      this.log.warn(`mensaje no es JSON valido en ${COLAS.avisos}: nack sin reintento`);
      canal.nack(mensaje, false, false);
      return;
    }

    const eventoId = mensaje.properties.headers?.['x-evento-id'] as string | undefined;

    // avisos solo escucha licencia.revocada por ahora: exige usuarioSub.
    if (!evento.usuarioSub || !eventoId) {
      this.log.warn(`falta usuarioSub o x-evento-id en ${COLAS.avisos}: nack sin reintento`);
      canal.nack(mensaje, false, false);
      return;
    }

    this.log.log(`${mensaje.fields.routingKey} | aviso para ${evento.usuarioSub}`);

    // publicar() es sincrono y en memoria: si el canal esta vivo, no falla por motivos
    // transitorios como Postgres. Si el canal se cae, el propio amqplib ya maneja la
    // reconexion a nivel de MensajeriaService.
    this.mensajeria.publicar(EXCHANGES.comandos.nombre, ROUTING_KEYS.correoEnviar, {
      para: evento.usuarioSub,
      asunto: 'Se revocó tu licencia',
      cuerpo: `La licencia del juego ${evento.juegoId} fue revocada. Motivo: ${evento.motivo ?? 'no especificado'}.`,
      origen: mensaje.fields.routingKey,
      eventoId: eventoId,
    });

    canal.ack(mensaje);
  }
}