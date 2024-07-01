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
const { default: axios } = require('axios');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Middleware de Multer para manejar archivos
const handleFile = upload.single('image');

const CURRENT_DIR = __dirname
const MIMETYPES = ['image/jpeg','image/jpg','image/png', 'image/svg+xml', 'image/webp','application/octet-stream'] 

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

const multerUploadBusqueda = multer({
    storage: multer.diskStorage({
        destination: path.join(CURRENT_DIR,'../public/asignador/tareas/busqueda'),
        filename: (req, file, cb) => {
            console.log('ENTRO', path.extname(file.originalname))
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

const multerUploadOtra = multer({
    storage: multer.diskStorage({
        destination: path.join(CURRENT_DIR,'../public/asignador/tareas/otra'),
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
const multerUploadDetencion = multer({
    storage: multer.diskStorage({
        destination: path.join(CURRENT_DIR,'../public/asignador/tareas/detenciones'),
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

            axios.post(process.env.ENLACE_AURA+'/api/asignador/insert-entrevista', {entrevistas:inserts, id_tarea:data.id_tarea})
                    
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

        axios.post(process.env.ENLACE_AURA+'/api/asignador/insert-barrido', {barridos:arrayUbi, id_tarea:id_tarea})

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
        console.log(req.body);
        console.log(req.files);

        const { vigilancias, id_tarea } = req.body;

        // Verificar si vigilancias está definido y no es null
        let arrayVigilancias = [];
        if (vigilancias) {
            try {
                arrayVigilancias = JSON.parse(vigilancias);
            } catch (error) {
                throw new Error('Error al parsear vigilancias JSON');
            }
        }

        // Verificar que hayan llegado archivos
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                ok: false,
                msg: 'No se recibieron archivos',
            });
        }

        // Procesar cada vigilancia y su archivo asociado
        for (let i = 0; i < req.files.length; i++) {
            const vigilancia = arrayVigilancias[i];
            const filename = req.files[i].filename;

            // Insertar cada vigilancia en la base de datos
            const queryResult = await tareasPromisePool.query(
                `INSERT INTO tareas_vigilancia (id_tarea, descripcion, img) VALUES (?,?,?)`,
                [id_tarea, vigilancia.descripcion, filename]
            );

            console.log(`Vigilancia ${i + 1} insertada correctamente`);
        }

        // Actualizar el estado de la tarea a COMPLETADA
        const updateResult = await tareasPromisePool.query(
            `UPDATE tareas SET estado = 'COMPLETADA', fecha_completada = NOW() WHERE id_tarea = ?`,
            [id_tarea]
        );

        axios.post(process.env.ENLACE_AURA+'/api/asignador/insert-vigilancia', {vigilancias:arrayVigilancias, files:req.files, id_tarea:id_tarea})

        // Responder al cliente
        res.json({
            ok: true,
            msg: 'Vigilancia respondida',
            data: {
                message: 'Vigilancia respondida correctamente',
            },
        });
    } catch (error) {
        console.error('Error en responderVigilancia:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor',
            error: error.message, // opcional: enviar el mensaje de error específico
        });
    }
};



const responderBusqueda = async (req, res) => {
    try {

        console.log(req.body)
        const {busquedas,id_tarea} = req.body;

        console.log(req.files)

        if(req.files.length){
            arrayBus = JSON.parse(busquedas);
            arrayBus.forEach( async (busqueda,index) => {
                const queryResult = await tareasPromisePool.query(
                    `INSERT INTO tareas_busqueda (id_tarea, descripcion, img) VALUES (?,?,?)`,
                    [id_tarea, busqueda.descripcion, req.files[index].filename]
                )
            })

        }else{
            arrayBus = JSON.parse(busquedas);
            arrayBus.forEach( async (busqueda,index) => {
                const queryResult = await tareasPromisePool.query(
                    `INSERT INTO tareas_busqueda (id_tarea, descripcion ) VALUES (?,?)`,
                    [id_tarea, busqueda.descripcion]
                )
            })
        }

        const updateResult = await tareasPromisePool.query(
            `UPDATE tareas SET estado = 'COMPLETADA', fecha_completada = NOW() WHERE id_tarea = ?`,
            [id_tarea]
        )

        axios.post(process.env.ENLACE_AURA+'/api/asignador/insert-busqueda', {busquedas:arrayBus,files:req.files, id_tarea:id_tarea})

        res.json({
            ok: true,
            msg: 'Busqueda respondida',
            data: {
                message: 'Busqueda respondida correctamente',
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

const responderOtra = async (req, res) => {
    try {

        console.log(req.body)
        const {otra,id_tarea} = req.body;

        console.log(req.files)
    if(req.files.length){
        arrayOtr = JSON.parse(otra);
        arrayOtr.forEach( async (otra,index) => {
            const queryResult = await tareasPromisePool.query(
                `INSERT INTO tareas_otra (id_tarea, descripcion, img) VALUES (?,?,?)`,
                [id_tarea, otra.descripcion, req.files[index].filename]
            )
        })
    }else{
        arrayOtr = JSON.parse(otra);
            arrayOtr.forEach( async (otra,index) => {
                const queryResult = await tareasPromisePool.query(
                    `INSERT INTO tareas_otra (id_tarea, descripcion) VALUES (?,?)`,
                    [id_tarea, otra.descripcion]
                )
            })
    }
        

        const updateResult = await tareasPromisePool.query(
            `UPDATE tareas SET estado = 'COMPLETADA', fecha_completada = NOW() WHERE id_tarea = ?`,
            [id_tarea]
        )

        axios.post(process.env.ENLACE_AURA+'/api/asignador/insert-otra', {otras:arrayOtr,files:req.files, id_tarea:id_tarea})

        res.json({
            ok: true,
            msg: 'Otra respondida',
            data: {
                message: 'Otra respondida correctamente',
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

const responderDetencion = async(req,res) => {
    try {

        console.log(req.body)
        const {detenciones,id_tarea} = req.body;

        arrayDet = JSON.parse(detenciones);
        arrayDet.forEach( async (detencion,index) => {
            const queryResult = await tareasPromisePool.query(
                `INSERT INTO detenciones (id_tarea, nombre, direccion, no_remision,motivo) VALUES (?,?,?,?,?)`,
                [id_tarea, detencion.nombre, detencion.direccion, detencion.no_remision,detencion.motivo]
            )
        })


        const updateResult = await tareasPromisePool.query(
            `UPDATE tareas SET estado = 'COMPLETADA', fecha_completada = NOW() WHERE id_tarea = ?`,
            [id_tarea]
        )

        res.json({
            ok: true,
            msg: 'Detenciones respondido',
            data: {
                message: 'Detenciones respondido correctamente',
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
    responderBusqueda,
    responderOtra,
    handleFile,
    responderDetencion,
    multerUploadDetencion,
    multerUpload,
    multerUploadBusqueda,
    multerUploadOtra
}