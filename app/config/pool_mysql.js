/**
 * Created by liqinghua on 16/3/9.
 */

const mysql = require('mysql');

const pool = mysql.createPool({
    host     : '127.0.0.1',
    user     : 'root',
    password : 'root',
    database : 'read_bible',
    dateStrings:'true'
});

pool.on('connection',function(connection){
    console.log('connection...');
});

module.exports = pool;

module.exports.query = pool.query;