/**
 * Created by liqinghua on 16/3/9.
 */

var pool = require('../config/pool_mysql.js');
//var md5 = require('md5');
module.exports = function(app) {
    var static_url = app.debug?'/app':'/dist';

    app.post('/login', function(req, res, next){
        var user = req.body['user'];
        var password = req.body['password'];
        var remember = req.body['remember'];
        //console.log(remember);

        pool.query('select * from sys_user where sysUser = ? and sysPass = ?', [user, password], function(err, rows){
            if (rows.length == 1){
                req.session.user = rows[0];
                res.redirect('/admin');
            }else{
                console.log('登录失败...');
                res.redirect('/');
            }
        });

    });
    app.get('/login',function(req, res, next){
        res.render('login', { title: '登录', static_url:static_url });
    });
}