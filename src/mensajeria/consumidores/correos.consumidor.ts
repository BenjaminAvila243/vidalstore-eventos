import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConsumeMessage } from 'amqplib';
import { Repository } from 'typeorm';
import { MensajeriaService } from '../mensajeria.service.js';
import { COLAS } from '../topologia.js';
import { Notificacion } from '../../persistencia/notificacion.entity.js';

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
    const { para, asunto, origen, eventoId } = JSON.parse(mensaje.content.toString());

    try {
      await this.repo.insert({
        para,
        asunto,
        estado: 'enviada',
        eventoId,
      });

      this.log.log(`enviando correo a ${para}: "${asunto}" (origen ${origen}), guardado en notificaciones`);
      canal.ack(mensaje);
    } catch (error) {
      this.log.error(`no se pudo guardar la notificacion para ${para}: ${(error as Error).message}`);
    }
  }
}