/*
    Este controlador se encarga de los enpoint de phrassal verbs
*/


//se importan la request y la response de express para tener el tipado
const { response, request } = require('express');
//se importa el conector con la base de datos
const { tareasPromisePool } = require('../database/configTareas');


const catalogoUsuarios = async (req, res) => {
    try {
            const queryResult = await tareasPromisePool.query(
                `SELECT DISTINCT username from usuarios 
                WHERE rol != 'ADMIN_ROLE'
                ORDER BY username ASC`
            )
 
         
            res.json({
                ok: true,
                msg: 'Catalogo de usuarios',
                data: {
                    usuarios: queryResult[0],
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


module.exports = {
    catalogoUsuarios,
}