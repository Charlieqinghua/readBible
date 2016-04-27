/**
 * Created by liqinghua on 16/3/9.
 */

module.exports = function(app) {

    app.all('*', function(req, res, next){
        // 如果是登录页面或者 已经登录的话过
        // 拦截未登录用户
        if (!req.session.user && req.originalUrl != '/login'){
            res.redirect('/login');
        }else{
            if (req.originalUrl == '/'){
                res.redirect('/login');
            }
            next();
        }
    });

    // 主页
    require('./../controller/index.js')(app);
    // 登录
    require('./../controller/login.js')(app);
    // 管理页面
    require('./../controller/admin.js')(app);

};
