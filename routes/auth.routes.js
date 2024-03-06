/* 
    Los archivos de routes  declaran los enpoint que manejara el rest server asi como del tipo de peticion que se trata
    un endpont requiere el tipo de peticion, la ruta en la que se va a responder, y el controlador y/o funcion de un controaldor
    que contiene la logica de la respuesta de ese endpoint
*/
/* 
    Noda adicional: si la ruta tiene tres parametros el orden es el siguiene, ruta que se habilita, middlewares o validaciones que se
    requieren, controlador al que se permite el paso si todo es correcto
*/
//Se importa el router de express
const { Router } = require('express');
//se importa la funcion de check de express-validator, esta sirve para revisar el contenido del cuerpo de las peticiones
const { check } = require('express-validator');
//Se importan las funciones del controlador asignado a las rutas
const { login,revalidarToken,nuevoUsuario,logout } = require('../controllers/auth.controller');
//se importan los middlewares necesarios para validar las rutas
const { validarCampos } = require('../middlewares/validar-campos');
const { validarJWT } = require('../middlewares/validar-jwt');
//se crea el router que manejara los diferentes endpoint
const router = Router();

//enpoint para manejar el login al sistema de los usuarios
router.post('/login', [
    check('password','La contraseña es obligatoria').not().isEmpty(),
    // validarMac,
    validarCampos
],login )

router.post('/new',nuevoUsuario)

//endpoint que se encarga de regenerar los token de validacion
router.post('/renew',[
    validarJWT
], 
revalidarToken)

router.post('/logout',logout)

module.exports = router;