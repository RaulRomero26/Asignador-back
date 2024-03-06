/* 
    Recordando que el validationResult es necesario para obtener algo usabe por el express-validator
    este archivo exporta dos funciones pues son validaciones la primera es la de validar campos,
    el expressvalidator ya sabe que hace un valor valido, se ve con mas claridad en los archivos de rutas
*/
//se importan las bibliotecas y funciones necesarias para las validaciones
const { validationResult } = require('express-validator');
const  macaddress  = require('macaddress');
//se importan los helper necesarios
//const { existeUsuarioMac } = require('../helpers/db-validatos');

//esa funcion valida todos los campos de cualquier objeto que venga en el body de una peticion
//para evitar dar una respuesta que no se debe o falsos positivos si hay peticiones sin informacion completa
const validarCampos = (req,res, next) => {
    console.log(req.body)
    const errors = validationResult(req);

    console.log('ERRORS PARA EL USUARIO',errors)
    console.log(errors.isEmpty())
    if(!errors.isEmpty()){
        //return res.status(400).json(errors);
    }

    next();
}
/* Funcion de validacion de la mac, obtengo la mac del equipo donde se inicia sesion
    Busco un usuario con esa mac si lo hay lo regreso, si no lo hay, equipo no autorizado
    Si si encontre un usuario comparo el correo del body contra el que regreso
    no son iguales, no es el equipo del usuario. 
*/
/*const validarMac =  async (req, res, next) => {
    let macHost = await macaddress.one();
    console.log('host: ',macHost);
    let macDB = await existeUsuarioMac(macHost)

    if(macDB.ok == false ){
        return res.status(401).json({
            msg: 'Este equipo no esta autorizado o asociado a un ususario'
        });
    }else{
        if(macDB.existeMac.correo != req.body.correo){
            return res.status(401).json({
                msg: 'El equipo no es el asignado al ususario'
            });
        }
    }

    next();
}*/
//se exponen las funciones al exterior para poder utilizarlas
module.exports ={
    validarCampos,
}