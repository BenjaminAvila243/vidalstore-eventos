import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditoriaModule } from './mensajeria/consumidores/auditoria.module.js';
import { AvisosModule } from './mensajeria/consumidores/avisos.module.js';
import { CorreosModule } from './mensajeria/consumidores/correos.module.js';
import { MuertosModule } from './mensajeria/consumidores/muertos.module.js';
import { MensajeriaModule } from './mensajeria/mensajeria.module.js';
import { EventoAuditoria } from './persistencia/evento-auditoria.entity.js';
import { MensajeMuerto } from './persistencia/mensaje-muerto.entity.js';
import { Notificacion } from './persistencia/notificacion.entity.js';
import { SaludController } from './salud.controller.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.getOrThrow<string>('DB_HOST'),
        port: config.getOrThrow<number>('DB_PORT'),
        username: config.getOrThrow<string>('DB_USER'),
        password: config.getOrThrow<string>('DB_PASSWORD'),
        database: config.getOrThrow<string>('DB_NAME'),
        schema: config.getOrThrow<string>('DB_SCHEMA'),
        entities: [EventoAuditoria, Notificacion, MensajeMuerto],
        synchronize: true, // solo en desarrollo: crea las tablas solo, comparando con las entidades
      }),
    }),
    MensajeriaModule,
    AuditoriaModule,
    AvisosModule,
    CorreosModule,
    MuertosModule,
  ],
  controllers: [SaludController],
  providers: [],
})
export class AppModule {}