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
            const {tipo_tarea,instrucciones,folio_sic,asignado_a}  = req.body;
            // Primero, realizamos la inserción
            const insertResult = await tareasPromisePool.query(
                `INSERT INTO tareas(tipo, instruccion, folio_sic, asignado) VALUES (?,?,?,?)`,
                [tipo_tarea,instrucciones,folio_sic,asignado_a]
            );

            // Luego, obtenemos el último ID insertado
            const lastInsertedId = insertResult[0].insertId;

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