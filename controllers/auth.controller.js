/* 
    Controlador que exporta todas las funciones de para las rutas de autenticacion
*/
// se importa response de express para tener el tipado
const { response } = require("express");
//se importa bcrypt biblioteca que se encarga de hacer el cifrado de las contraseñas
const bcryptjs = require('bcryptjs')
//se importa la biblioteca generadora de los token
const jwt = require('jsonwebtoken');
const { tareasPromisePool } = require('../database/configTareas');
//se importa el helper que genera el token de acceso
const { generarJWT } = require("../helpers/generar-jwt");
/*
    funcion que se encarga de llevar el proceso de login de los ususarios, con sus respectivas validaciones
*/
const login = async (req, res = response) => {

    console.log('ENTRE A LOGIN ENTRE A LOGIN ')

    const { username, password } = req.body;
  
    try {
      // Verificar si el email existe
      const result = await tareasPromisePool.query('SELECT * FROM usuarios WHERE username = ?', [username]);
      const usuario = result[0];
      //console.log(usuario[0].contraseña)
      if (!usuario) {
        return res.status(400).json({
          msg: 'Usuario / Password no son correctos - correo'
        });
      }

      // if (usuario[0].sesion_iniciada) {
      //   return res.status(400).json({
      //     msg: 'Ya has iniciado sesion en otro dispositivo o navegador'
      //   });
      //}
  
      // Verificar si el usuario está activo
      // if (!usuario.estado) {
      //   return res.status(400).json({
      //     msg: 'Usuario inactivado'
      //   });
      // }
  
      // Verificar la contraseña
      const validPassword = bcryptjs.compareSync(password, usuario[0].password);
      if (!validPassword) {
        return res.status(400).json({
          msg: 'Usuario / Password no son correctos - password'
        });
      }
      
      // Generar el JWT
      const token = await generarJWT(usuario[0].id);

      // Actualizamos el token valido.
      // const updateToken = await tareasPromisePool.query('UPDATE usuarios SET current_active_token = ?, sesion_iniciada = 1 WHERE id = ?', [token,usuario[0].id]);
      // console.log(updateToken,token)
      //console.log('a ver al usuario ', usuario);
      res.json({
        msg: 'Login ok',
        usuario: usuario[0],
        token
      });
  
    } catch (error) {
      console.log(error);
      res.status(500).json({
        msg: 'Hable con el administrador'
      });
    }
  }
/*
    Esta funcion realiza la validacion del jwt se hace en auth 
    pues se requiere el usuario y contraseña del usuario
*/
const revalidarToken = async (req,res = response)=> {
    //como desde el miidelware modificas el req aca ya tienes la info 
    //console.log('entro al revalidar', req)
    //const {uid,name} = req.body
    // req.usuario.id= req.usuario.id; req.usuario.name=req.usuario.nombre
    const {id,username,nombre_completo,rol,img} = req.body;
    //console.log('ESTAMOS EN REVALIDAR: ',req.body)
   //regenerando un token
    //console.log('revalidadtoken : ',{id,nombre_completo,rol,img,correo,id_customer_stripe,id_subscription_active_stripe,id_subscription})
    const token = await generarJWT(id,nombre_completo);

    const updateToken = await tareasPromisePool.query('UPDATE usuarios SET current_active_token = ? WHERE id = ?', [token,id]);

    res.json({
        ok:true,
        id,
        name:nombre_completo,
        rol,
        img,
        username,
        token,
    })
}


const logout = async (req, res = response) => {




    const token = req.header('x-token') // como se especifique aqui es como el front debe de mandarlo

    let id_ls;
    if(req.header('x-user')){
      id_ls = JSON.parse(req.header('x-user')).id
    }

  if(!token){
      return res.status(401).json({
          msg: 'No hay token la peticion'
      })
  }
  
  try {
      //esto regresa el payload en claro
      const {id} = jwt.verify( token , process.env.SECRET_KEY);//es necesario saber que le metes al payload
      //relmacenaje en en el req para prevalecer en sesion
      console.log('ID DEL VRIFY,: ',id)
      //leer el usuario del uid
      // const updateToken = await tareasPromisePool.query('UPDATE usuarios SET current_active_token = "", sesion_iniciada = 0 WHERE id = ?', [id]);
      // console.log(updateToken)

      return res.status(201).json({
        msg: 'Sesion Eliminada'
    })
  } catch (error) {
    console.log(error);

    if (error.message === 'jwt malformed') {
      console.log('entre al error de malformed')
      // await tareasPromisePool.query(
      //     `UPDATE usuarios SET sesion_iniciada = 0 WHERE id = ?`,
      //     [id_ls]
      // )
      return res.status(400).json({
          msg: 'Token malformado'
      });
  }
    if(req.header('x-user')){
      // await tareasPromisePool.query(
      //  `UPDATE usuarios SET sesion_iniciada = 0 WHERE id = ?`,
      //  [id_ls]
      // )
    }

    res.status(500).json({
      msg: 'Hable con el administrador'
    });
  }
}


const nuevoUsuario = async (req, res = response) => {
  console.log('ENTRE AL POST DE REGISTRO: ', req.body)
    try {
        const rol = "USER_ROLE"
        const img = "default.png"
        const {name,username,password} = req.body; //se recomienda desestructurar para validar y obligar a que manden esas propiedades
        console.log('entre despues del REQ BODY USUARIO')
        const salt = bcryptjs.genSaltSync();
        const response = await tareasPromisePool.query(
            `INSERT INTO usuarios(name,username,password,rol, img) VALUES(?,?,?,?,?)`,
            [name,username,bcryptjs.hashSync(password,salt),rol,img]
        )
        const nuevoRegistroId = response.insertId;
       
        res.json({
            ok: true,
            name,
            username,
            rol,
            id:nuevoRegistroId,
            img:img,
            msg: 'post API usuario creado correctamente '
        })
    } catch (error) {
        return res.status(400).json({ error });
    }

}
//Se exportan las funciones controladoras de las rutas
module.exports = {
    login,
    revalidarToken,
    nuevoUsuario,
    logout
}