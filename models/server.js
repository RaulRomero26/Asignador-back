//Servidor de express
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');
const cors = require('cors');
const Sockets = require('./socket');
const admin = require("firebase-admin");

class Server {

    constructor() {
        this.app = express();
        this.port = process.env.PORT;

        // Http Server
        this.server = http.createServer(this.app);

        // Configuracion del socket server
        this.io = require('socket.io')(this.server, {
            cors: {
              origin: '*',
            }
          });

        this.asignadorPath = '/api/asignador';
        this.usuariosPath = '/api/usuarios';
        this.authPath = '/api/auth';
        this.imagesPath = '/api/images';
        this.catalogosPath = '/api/catalogos';
        this.notificacionesPath = '/api/notificaciones';
        this.ubicacionesPath = '/api/ubicaciones';
    }

    middelwares() {
        // Desplegar el directorio Público
        this.app.use(express.static(path.resolve(__dirname, '../public')));

        // this.app.use((req, res, next) => {
        //     res.header("Access-Control-Allow-Origin", "*");
        //     res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method, Access-Control-Allow-Credentials');
        //     res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
        //     res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
        //     next();
        // });
        // CORS
        this.app.use(cors({
            origin: '*'
          }));
        //HEADERS

        // Lectura y parseo del body para datos en formato JSON
        this.app.use(express.json({ limit: '50mb' }));
      }

    configurarSockets() {
        new Sockets( this.io );
    }

    routes(){
        //aca se decide que ruta asignarle y de que archivo tomar las configuraciones
        this.app.use( this.authPath, require('../routes/auth.routes'));//authenticacion
        this.app.use( this.asignadorPath, require('../routes/tareas.routes'));//tareas
        this.app.use( this.asignadorPath, require('../routes/respuestas.routes'));//respuestas
        this.app.use( this.imagesPath, require('../routes/images.routes'));
        this.app.use( this.catalogosPath, require('../routes/catalogos.routes'));
        this.app.use( this.notificacionesPath, require('../routes/notificaciones.routes'));//notificaciones
        this.app.use( this.ubicacionesPath, require('../routes/ubicaciones.routes'));//ubicaciones
        this.app.use( this.asignadorPath, require('../routes/reportes.routes'));//reportes

        //this.app.use( this.cronPath, require('../routes/cron.routes'));//cron
    }
    

    firebase(){
      var serviceAccount = require("../appzen-db070-firebase-adminsdk-90ejd-5ead12d376.json");

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });

    }

    execute(){
        //Inicializar Middlewares
        this.middelwares();

        //Inicializar los sockets
        this.configurarSockets();

        //Rutas de la aplicacion
        this.routes();

        this.firebase();

        //Inicializaar server
        this.server.listen(this.port, () => {
            console.log('Server corriendo en el puerto: ', this.port);
        })
        
    }
}

module.exports = Server;