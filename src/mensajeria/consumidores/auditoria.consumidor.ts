import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConsumeMessage } from 'amqplib';
import { Repository } from 'typeorm';
import { MensajeriaService } from '../mensajeria.service.js';
import { COLAS } from '../topologia.js';
import { EventoAuditoria } from '../../persistencia/evento-auditoria.entity.js';

const MAX_REINTENTOS = 3;
const ESPERA_ENTRE_REINTENTOS_MS = 1000;

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

    // 1 · ¿El mensaje esta bien formado? Si no, no se reintenta: directo a la DLQ.
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(mensaje.content.toString());
    } catch {
      this.log.warn(`mensaje no es JSON valido en ${COLAS.auditoria}: nack sin reintento`);
      canal.nack(mensaje, false, false);
      return;
    }

    const eventoId = mensaje.properties.headers?.['x-evento-id'] as string | undefined;
    const emitidoEn = mensaje.properties.headers?.['x-emitido-en'] as string | undefined;

    // auditoria escucha con #, asi que distintos eventos traen distintos campos obligatorios.
    // El unico campo que auditoria en si misma exige siempre es el evento_id del header.
    if (!eventoId) {
      this.log.warn(`falta x-evento-id en ${COLAS.auditoria}: nack sin reintento`);
      canal.nack(mensaje, false, false);
      return;
    }

    // 2 · El mensaje esta bien. Si falla guardarlo, puede ser transitorio: se reintenta.
    for (let intento = 1; intento <= MAX_REINTENTOS; intento++) {
      try {
        await this.repo.insert({
          routingKey: mensaje.fields.routingKey,
          eventoId: eventoId,
          usuarioSub: (payload.usuarioSub ?? payload.revocadaPor ?? payload.editorSub ?? null) as
            | string
            | null,
          payload: payload,
          emitidoEn: emitidoEn ? new Date(emitidoEn) : new Date(),
        });

        this.log.log(`${mensaje.fields.routingKey} | evento ${eventoId} guardado en eventos_auditoria`);
        canal.ack(mensaje);
        return;
      } catch (error) {
        if (this.esConflictoDeUnicidad(error)) {
          this.log.warn(`evento ${eventoId} ya estaba guardado: ack sin duplicar`);
          canal.ack(mensaje);
          return;
        }

        if (intento < MAX_REINTENTOS) {
          this.log.warn(
            `intento ${intento}/${MAX_REINTENTOS} fallo para evento ${eventoId}: ${(error as Error).message}`,
          );
          await this.esperar(ESPERA_ENTRE_REINTENTOS_MS);
        } else {
          this.log.error(
            `evento ${eventoId} agoto los ${MAX_REINTENTOS} reintentos: nack sin reintento`,
          );
          canal.nack(mensaje, false, false);
        }
      }
    }
  }

  private esConflictoDeUnicidad(error: unknown): boolean {
    return (error as { code?: string })?.code === '23505';
  }

  private esperar(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}