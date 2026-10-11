import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'mensajes_muertos', schema: 'eventos' })
export class MensajeMuerto {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'cola_origen', type: 'text' })
  colaOrigen!: string;

  @Column({ name: 'routing_key', type: 'text' })
  routingKey!: string;

  @Column({ type: 'text' })
  motivo!: string;

  @Column({ type: 'int' })
  intentos!: number;

  // Como texto, no jsonb: un mensaje puede haber muerto justamente por no ser JSON valido.
  @Column({ type: 'text' })
  payload!: string;

  @CreateDateColumn({ name: 'recibido_en', type: 'timestamptz' })
  recibidoEn!: Date;
}