/* 
    Los archivos de routes  declaran los enpoint que manejara el rest server asi como del tipo de peticion que se trata
    un endpont requiere el tipo de peticion, la ruta en la que se va a responder, y el controlador y/o funcion de un controaldor
    que contiene la logica de la respuesta de ese endpoint
*/
/* 
    Nota adicional: si la ruta tiene tres parametros el orden es el siguiene, ruta que se habilita, middlewares o validaciones que se
    requieren, controlador al que se permite el paso si todo es correcto
*/
const fs = require('fs');
const path = require('path');

//se importa el router de express
const { Router } = require('express');
//se importan las funciones controladoras para los diferentes enpoint 
const { responderEntrevista,handleFile, responderBarrido, responderVigilancia, responderBusqueda, responderOtra, multerUpload, multerUploadBusqueda, multerUploadOtra  } = require('../controllers/respuestas.controller');
//se importa el middleware para validar las rutas
// const { validarJWT } = require('../middlewares/validar-jwt');
// //se crea el roter para manejar las peticiones
const router = Router();

/*
    al hacer esta intruccion se le dice al servidor que todas las rutas que sigan despues necesitan tener
    un token valido en los headers, de esta forma se applica un middleware de forma "global" sin tener 
    que especificarlo endpoint a endpoint
*/ 
//router.use(validarJWT);
router.post('/responder-entrevista', handleFile, responderEntrevista )
router.post('/responder-barrido',handleFile, responderBarrido)
router.post('/responder-vigilancia',multerUpload.any(), responderVigilancia)
router.post('/responder-busqueda',multerUploadBusqueda.any(), responderBusqueda)
router.post('/responder-otra',multerUploadOtra.any(), responderOtra)

//se exporta el router para usarlo en el exterior
module.exports = router;