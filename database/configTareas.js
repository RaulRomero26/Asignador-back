//se require la biblioteca para hacer el manejo de las conexiones a la base de datos sql
const mysql = require('mysql2');

/* 
    La biblioteca msql2 nos permite crear una alberca o pool de multiples conexiones, con el objetivo de que cada una de ellas tenga un tiempo de vida, 
    es decir se crean con esta configuracion 50 lineas de comunicacion, cuando se realiza una peticion al servidor se usa una de esas lineas
    despues de un tiempo la linea se encuentra inactiva esta se libera 
*/

const tareasPool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'asignador_tareas',
    waitForConnections: true,
    connectionLimit: 50,
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci',
    maxIdle: 50, // max idle connections, the default value is the same as `connectionLimit`
    idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000 5 min
    queueLimit: 0
})
// con el pool de conexiones creado, se convierte a un promise pool para poder usar funciones asyncronas
const tareasPromisePool = tareasPool.promise();

//lo que se expone es el promise pool y es el que se llamara siempre que se requiera una conexion a la base de datos
module.exports = {
    tareasPromisePool
}