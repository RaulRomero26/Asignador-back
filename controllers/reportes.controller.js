/*
    Este controlador se encarga de los enpoint de phrassal verbs
*/


//se importan la request y la response de express para tener el tipado
const { response, request } = require('express');
//se importa el conector con la base de datos
const { tareasPromisePool } = require('../database/configTareas');


const getReportes = async (req, res) => {
    const { usuario, fechaInicio, fechaFin } = req.query;
    console.log(req.query);
    try {

        let usuarioString = '';
        if(usuario != ''){
            usuarioString = `WHERE asignado_a = '${usuario}'`
        }

        let dateString = ''; 
        
        let inicioCad = '';
        if(usuario == ''){
            inicioCad = 'WHERE '
        }else{
            inicioCad = 'AND '
        }


        if(fechaInicio !='' && fechaFin == ''){
            dateString = `${inicioCad} DATE(fecha_asignacion) BETWEEN '${fechaInicio}' AND NOW()`
        }
        if(fechaInicio !='' && fechaFin != ''){
            dateString = `${inicioCad} DATE(fecha_asignacion) BETWEEN '${fechaInicio}' AND '${fechaFin}'`
        }
        if(fechaInicio =='' && fechaFin != ''){
            dateString = `${inicioCad} DATE(fecha_asignacion) <= '${fechaFin}'`
        }

        const query = `SELECT * from tareas_instrucciones_respuestas ${usuarioString} ${dateString}`;
        console.log(query);

        const queryResult = await tareasPromisePool.query(query);

        const queryTotales  = `SELECT 
                            asignado_a, 
                            SUM(CASE WHEN estado = 'COMPLETADA' THEN 1 ELSE 0 END) AS completadas,
                            SUM(CASE WHEN estado = 'EN PROCESO' THEN 1 ELSE 0 END) AS en_proceso,
                            SUM(CASE WHEN tipo_tarea = 'ENTREVISTA' THEN 1 ELSE 0 END) AS total_entrevistas,
                            SUM(CASE WHEN tipo_tarea = 'BARRIDO' THEN 1 ELSE 0 END) AS total_barridos,
                            SUM(CASE WHEN tipo_tarea = 'VIGILANCIA' THEN 1 ELSE 0 END) AS total_vigilancia,
                            SUM(CASE WHEN tipo_tarea = 'BUSQUEDA' THEN 1 ELSE 0 END) AS total_busqueda,
                            SUM(CASE WHEN tipo_tarea = 'OTRA' THEN 1 ELSE 0 END) AS total_otra,
                            fecha_asignacion
                        FROM 
                            tareas 
                        ${usuarioString} ${dateString}
                        GROUP BY asignado_a`;
        console.log(queryTotales);

        const queryResultTotales = await tareasPromisePool.query(queryTotales);
        
        res.json({
            ok: true,
            msg: 'Reportes productividad',
            data: {
                instrucciones: queryResult[0],
                totales: queryResultTotales[0],
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
    getReportes,
}