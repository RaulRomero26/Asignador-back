/*
    Este controlador maneja las funciones para el manejor de las rutas de remisiones
*/
//se importan la request y la response de express para tener el tipado
const { response, request } = require('express');

//Esta funcion obtiene todos los usuarios del sistema, que sean activos, se pueden paginar  

const fs = require('fs');
const path = require('path');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


const imageGet = async (req, res) => {
    try {

        const type = req.params.type;
        const image = req.params.image;
        //console.log(__dirname);
        const pathImage = path.resolve(__dirname,`../public/asignador/tareas/${type}/${image}`);
        //console.log('VER EL PATH:',pathImage);
        if(await fs.existsSync(pathImage)){
           res.sendFile(pathImage); 
        }else{
            const pathNoImage = path.resolve(__dirname,`../public/asignador/tareas/noimage/noimage.webp`);
            res.sendFile(pathNoImage); 
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            msg: 'Internal Server Error',
        });
    }
};



//se exportan las diferentes funciones hacia el exterior
module.exports = {
    imageGet
}