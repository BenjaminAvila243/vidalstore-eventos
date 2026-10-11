import { connect } from 'amqplib';
import { randomUUID } from 'node:crypto';

const conexion = await connect('amqp://vidalstore:Herinilo123.cl@localhost:5672');
const canal = await conexion.createChannel();

const payload = {
  licenciaId: 'licencia-1',
  juegoId: 'juego-1',
  usuarioSub: 'jugador-prueba',
  revocadaPor: 'admin-prueba',
  motivo: 'prueba de persistencia completa',
};

canal.publish('vidalstore.eventos', 'licencia.revocada', Buffer.from(JSON.stringify(payload)), {
  persistent: true,
  contentType: 'application/json',
  headers: {
    'x-evento-id': randomUUID(),
    'x-emitido-en': new Date().toISOString(),
  },
});

console.log('Publicado con headers reales.');
await canal.close();
await conexion.close();