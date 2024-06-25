
const {eventEmitter} = require('../controllers/tareas.controller');
const {eventEmitterUbicacion} = require('../controllers/ubicaciones.controller');

class Sockets {
  constructor(io) {
    this.io = io;

    this.socketEvents();
    this.eventEmitterEvents()
  }

  socketEvents() {
    // On connection
    this.io.on('connection', (socket) => {
      console.log('Un cliente se ha conectado');
        
      socket.on('message', (message) => {
        console.log('Mensaje recibido:', message);
        socket.broadcast.emit('message', message);
      });
      
      socket.on('buscarInformacion', (data) => {
        console.log('Mensaje recibido:', data);
        socket.emit('buscarInformacion', data);
      });

      socket.on('elemento-ubicacion', (data) => {
        console.log('Mensaje recibido:', data);
        socket.emit('nueva-ubicacion', data); // Corregido aquí
      });
      
    });

  }

  eventEmitterEvents() {
    // Escuchar el evento personalizado
    eventEmitter.on('buscarInformacion', (data) => {
      this.io.emit('buscarInformacion', data);
    });
    eventEmitterUbicacion.on('elemento-ubicacion', (data) => {
      
      this.io.emit('nueva-ubicacion', data);
    });


  }
  

}

module.exports = Sockets;