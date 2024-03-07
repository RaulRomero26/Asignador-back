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



const responderEntrevista = async (req, res) => {
    try {
            const {id_tarea,nombre_entrevistado,telefono_entrevistado,tipo_entrevistado,entrevista}  = req.body;
         
                const queryResult = await tareasPromisePool.query(
                    `INSERT INTO tareas_entrevista (id_tarea,nombre_entrevistado,telefono_entrevistado,tipo_entrevistado,entrevista) VALUES (?,?,?,?,?)`,
                    [id_tarea, nombre_entrevistado,telefono_entrevistado,tipo_entrevistado,entrevista]
                )

                const updateResult = await tareasPromisePool.query(
                    `UPDATE tareas SET estado = 'COMPLETADA', fecha_completada = NOW() WHERE id_tarea = ?`,
                    [id_tarea]
                )
                    
            res.json({
                ok: true,
                msg: 'Entrevista respondida',
                data: {
                    message: 'Entrevista respondida correctamente',
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
    responderEntrevista,
    handleFile,
}