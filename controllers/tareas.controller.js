/*
    Este controlador se encarga de los enpoint de phrassal verbs
*/


//se importan la request y la response de express para tener el tipado
const { response, request } = require('express');

const webPush = require('web-push');
//se importa el conector con la base de datos
const { tareasPromisePool } = require('../database/configTareas');

const fs = require('fs');
const path = require('path');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Middleware de Multer para manejar archivos
const handleFile = upload.single('image');

const crearTarea = async (req, res) => {
    try {
            const {tarea}  = req.body;
            // Primero, realizamos la inserción
            console.log(tarea)
            let propiedadesTarea = JSON.parse(tarea)
            console.log(propiedadesTarea)
            let columns = Object.keys(propiedadesTarea).join(', '); // Obtener nombres de las propiedades
            let placeholders = Object.keys(propiedadesTarea).map(() => '?').join(', '); // Generar marcadores de posición para los valores
            let values = Object.values(propiedadesTarea); // Obtener los valores de las propiedades
            
            const insertResult = await tareasPromisePool.query(
                `INSERT INTO tareas(${columns}) VALUES (${placeholders})`,
                values
            );

            const obtenerIdUsuario = await tareasPromisePool.query(`
                SELECT id FROM usuarios WHERE username = ?`,
                [propiedadesTarea.asignado_a]
            );

            console.log(obtenerIdUsuario[0][0].id)

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



            res.json({
                ok: true,
                msg: 'POST TAREA CREADA',
                data: {
                    message: 'Tarea creada exitosamente',
                    id: lastInsertedId,
                    user_id: obtenerIdUsuario[0][0].id
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
        const { page = 1, per_page, asignadas,orden,mostrar } = req.query;
        const offset = (page - 1) * per_page;
        let queryResult,totalRegisters;

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
       
        if(asignadas != 'ALL'){
            queryResult = await tareasPromisePool.query(
                `SELECT * FROM tareas WHERE asignado_a = ? AND ${mostrarString} ${ordenString}  LIMIT ?, ?;`,
                [asignadas,offset, parseInt(per_page)]
            );
            
            totalRegisters = await tareasPromisePool.query(
                `SELECT COUNT(*) AS total FROM tareas WHERE asignado_a = ?;`,
                [asignadas]
            )
        }else{
            console.log(ordenString)
            queryResult = await tareasPromisePool.query(
                `SELECT * FROM tareas WHERE ${mostrarString} ${ordenString} LIMIT ?, ?;`,
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
        res.json({
            ok: true,
            msg: 'GET TAREA ID',
            data: {
                tareas: queryResult[0],
                respuestas: respuestas[0],
                detenciones: detenciones[0]
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

//se exporta la funcion para usarla en el exterior
module.exports = {
    crearTarea,
    getAllTareas,
    getTareaById,
    handleFile,
}