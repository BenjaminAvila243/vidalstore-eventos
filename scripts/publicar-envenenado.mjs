import { connect } from 'amqplib';

const conexion = await connect(process.env.RABBITMQ_URL);
const canal = await conexion.createChannel();

const modo = process.argv[2] ?? 'no-json';

if (modo === 'no-json') {
  canal.publish('vidalstore.eventos', 'juego.publicado', Buffer.from('esto no es json'), {
    persistent: true,
    contentType: 'application/json',
  });
  console.log('Publicado mensaje que no es JSON valido.');
} else if (modo === 'sin-evento-id') {
  const payload = { juegoId: 'juego-roto', titulo: 'Sin evento id' };
  canal.publish('vidalstore.eventos', 'juego.publicado', Buffer.from(JSON.stringify(payload)), {
    persistent: true,
    contentType: 'application/json',
    // a proposito, sin headers x-evento-id
  });
  console.log('Publicado JSON valido pero sin x-evento-id.');
} else {
  console.log('Uso: node scripts/publicar-envenenado.mjs [no-json|sin-evento-id]');
}

await canal.close();
await conexion.close();