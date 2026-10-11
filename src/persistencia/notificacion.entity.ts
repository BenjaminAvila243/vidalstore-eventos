import { Check, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'notificaciones', schema: 'eventos' })
@Check(`estado IN ('enviada', 'fallida')`)
export class Notificacion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  para!: string;

  @Column({ type: 'text' })
  asunto!: string;

  @Column({ type: 'text', default: 'enviada' })
  estado!: 'enviada' | 'fallida';

  // El x-evento-id del evento que origino el aviso: une la notificacion con su auditoria.
  @Column({ name: 'evento_id', type: 'uuid' })
  eventoId!: string;

  @CreateDateColumn({ name: 'creada_en', type: 'timestamptz' })
  creadaEn!: Date;
}