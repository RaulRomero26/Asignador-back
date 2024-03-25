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

const CURRENT_DIR = __dirname
const MIMETYPES = ['image/jpeg','image/png', 'image/svg+xml', 'image/webp'] 

const multerUpload = multer({
    storage: multer.diskStorage({
        destination: path.join(CURRENT_DIR,'../public/asignador/tareas/vigilancia'),
        filename: (req, file, cb) => {
            const fileExtension = path.extname(file.originalname)
            const filename = file.originalname.split(fileExtension)[0];
            console.log('filename',filename)
            cb(null,`${filename}-${Date.now()}${fileExtension}`)
        }
    }),
    fileFilter: (req,file, cb) => {
        if(MIMETYPES.includes(file.mimetype)) cb(null,true)
        else cb(new Error (`Only ${MIMETYPES.join(' ')} mimetypes are awllowed`))
    } ,
    limits: {
        fieldSize: 10000000
    },
})



const responderEntrevista = async (req, res) => {
    try {
            console.log(req.body)
            let data = req.body

            const inserts = [];
            const processedIndexes = {};
            
            for (const key in data) {
              if (Object.prototype.hasOwnProperty.call(data, key)) {
                const parts = key.split('_');
                const index = parts[parts.length - 1];
                
                if (!isNaN(index) && !processedIndexes[index]) {
                  const insertData = {
                    nombre_entrevistado: data[`nombre_entrevistado_${index}`],
                    telefono_entrevistado: data[`telefono_entrevistado_${index}`],
                    tipo_entrevistado: data[`tipo_entrevistado_${index}`],
                    entrevista: data[`entrevista_${index}`],
                    id_tarea: data.id_tarea
                  };
                  
                  inserts.push(insertData);
                  processedIndexes[index] = true;
                }
              }
            }
            
            console.log(inserts);

            inserts.map(async (insert) =>{

                 const queryResult = await tareasPromisePool.query(
                     `INSERT INTO tareas_entrevista (id_tarea,nombre_entrevistado,telefono_entrevistado,tipo_entrevistado,entrevista) VALUES (?,?,?,?,?)`,
                     [insert.id_tarea, insert.nombre_entrevistado,insert.telefono_entrevistado,insert.tipo_entrevistado,insert.entrevista]
                 )
            } )
         
                const updateResult = await tareasPromisePool.query(
                    `UPDATE tareas SET estado = 'COMPLETADA', fecha_completada = NOW() WHERE id_tarea = ?`,
                    [data.id_tarea]
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

const responderBarrido = async (req, res) => {
    try {

        console.log(req.body)
        const {ubicaciones,id_tarea} = req.body;

        arrayUbi = JSON.parse(ubicaciones);
        arrayUbi.forEach( async (ubicacion,index) => {
            const queryResult = await tareasPromisePool.query(
                `INSERT INTO tareas_barrido (id_tarea, coordenada_x, coordenada_y, camaras, descripcion) VALUES (?,?,?,?,?)`,
                [id_tarea, ubicacion.lng, ubicacion.lat, ubicacion.huboCamaras, ubicacion.descripcion]
            )
        })


        const updateResult = await tareasPromisePool.query(
            `UPDATE tareas SET estado = 'COMPLETADA', fecha_completada = NOW() WHERE id_tarea = ?`,
            [id_tarea]
        )


        res.json({
            ok: true,
            msg: 'Barrido respondido',
            data: {
                message: 'Barrido respondido correctamente',
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

const responderVigilancia = async (req, res) => {
    try {

        console.log(req.body)
        const {vigilancias,id_tarea} = req.body;

        console.log(req.files)

        arrayVig = JSON.parse(vigilancias);
        arrayVig.forEach( async (vigilancia,index) => {
            const queryResult = await tareasPromisePool.query(
                `INSERT INTO tareas_vigilancia (id_tarea, tipo, descripcion, img) VALUES (?,?,?,?)`,
                [id_tarea, vigilancia.tipo, vigilancia.descripcion, req.files[index].filename]
            )
        })


        const updateResult = await tareasPromisePool.query(
            `UPDATE tareas SET estado = 'COMPLETADA', fecha_completada = NOW() WHERE id_tarea = ?`,
            [id_tarea]
        )

        res.json({
            ok: true,
            msg: 'Barrido respondido',
            data: {
                message: 'Barrido respondido correctamente',
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
    responderEntrevista,
    responderBarrido,
    responderVigilancia,
    handleFile,
    multerUpload
}