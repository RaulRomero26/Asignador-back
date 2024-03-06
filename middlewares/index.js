/* 
    archivo de barrir  para facilitar las exportaciones de los middelwares
    se usa sobre todo en los middelwares por que es mas comun que se use
    a lo largo de la gran mayoria de endpoins que los helpers que son usados en enpoints especificos
*/
const  validarCampos = require('../middlewares/validar-campos');
const validarJWT = require('../middlewares/validar-jwt');
const validaRoles = require('../middlewares/validar-roles');

module.exports = {
    ...validarCampos,
    ...validarJWT,
    ...validaRoles,
}