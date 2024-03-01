/*
    Este controlador se encarga de los enpoint de phrassal verbs
*/


//se importan la request y la response de express para tener el tipado
const { response, request } = require('express');
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
                const uploadPath = path.join(__dirname, '../public/asignador/tareas', `${lastInsertedId}${extension}`);
    
                // Escribe el archivo en la ubicación deseada
                fs.writeFileSync(uploadPath, req.file.buffer);
            }



            res.json({
                ok: true,
                msg: 'POST TAREA CREADA',
                data: {
                    message: 'Tarea creada exitosamente',
                    id: lastInsertedId
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
        const { page = 1, per_page } = req.query;
        
        const offset = (page - 1) * per_page;

        const queryResult = await tareasPromisePool.query(
            `SELECT * FROM tareas LIMIT ?, ?;`,
            [offset, parseInt(per_page)]
        );
        
        const totalRegisters = await tareasPromisePool.query(
            `SELECT COUNT(*) AS total FROM tareas ;`
        )

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
            `SELECT * FROM tareas WHERE id_tarea = ?`,
            [id]
        );
        console.log( queryResult[0])
        res.json({
            ok: true,
            msg: 'GET TAREA ID',
            data: {
                tareas: queryResult[0],
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