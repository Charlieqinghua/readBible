/**
 * Created by liqinghua on 16/3/7.
 */

// 读经小组的路由

module.exports = function (app) {
    var static_url = app.debug?'/app':'/dist';
    /* GET admin page. */
    app.get('/admin', function(req, res, next) {
        res.render('admin',{title:'管理中心', static_url:static_url});
    });
    // 加载分组
    require('./rbGroup.js')(app);

};
