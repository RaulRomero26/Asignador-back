/* 
    Los archivos de routes  declaran los enpoint que manejara el rest server asi como del tipo de peticion que se trata
    un endpont requiere el tipo de peticion, la ruta en la que se va a responder, y el controlador y/o funcion de un controaldor
    que contiene la logica de la respuesta de ese endpoint
*/
/* 
    Noda adicional: si la ruta tiene tres parametros el orden es el siguiene, ruta que se habilita, middlewares o validaciones que se
    requieren, controlador al que se permite el paso si todo es correcto
*/
//se importa el router de express
const { Router } = require('express');
//se importa la funcion de check de express-validator, esta sirve para revisar el contenido del cuerpo de las peticiones
const { check } = require('express-validator');
//se importan las funciones controladoras para los diferentes enpoint 
const { imageGet } = require('../controllers/images.controller');

//const { validarJWT } = require('../middlewares/validar-jwt');
//se crea el roter para manejar las peticiones
const router = Router();

// router.use(validarJWT);
//Nota: se pone / la ruta real se configura por el middleware .use() en la clase del server
//endpoint que regresa todos los usuarios
router.get('/:type/:image', imageGet ) //no se ejecuta se manda la referencia a la funcion

//exportacion del router al exterior
module.exports = router;