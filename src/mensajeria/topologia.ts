import { Channel } from 'amqplib';

export const EXCHANGES = {
  eventos: { nombre: 'vidalstore.eventos', tipo: 'topic' },
  comandos: { nombre: 'vidalstore.comandos', tipo: 'direct' },
  dlx: { nombre: 'vidalstore.dlx', tipo: 'direct' },
} as const;


export const COLAS = {
  avisos: 'avisos-jugador',
  auditoria: 'auditoria',
  correos: 'correos',
} as const;

export const DLQ = {
  avisos: 'avisos-jugador.dlq',
  auditoria: 'auditoria.dlq',
  correos: 'correos.dlq',
} as const;

export const ROUTING_KEYS = {
  compraRealizada: 'compra.realizada',
  licenciaRevocada: 'licencia.revocada',
  juegoPublicado: 'juego.publicado',
  correoEnviar: 'correo.enviar',
} as const;

export const BINDINGS = [
  { cola: COLAS.avisos, exchange: EXCHANGES.eventos.nombre, patron: ROUTING_KEYS.licenciaRevocada },
  { cola: COLAS.auditoria, exchange: EXCHANGES.eventos.nombre, patron: '#' },
  { cola: COLAS.correos, exchange: EXCHANGES.comandos.nombre, patron: ROUTING_KEYS.correoEnviar },
] as const;

export async function declararTopologia(canal: Channel): Promise<void> {
  for (const exchange of Object.values(EXCHANGES)) {
    await canal.assertExchange(exchange.nombre, exchange.tipo, { durable: true });
  }

  for (const dlq of Object.values(DLQ)) {
    await canal.assertQueue(dlq, { durable: true });
  }
  await canal.bindQueue(DLQ.avisos, EXCHANGES.dlx.nombre, COLAS.avisos);
  await canal.bindQueue(DLQ.auditoria, EXCHANGES.dlx.nombre, COLAS.auditoria);
  await canal.bindQueue(DLQ.correos, EXCHANGES.dlx.nombre, COLAS.correos);

  await canal.assertQueue(COLAS.avisos, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': EXCHANGES.dlx.nombre,
      'x-dead-letter-routing-key': COLAS.avisos,
    },
  });
  await canal.assertQueue(COLAS.auditoria, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': EXCHANGES.dlx.nombre,
      'x-dead-letter-routing-key': COLAS.auditoria,
    },
  });
  await canal.assertQueue(COLAS.correos, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': EXCHANGES.dlx.nombre,
      'x-dead-letter-routing-key': COLAS.correos,
    },
  });

  for (const binding of BINDINGS) {
    await canal.bindQueue(binding.cola, binding.exchange, binding.patron);
  }
}