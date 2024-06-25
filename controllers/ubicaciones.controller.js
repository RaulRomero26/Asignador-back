/*
    Este controlador se encarga de los enpoint de phrassal verbs
*/
//se importan la request y la response de express para tener el tipado
const { response, request } = require('express');
//se importa el conector con la base de datos
const { tareasPromisePool } = require('../database/configTareas');
const events = require('events');
const eventEmitterUbicacion = new events.EventEmitter();

const enviarUbicacion = async (req, res) => {
    try {
        console.log(req.body);

        const {x,y,username} = req.body;
        // Emitir el evento elemento-ubicacion y mandar el req.body
        eventEmitterUbicacion.emit('elemento-ubicacion', req.body);

        const insertarUbicacion = await tareasPromisePool.query('INSERT INTO ubicaciones_usuarios (x,y,username) VALUES (?,?,?)', [x,y,username]);

        res.json({
            ok: true,
            msg: 'Catalogo de usuarios',
            data: {
                msg: 'todo correcto se emitio el evento',
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            msg: 'Internal Server Error',
        });
    }
};


module.exports = {
    enviarUbicacion,
    eventEmitterUbicacion
}