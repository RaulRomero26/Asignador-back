/*
    Este controlador se encarga de los enpoint de phrassal verbs
*/
//se importan la request y la response de express para tener el tipado
const { response, request } = require('express');
//se importa el conector con la base de datos
const { tareasPromisePool } = require('../database/configTareas');
const events = require('events');
const eventEmitterUbicacion = new events.EventEmitter();
const moment = require('moment-timezone');

const turf = require('@turf/turf');


const enviarUbicacion = async (req, res) => {
    try {
        console.log(req.body);

        const {x,y,username} = req.body;
        // Emitir el evento elemento-ubicacion y mandar el req.body
      

        const insertarUbicacion = await tareasPromisePool.query('INSERT INTO ubicaciones_usuarios (x,y,username) VALUES (?,?,?)', [x,y,username]);
        
        //activador 1 selecciono tareas  de yin  y si hay de vigilancia haces el codigo de abajo
        //seleccionar tareas de vigiliancia
        //activador opcion 2, recibo la ubicacion, y verifico si esta dentro o cerca de un hexagono
        // al primer true espero al primer false para mandar alerta siempre verificar el horario de la vigilancia
        //para mandar o no la alerta
        // 
        let tieneVigilancias = false;
        let tareasUsuario = await tareasPromisePool.query("SELECT * FROM tareas WHERE asignado_a = ? AND tipo_tarea = 'VIGILANCIA' AND estado = 'EN PROCESO'",[username]);
        console.log(tareasUsuario[0]);
        //si hay tareas de vigilancia
        let estaDentro = false;
        let rangoHorario = false;
        if(tareasUsuario[0].length > 0){
            tieneVigilancias = true;
            const horaInicio = moment.tz(tareasUsuario[0][0].hora_inicio, 'UTC').tz('America/Mexico_City');
            const horaFin = moment.tz(tareasUsuario[0][0].hora_fin, 'UTC').tz('America/Mexico_City');
            const ahora = moment().tz('America/Mexico_City');
            console.log('AHORA', ahora.format('YYYY-MM-DD HH:mm:ss'), 'INICIO', horaInicio.format('YYYY-MM-DD HH:mm:ss'), 'FIN', horaFin.format('YYYY-MM-DD HH:mm:ss'));
            // Ahora puedes comparar `ahora` con `horaInicio` y `horaFin` directamente
            const estaDentroDelRango = ahora.isBetween(horaInicio, horaFin);
                        
            console.log(estaDentroDelRango);// true si está dentro del rango, false si no
            if (estaDentroDelRango) {
                // Código para enviar la alerta
                const punto = turf.point([x, y]);
                const hexagon = createHexagon(tareasUsuario[0][0].x, tareasUsuario[0][0].y, .5);
                //const hexagon = createHexagon(-98.2173709, 19.0758406, .5);
                estaDentro = turf.booleanPointInPolygon(punto, hexagon);
                rangoHorario = true;
            }else {
                console.log('No está dentro del rango de tiempo no es necesario verificar mas')
            }
        }

        console.log(estaDentro); // true si el punto está dentro del hexágono,
        // si no hay una tarea de vigilancia, no se hace nada
        eventEmitterUbicacion.emit('elemento-ubicacion', {...req.body,estaDentro,rangoHorario,tieneVigilancias});
        res.json({
            ok: true,
            msg: 'Catalogo de usuarios',
            data: {
                msg: 'todo correcto se emitio el evento',
                estaDentro: estaDentro,
                recibidos: req.body,
                rangoHorario: rangoHorario
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

const obtenerUbicaciones = async (req, res) => {
    try {
        console.log('ENTRO A OBTENER UBICACIONES')
        console.log(req.query);
        const {fechaInicio, fechaFin, usuario} = req.query;
        if(fechaInicio == '' && fechaFin == '' && usuario == ''){
            res.status(200).json({
                ok: true,
                ubicaciones: [],
            });
        }else {

            let usuarioString = '';
            if(usuario != ''){
                usuarioString = `WHERE username = '${usuario}'`
            }
    
            let dateString = ''; 
            
            let inicioCad = '';
            if(usuario == ''){
                inicioCad = 'WHERE '
            }else{
                inicioCad = 'AND '
            }
    
    
            if(fechaInicio !='' && fechaFin == ''){
                dateString = `${inicioCad} DATE(fecha_hora) BETWEEN '${fechaInicio}' AND NOW()`
            }
            if(fechaInicio !='' && fechaFin != ''){
                dateString = `${inicioCad} DATE(fecha_hora) BETWEEN '${fechaInicio}' AND '${fechaFin}'`
            }
            if(fechaInicio =='' && fechaFin != ''){
                dateString = `${inicioCad} DATE(fecha_hora) <= '${fechaFin}'`
            }
    
            const query = `SELECT * FROM ubicaciones_usuarios ${usuarioString} ${dateString}`;
            console.log(query);
    
            const ubicaciones = await tareasPromisePool.query(query);
            res.status(200).json({
                ok: true,
                ubicaciones: ubicaciones[0]
            });
        }


    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Internal Server Error',
        });
    }

};

// Función para crear un cuadrado alrededor de un punto central
function createSquare(centerX, centerY, sideLength) {
    const halfSide = sideLength / 2;
    const square = turf.square([centerX - halfSide, centerY - halfSide, centerX + halfSide, centerY + halfSide]);
    return turf.bboxPolygon(square);
}

// Función para crear un hexágono alrededor de un punto central
function createHexagon(centerX, centerY, sideLength) {
    const center = turf.point([centerX, centerY]);
    const hexagon = turf.circle(center, sideLength, {steps: 6, units: 'kilometers'});
    return hexagon;
}


module.exports = {
    enviarUbicacion,
    obtenerUbicaciones,
    eventEmitterUbicacion
}