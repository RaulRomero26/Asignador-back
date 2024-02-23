

class Sockets {
  constructor(io) {
    this.io = io;

    this.socketEvents();
  }

  socketEvents() {
    // On connection
    this.io.on('connection', (socket) => {
      console.log('Un cliente se ha conectado');
        
      socket.on('message', (message) => {
        console.log('Mensaje recibido:', message);
        socket.broadcast.emit('message', message);
      });
      
    });



  }
  

}

module.exports = Sockets;