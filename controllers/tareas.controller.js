/*
    Este controlador se encarga de los enpoint de phrassal verbs
*/


//se importan la request y la response de express para tener el tipado
const { response, request } = require('express');

const admin = require('firebase-admin');

const webPush = require('web-push');
// En tu controlador
const events = require('events');
const eventEmitter = new events.EventEmitter();

//se importa el conector con la base de datos
const { tareasPromisePool } = require('../database/configTareas');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Middleware de Multer para manejar archivos
const handleFile = upload.single('image');

const convertToMySQLDateTime = (isoDate) => {
    if (!isoDate) return null;
    return new Date(isoDate).toISOString().slice(0, 19).replace('T', ' ');
};

const crearTarea = async (req, res) => {
    try {
            const {tarea}  = req.body;
            // Primero, realizamos la inserción
            //console.log(tarea)
            let propiedadesTarea = JSON.parse(tarea)
            console.log(propiedadesTarea.tipo_tarea)
            let columns = Object.keys(propiedadesTarea).join(', '); // Obtener nombres de las propiedades
            let arrayCreacion = propiedadesTarea.tipo_tarea.split(', ');


            if (propiedadesTarea.hora_inicio) {
                const horaInicio = new Date(propiedadesTarea.hora_inicio);
                horaInicio.setHours(horaInicio.getHours() - 6);
                propiedadesTarea.hora_inicio = horaInicio.toISOString().slice(0, 19).replace('T', ' ');
            }
            if (propiedadesTarea.hora_fin) {
                const horaFin = new Date(propiedadesTarea.hora_fin);
                horaFin.setHours(horaFin.getHours() - 6);
                propiedadesTarea.hora_fin = horaFin.toISOString().slice(0, 19).replace('T', ' ');
            }
            if (propiedadesTarea.fecha_operativo) propiedadesTarea.fecha_operativo = convertToMySQLDateTime(propiedadesTarea.fecha_operativo);


            console.log(arrayCreacion)

            arrayCreacion.forEach(async (element) => {
                propiedadesTarea.tipo_tarea = element;
                let placeholders = Object.keys(propiedadesTarea).map(() => '?').join(', '); // Generar marcadores de posición para los valores
                let values = Object.values(propiedadesTarea); // Obtener los valores de las propiedades

                const insertResult = await tareasPromisePool.query(
                     `INSERT INTO tareas(${columns}) VALUES (${placeholders})`,
                     values
                );
                if(propiedadesTarea.asignado_a){
                    const obtenerIdUsuario = await tareasPromisePool.query(`
                        SELECT id FROM usuarios WHERE username = ?`,
                        [propiedadesTarea.asignado_a]
                    );
                    console.log(obtenerIdUsuario[0][0].id)
                }
    
    
                // Luego, obtenemos el último ID insertado
                const lastInsertedId = insertResult[0].insertId;
    
                if (req.file) {
                    const tipoMIME = req.file.mimetype;
                    let extension = '';
                    switch (tipoMIME) {
                        case 'image/jpeg':
                            extension = '.jpeg';
                            break;
                        case 'image/jpg':
                            extension = '.jpg';
                            break;
                        case 'image/png':
                            extension = '.png';
                            break;
                        default:
                            break;
                    }
    
                    // Finalmente, realizamos la actualización
                    const updateResult = await tareasPromisePool.query(
                        `UPDATE tareas SET img = CONCAT(?, ?) WHERE id_tarea = ?`,
                        [lastInsertedId, extension, lastInsertedId]
                    );
                    let carpeta ='';
                    switch (propiedadesTarea.tipo_tarea) {
                        case 'BUSQUEDA':
                            carpeta = 'busqueda';
                            break;
                        case 'VIGILANCIA':
                            carpeta = 'vigilancia';
                            break
                        case 'ENTREVISTA':
                            carpeta = 'entrevista';
                            break;
                        case 'BARRIDO':
                            carpeta = 'barrido';
                            break;
                        case 'OTRA':
                            carpeta = 'otra';
                            break;
                        default:
                            carpeta = 'otra';
                            break;
                    }
    
    
                    const uploadPath = path.join(__dirname, '../public/asignador/tareas/tareas',`${carpeta}`,`${lastInsertedId}`);
                    console.log(uploadPath)
                    // Crear el directorio si no existe
                    if (!fs.existsSync(uploadPath)) {
                        fs.mkdirSync(uploadPath, { recursive: true });
                    }
    
                    const filePath = path.join(uploadPath, `${lastInsertedId}${extension}`);
    
                    // Escribe el archivo en la ubicación deseada
                    fs.writeFileSync(filePath, req.file.buffer);
                }
    
                // //Enviar la tarea
                let tareaEnviar = await tareasPromisePool.query(`SELECT * FROM tareas WHERE id_tarea = ?`,[lastInsertedId]);
                tareaEnviar = tareaEnviar[0][0];
                // console.log(tareaEnviar)
                axios.post(process.env.ENLACE_AURA+'/api/asignador/insert-tarea', {tarea: tareaEnviar})
            });
            let userToken = await tareasPromisePool.query(`SELECT token FROM usuarios_token WHERE usuario = ?`,[propiedadesTarea.asignado_a]);
            console.log(userToken[0][0].token)
            sendFCMNotification([userToken[0][0].token],propiedadesTarea);
           
            res.json({
                ok: true,
                msg: 'POST TAREA CREADA',
                data: {
                    message: 'Tarea creada exitosamente',
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

const getAllTareas = async (req, res) => {
    try {
        const { page = 1, per_page, asignadas,orden,mostrar,usuario,tipo, fechaInicio,fechaFin } = req.query;
        const offset = (page - 1) * per_page;
        let queryResult,totalRegisters;

        console.log('SOLICITO: ',page , per_page, asignadas,orden,mostrar,usuario,tipo,fechaInicio,fechaFin )

        let ordenString = '';
       
        switch (orden) {
            case 'MAYOR PRIORIDAD': // Cambié 'MARYOR PRIORIDAD' a 'MAYOR PRIORIDAD'
                ordenString = `ORDER BY CASE prioridad_tarea WHEN 'BAJA' THEN 4 WHEN 'NORMAL' THEN 3 WHEN 'MEDIA' THEN 2 WHEN 'ALTA' THEN 1 END`
                break;
            case 'FECHA ASIGNACION':
                ordenString = `ORDER BY fecha_asignacion DESC`;
                break;
            default:
                ordenString = '';
                break;
        }

        let mostrarString = '';
        

        switch (mostrar) {
            case 'EN PROGRESO':
                mostrarString = `estado = 'EN PROCESO'`
                break;
            case 'COMPLETADAS':
                mostrarString = `estado = 'COMPLETADA'`    
                break;
        
            default:
                break;
        }
       
        let tipoString = '';

        if(tipo != ''){
            tipoString = `AND tipo_tarea = '${tipo}'`
        }

        
        let usuarioString = '';
        if(usuario != ''){
            usuarioString = `AND asignado_a LIKE '%${usuario}%'`
        }

        let dateString = ''; 
        if(fechaInicio !='' && fechaFin == ''){
            dateString = `AND DATE(fecha_asignacion) BETWEEN '${fechaInicio}' AND NOW()`
        }
        if(fechaInicio !='' && fechaFin != ''){
            dateString = `AND DATE(fecha_asignacion) BETWEEN '${fechaInicio}' AND '${fechaFin}'`
        }
        if(fechaInicio =='' && fechaFin != ''){
            dateString = `AND DATE(fecha_asignacion) <= '${fechaFin}'`
        }

        if(asignadas != 'ALL'){
            console.log('asignadas diferente de all')
            console.log(`SELECT * FROM tareas WHERE asignado_a = ? AND ${mostrarString} ${ordenString}  LIMIT ?, ?;`)
            queryResult = await tareasPromisePool.query(
                `SELECT * FROM tareas WHERE asignado_a = ? AND ${mostrarString} ${ordenString}  LIMIT ?, ?;`,
                [asignadas,offset, parseInt(per_page)]
            );
            
            totalRegisters = await tareasPromisePool.query(
                `SELECT COUNT(*) AS total FROM tareas WHERE asignado_a = ?;`,
                [asignadas]
            )
        }else{
            console.log('else')
            console.log(`SELECT * FROM tareas WHERE ${mostrarString} ${usuarioString} ${tipoString} ${dateString} ${ordenString} LIMIT ?, ?;`)
            queryResult = await tareasPromisePool.query(
                `SELECT * FROM tareas WHERE ${mostrarString} ${usuarioString} ${tipoString} ${dateString} ${ordenString} LIMIT ?, ?;`,
                [offset, parseInt(per_page)]
            );
            
            totalRegisters = await tareasPromisePool.query(
                `SELECT COUNT(*) AS total FROM tareas ;`
            )
        }

      

        res.json({
            ok: true,
            msg: 'GET TAREAS',
            data: {
                tareas: queryResult[0],
                totalRegisters: totalRegisters[0][0].total,
                totalPages: Math.ceil(totalRegisters[0][0].total/per_page)
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

const getTareaById = async(req, res) => {
    try {
    
        const { id = 1} = req.query;

        const queryResult = await tareasPromisePool.query(
            `SELECT *, DATE_FORMAT(hora_inicio, '%Y-%m-%d %H:%i') as 'hora_inicio_formateada' , DATE_FORMAT(hora_fin, '%Y-%m-%d %H:%i') as 'hora_fin_formateada' FROM tareas WHERE id_tarea = ?`,
            [id]
        );
        console.log( queryResult[0][0])
        respuestas = [];
        detenciones = [];
        switch (queryResult[0][0].tipo_tarea) {
            case 'ENTREVISTA':
                respuestas = await tareasPromisePool.query(
                    `SELECT * FROM tareas_entrevista WHERE  id_tarea = ?`,
                    [Number(id)]
                );

                break;
            case 'BARRIDO':
                respuestas = await tareasPromisePool.query(
                    `SELECT * FROM tareas_barrido WHERE  id_tarea = ?`,
                    [Number(id)]
                );

                break;
            case 'VIGILANCIA':
                respuestas = await tareasPromisePool.query(
                    `SELECT * FROM tareas_vigilancia WHERE  id_tarea = ?`,
                    [Number(id)]
                );
                detenciones = await tareasPromisePool.query(
                    `SELECT * FROM detenciones WHERE  id_tarea = ?`,
                    [Number(id)]
                );
                console.log(detenciones[0])
                break;

            case 'BUSQUEDA':
                respuestas = await tareasPromisePool.query(
                    `SELECT * FROM tareas_busqueda WHERE  id_tarea = ?`,
                    [Number(id)]
                );
                detenciones = await tareasPromisePool.query(
                    `SELECT * FROM detenciones WHERE  id_tarea = ?`,
                    [Number(id)]
                );

                break;

            case 'OTRA':
                respuestas = await tareasPromisePool.query(
                    `SELECT * FROM tareas_otra WHERE  id_tarea = ?`,
                    [Number(id)]
                );

                break;
        
            default:
                break;
        }
        //aca tenemos el folio sic
        folio_sic = queryResult[0][0].folio_sic;
        let externalApiResponse;
        try {
            console.log(process.env.ENLACE_AURA+'/api/asignador/info-aura?folio='+folio_sic)
            externalApiResponse = await axios.get(process.env.ENLACE_AURA+'/api/asignador/info-aura?folio='+folio_sic);
            console.log(externalApiResponse.data.data)
            externalApiResponse = externalApiResponse.data.data[0];
        } catch (error) {
            externalApiResponse = {msg: 'El servicio esta caido'};
        }
        
        // Usar la respuesta de la solicitud externa como parte de tu lógica
        console.log('RESPONDIO:',externalApiResponse);

        res.json({
            ok: true,
            msg: 'GET TAREA ID',
            data: {
                tareas: queryResult[0],
                respuestas: respuestas[0],
                detenciones: detenciones[0],
                aura: externalApiResponse
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            msg: 'Internal Server Error',
        });
    }
}

const getTareasVigilanciaHoy = async (req,res) => {
    try {
        const tareas = await tareasPromisePool.query(
            `SELECT * FROM tareas WHERE tipo_tarea = 'VIGILANCIA' AND DATE(hora_inicio) = CURDATE() AND estado = 'EN PROCESO' ORDER BY hora_inicio ASC`
        );
        return res.json({
            ok: true,
            msg: 'GET TAREAS VIGILANCIA HOY',
            data: tareas[0]
        });
    }catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            msg: 'Internal Server Error',
        });
    }
}

const actualizarTarea = async (req, res) => {
    try {
        console.log(req.body);
        const { tarea } = req.body;

        let propiedadesTarea = JSON.parse(tarea);
        if (propiedadesTarea.usuario == undefined || propiedadesTarea.usuario == null || propiedadesTarea.usuario == 'null' || propiedadesTarea.usuario == 'undefinded') { 
            propiedadesTarea.usuario = propiedadesTarea.asignado_a;
        }
        console.log(propiedadesTarea)
        
        const { id, ...resto } = propiedadesTarea;
        console.log(propiedadesTarea);
        
        // Construir la parte SET de la consulta SQL
        let setClause = Object.keys(resto).map(key => `${key} = ?`).join(', ');
        let values = Object.values(resto); // Obtener los valores de las propiedades
        
        // Añadir el id al final de los valores
        values.push(id);
        console.log(values)
        console.log(`UPDATE tareas SET ${setClause} WHERE id_tarea = ?`);
        const updateResult = await tareasPromisePool.query(`UPDATE tareas SET ${setClause} WHERE id_tarea = ?`, values);
        //console.log(updateResult);

        return res.json({
            ok: true,
            msg: 'Tarea actualizada',
        });

    } catch (error) {
        console.log('ERROR:',error);
        res.status(500).json({
            ok: false,
            msg: 'Internal Server Error',
        });
    }
}


async function sendFCMNotification(tokens,propiedadesTarea) {
    const message = {
        tokens: tokens, // ['fcmToken1', 'fcmToken2', ...]
        notification: {
            title: 'Nueva tarea asignada',
            body: `Instrucciones: ${propiedadesTarea.instrucciones}, Tipo: ${propiedadesTarea.tipo_tarea}`,
        },
    };

    try {
        const response = await admin.messaging().sendMulticast(message);
        console.log(`Total de mensajes: ${response.successCount} enviados exitosamente, ${response.failureCount} fallos.`);

        // Manejo de las respuestas
        response.responses.forEach((resp, idx) => {
            if (resp.success) {
                console.log(`Mensaje a ${tokens[idx]} enviado exitosamente.`);
            } else {
                console.error(`Error enviando mensaje a ${tokens[idx]}:`, resp.error);
            }
        });
    } catch (error) {
        console.error('Error enviando mensajes FCM:', error);
    }
}

const crearTareaGuardia = async (req, res) => {
    console.log('CREANDO TAREA GUARDIA');
    try {
            const {folio_aura}  = req.body;
            console.log(req.body)
            arrayCreacion = ['ENTREVISTA','BARRIDO'];
            arrayCreacion.forEach(async (element) => {
              
                const insertResult = await tareasPromisePool.query(
                     `INSERT INTO tareas(tipo_tarea,instrucciones,folio_sic,asignado_a,prioridad_tarea,usuario) VALUES (?,?,?,?,?,?)`,
                     [element,'TAREA CREADA POR ACTIVACION DE FOLIO',folio_aura,'GUARDIA','NORMAL','SISTEMA']
                );
                    
                // Luego, obtenemos el último ID insertado
                const lastInsertedId = insertResult[0].insertId;

                //Enviar la tarea
                 let tareaEnviar = await tareasPromisePool.query(`SELECT * FROM tareas WHERE id_tarea = ?`,[lastInsertedId]);
                 tareaEnviar = tareaEnviar[0][0];
                // console.log(tareaEnviar)
                axios.post(process.env.ENLACE_AURA+'/api/asignador/insert-tarea', {tarea: tareaEnviar})
            });
            // let userToken = await tareasPromisePool.query(`SELECT token FROM usuarios_token WHERE usuario = ?`,[propiedadesTarea.asignado_a]);
            // console.log(userToken[0][0].token)
            // sendFCMNotification([userToken[0][0].token],propiedadesTarea);
           
            res.json({
                ok: true,
                msg: 'POST TAREA CREADA',
                data: {
                    message: 'Tarea creada exitosamente',
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

//se exporta la funcion para usarla en el exterior
module.exports = {
    crearTarea,
    getAllTareas,
    getTareaById,
    handleFile,
    eventEmitter,
    getTareasVigilanciaHoy,
    actualizarTarea,
    crearTareaGuardia
}