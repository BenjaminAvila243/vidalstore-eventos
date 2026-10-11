import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConsumeMessage } from 'amqplib';
import { Repository } from 'typeorm';
import { MensajeriaService } from '../mensajeria.service.js';
import { COLAS } from '../topologia.js';
import { EventoAuditoria } from '../../persistencia/evento-auditoria.entity.js';

@Injectable()
export class AuditoriaConsumidor implements OnModuleInit {
  private readonly log = new Logger(AuditoriaConsumidor.name);

  constructor(
    private readonly mensajeria: MensajeriaService,
    @InjectRepository(EventoAuditoria) private readonly repo: Repository<EventoAuditoria>,
  ) {}

  async onModuleInit(): Promise<void> {
    const canal = this.mensajeria.canal;

    await canal.consume(
      COLAS.auditoria,
      (mensaje: ConsumeMessage | null) => {
        if (!mensaje) return;
        void this.procesar(mensaje);
      },
      { noAck: false },
    );

    this.log.log(`escuchando la cola ${COLAS.auditoria}`);
  }

  private async procesar(mensaje: ConsumeMessage): Promise<void> {
    const canal = this.mensajeria.canal;
    const eventoId = mensaje.properties.headers?.['x-evento-id'];
    const emitidoEn = mensaje.properties.headers?.['x-emitido-en'];
    const payload = JSON.parse(mensaje.content.toString());

    try {
      await this.repo.insert({
        routingKey: mensaje.fields.routingKey,
        eventoId: eventoId,
        usuarioSub: payload.usuarioSub ?? payload.revocadaPor ?? payload.editorSub ?? null,
        payload: payload,
        emitidoEn: emitidoEn ? new Date(emitidoEn) : new Date(),
      });

      this.log.log(`${mensaje.fields.routingKey} | evento ${eventoId} guardado en eventos_auditoria`);
      canal.ack(mensaje);
    } catch (error) {
      // UNIQUE(evento_id): si ya existe, es el mismo mensaje reentregado. No se duplica, se confirma igual.
      if (this.esConflictoDeUnicidad(error)) {
        this.log.warn(`evento ${eventoId} ya estaba guardado: ack sin duplicar`);
        canal.ack(mensaje);
        return;
      }
      // Postgres no responde u otro error transitorio: por ahora, log. El reintento viene despues.
      this.log.error(`no se pudo guardar el evento ${eventoId}: ${(error as Error).message}`);
    }
  }

  private esConflictoDeUnicidad(error: unknown): boolean {
    return (error as { code?: string })?.code === '23505';
  }
}