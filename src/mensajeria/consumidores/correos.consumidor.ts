import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConsumeMessage } from 'amqplib';
import { Repository } from 'typeorm';
import { MensajeriaService } from '../mensajeria.service.js';
import { COLAS } from '../topologia.js';
import { Notificacion } from '../../persistencia/notificacion.entity.js';

const MAX_REINTENTOS = 3;
const ESPERA_ENTRE_REINTENTOS_MS = 1000;

@Injectable()
export class CorreosConsumidor implements OnModuleInit {
  private readonly log = new Logger(CorreosConsumidor.name);

  constructor(
    private readonly mensajeria: MensajeriaService,
    @InjectRepository(Notificacion) private readonly repo: Repository<Notificacion>,
  ) {}

  async onModuleInit(): Promise<void> {
    const canal = this.mensajeria.canal;

    await canal.consume(
      COLAS.correos,
      (mensaje: ConsumeMessage | null) => {
        if (!mensaje) return;
        void this.procesar(mensaje);
      },
      { noAck: false },
    );

    this.log.log(`escuchando la cola ${COLAS.correos}`);
  }

  private async procesar(mensaje: ConsumeMessage): Promise<void> {
    const canal = this.mensajeria.canal;

    let comando: Record<string, unknown>;
    try {
      comando = JSON.parse(mensaje.content.toString());
    } catch {
      this.log.warn(`mensaje no es JSON valido en ${COLAS.correos}: nack sin reintento`);
      canal.nack(mensaje, false, false);
      return;
    }

    const { para, asunto, origen, eventoId } = comando;

    if (!para || !asunto || !eventoId) {
      this.log.warn(`falta para, asunto o eventoId en ${COLAS.correos}: nack sin reintento`);
      canal.nack(mensaje, false, false);
      return;
    }

    for (let intento = 1; intento <= MAX_REINTENTOS; intento++) {
      try {
        await this.repo.insert({
          para: para as string,
          asunto: asunto as string,
          estado: 'enviada',
          eventoId: eventoId as string,
        });

        this.log.log(`enviando correo a ${para}: "${asunto}" (origen ${origen}), guardado en notificaciones`);
        canal.ack(mensaje);
        return;
      } catch (error) {
        if (intento < MAX_REINTENTOS) {
          this.log.warn(
            `intento ${intento}/${MAX_REINTENTOS} fallo al guardar notificacion para ${para}: ${(error as Error).message}`,
          );
          await this.esperar(ESPERA_ENTRE_REINTENTOS_MS);
        } else {
          this.log.error(`notificacion para ${para} agoto los ${MAX_REINTENTOS} reintentos: nack sin reintento`);
          canal.nack(mensaje, false, false);
        }
      }
    }
  }

  private esperar(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}