import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { MensajeriaService } from './mensajeria/mensajeria.service.js';

@Controller('salud')
export class SaludController {
  constructor(
    private readonly mensajeria: MensajeriaService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  @Get()
  async estado() {
    const broker = this.mensajeria.canal?.connection ? 'abierto' : 'cerrado';
    let postgres = 'sin_responder';

    try {
      await this.dataSource.query('SELECT 1');
      postgres = 'ok';
    } catch {
      postgres = 'sin_responder';
    }

    return {
      servicio: 'vidalstore-eventos',
      broker,
      postgres,
    };
  }
}