//se realiza la importacion de la biblioteca que ayuda a generar los token de autenticación
const jwt = require('jsonwebtoken');
/* 
    Esta funcion genera un nuevo token cada vez que es llamda
    en este caso se cifra en el tokeb el id de usuario y su id, hay planes para cifrar mas informacion util 
    el token es firmado por una palabra secreta del backend, y tiene un tiempo de vida estandar de una hora
    si ocurriece algun error se atrapa el error y se notifica al frontend
*/
const generarJWT = (id,name) => {

    return new Promise( (resolve, reject) => {

        const payload = {id,name};
        jwt.sign(payload,process.env.SECRET_KEY,{
            expiresIn: '24h'
        },(err,token) => {

            if(err){
                console.log(err)
                reject('No se pudo generar el token')
            }

            resolve(token);

        })

    }) 

}
// se expone la funcion que genera el token hacia el frente
module.exports = {
    generarJWT
}