//se importan el response y request de express para poder tener el tipado de los mismos
const { response, request } = require('express');
//se importa la biblioteca generadora de los token
const jwt = require('jsonwebtoken');

const { tareasPromisePool } = require('../database/configTareas');
/* 
    Recordando que los middlewares requieren tres parametros, la entrada que es la request, la salida que es la response y el next en caso de que todo sea efectiv
    se pueda salir del middelware y dar paso al siguiente middelware o al controlador de la ruta

    Este middelware valida un token, como se sabe dicho token debe de venir siempre presente en las peticiones
    se encapsula el token en los headers de las peticiones, 
*/
const validarJWT = async (req = request ,res = response, next) => {
    const token = req.header('x-token') // como se especifique aqui es como el front debe de mandarlo
    const id_ls = JSON.parse(req.header('x-user')).id
    if(!token){
        return res.status(401).json({
            msg: 'No hay token la peticion'
        })
    }
    
    try {
        //esto regresa el payload en claro
        const {id} = jwt.verify( token , process.env.SECRET_KEY);//es necesario saber que le metes al payload
        //relmacenaje en en el req para prevalecer en sesion
        //leer el usuario del uid
        const usuario = await tareasPromisePool.query(
            `SELECT * FROM usuarios WHERE id = ?`,
            [id]
        )
        if(usuario.current_active_token != null && usuario.current_active_token != ''){
            if(usuario.current_active_token != token){
                return res.status(401).json({
                    msg: 'Token no valido - hay otra sesion iniciada en otro dispositivo'
                })
            }
        }

        //console.log('veo el usuario del renew ', usuario)
        if(!usuario){
            return res.status(401).json({
                msg: 'Token no valido - usuario no existe DB'
            })
        }

        //validar que el usuario siga activo
        // if(!usuario.estado){
        //     return res.status(401).json({
        //         msg: 'Token no valido - usuario inactivado'
        //     })
        // }
        req.usuario = usuario;
        //console.log(  'LO QUE ETS AEN EL REQ USUARIO:',req.usuario )
        next();// con la funcion next se saca del middlware y se abre paso a lo que siga
    } catch (error) {
        console.log(error);

        await tareasPromisePool.query(
            `UPDATE usuarios SET sesion_iniciada = 0 WHERE id = ?`,
            [id_ls]
        )

        res.status(401).json({
            msg: 'Token no valido'
        })
    }
}
//se exporta la funcion para que pueda usarse por los demas
module.exports = {
    validarJWT
}