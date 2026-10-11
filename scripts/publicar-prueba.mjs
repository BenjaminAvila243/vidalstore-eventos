import { connect } from 'amqplib';
import { randomUUID } from 'node:crypto';

const conexion = await connect('amqp://vidalstore:Herinilo123.cl@localhost:5672');
const canal = await conexion.createChannel();

const payload = {
  juegoId: 'juego-99',
  titulo: 'Prueba Insercion',
  editorSub: 'editor-prueba',
};

canal.publish('vidalstore.eventos', 'juego.publicado', Buffer.from(JSON.stringify(payload)), {
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