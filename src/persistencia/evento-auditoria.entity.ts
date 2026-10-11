import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'eventos_auditoria', schema: 'eventos' })
export class EventoAuditoria {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'routing_key', type: 'text' })
  @Index()
  routingKey!: string;

  // Viaja desde el productor en x-evento-id. UNIQUE: es lo que hace idempotente al consumidor.
  @Column({ name: 'evento_id', type: 'uuid', unique: true })
  eventoId!: string;

  @Column({ name: 'usuario_sub', type: 'text', nullable: true })
  usuarioSub!: string | null;

  @Column({ type: 'jsonb' })
  payload!: unknown;

  @Column({ name: 'emitido_en', type: 'timestamptz' })
  emitidoEn!: Date;

  @CreateDateColumn({ name: 'recibido_en', type: 'timestamptz' })
  @Index()
  recibidoEn!: Date;
}