/* 
    Este middleware se creo con el objetivo de poder determinar si un usuario tiene o no los suficentes permisos para poder
    acceder a determinados endpoint de la aplicación, se penso en exponer uno que determine si es administrador por tema
    de priviliegios, y exponer otro middelware y verificar que el usuario tenga un rol valido en la aplicacion
*/
const { response } = require("express")
//Midelware que verifica si es administrador , endpoint protejido por el jwt y con manejo de errores
const esAdminRole = (req, res = response, next) => {

    if(!req.usuario){
        return res.status(500).json({
            msg: 'Se quiere verificar el role sin validar el token primero'
        });
    }
    const {rol , nombre } = req.usuario; 

    if(rol !== 'ADMIN_ROLE'){
        return res.status(401).json({
            msg: `${ nombre } no es administrador - No puede hacer esto`
        });
    }

    next();
}
//ojo esto es cuando es un middleware  y requieres mandarle mas parametros, se utiliza cuando quieres verificar
//si tal rol existe si es asi puede pasar si no existe es inexistente, se ocuparia cuando se hace el registro
//de usuarios pues el rol es uno de los campos que se solicitan para llevarlo a cabo
const tieneRole = ( ...roles ) => {
    return (req, res = response, next) => {
        if(!req.usuario){
            return res.status(500).json({
                msg: 'Se quiere verificar el role sin validar el token primero'
            });
        }
        if(!roles.includes(req.usuario.rol)){
            return res.status(401).json({
                msg: `El servicio requiere uno de estos roles ${roles}`
            });
        }

        next();
    }
}

module.exports = {
    esAdminRole,
    tieneRole
}