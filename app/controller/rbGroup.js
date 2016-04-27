/**
 * Created by liqinghua on 16/3/10.
 */

var pool = require('../config/pool_mysql.js');
var Promise = require('promise');
var moment = require('moment');

module.exports = function(app){
    var static_url = app.debug?'/app':'/dist';
    var renderBody = { title: '小组', static_url:static_url };
    // 小组主页
    app.get('/admin/group',function(req, res, next){
        var sysUser = req.session.user.sysUser;
        getGroupByUserId(sysUser).then(function(rows) {
            if (rows.length > 0) res.redirect('/admin/group/'+rows[0].id);
            else next();
        });
    });
    /**
     * 拦截所有参数为groupId 的请求,添加小组详细信息
     */
    app.param('groupId', function(req, res, next, groupId){
        getGroupInfo(groupId).then(function(info){
            renderBody.groupInfo = info;
            return getUserByGroup(groupId);
        }).then(function(rows){
            renderBody.groupUser = rows;
            next();
        });
    });

    /**
     * 查询此用户的读经信息
     */
    app.param('userId', function(req, res, next, userId){
        next();
    });

    // 具体某个小组
    app.get('/admin/group/:groupId', function(req, res, next){
        //renderBody
        var sysUser = req.session.user.sysUser;
        // 管理账户所有分组
        getGroupByUserId(sysUser).then(function(rows){
            renderBody.groupRows = rows;
            res.render('rbGroup',renderBody);
        });
    });

    // 添加该小组的读经信息
    app.get('/admin/group/:groupId/edit', function(req, res, next){
        //renderBody
        var sysUser = req.session.user.sysUser;
        if (renderBody.groupUser.length > 0){
            var userId = renderBody.groupUser[0].id;
            res.redirect('edit/'+userId);
        }else{
            res.send('小组没有成员!');
        }
    });

    /**
     * 编辑具体某个用户的读经信息
     */
    app.get('/admin/group/:groupId/edit/:userId', function(req, res, next){
        getGroupPlanDetail(req.params.groupId, null).then(function(rows){
            renderBody.dailyPlan = rows;
            return getUserReadBibleContent(req.params.groupId, req.params.userId, rows[0].id);
        }).then(function(rows){
            if (rows.length > 0){
                renderBody.dailyRecord = rows[0].content;
            }else{
                renderBody.dailyRecord = '';
            }
            renderBody.day = moment().format('YYYY-MM-DD');
            res.render('rbGroupEdit', renderBody);
        });
    });
    /**
     *  保存信息
     */
    app.post('/admin/group/:groupId/edit/:userId', function(req, res, next){
        var content = req.body.content;
        var dayForChapter = req.body.dayForChapter;
        var selectData = req.body.selectData;
        console.log(req.params);
        deleteUserRecord(req.params.groupId, req.params.userId, dayForChapter).then(function (rows){
            return saveUserRecord(req.params.groupId, req.params.userId, content, dayForChapter);
        }).then(function(rows){
            res.send('ok');
        });
    });

    /**
     * 根据用户Id 查询出所管理的小组信息
     * TODO  beta1 查出所有小组
     * @param userId
     */
    function getGroupByUserId(userId) {
        return new Promise(function (resolve, reject) {
            var sql = 'select * from rb_group';
            pool.query(sql, function(err, rows){
                if(err) reject(err);
                else resolve(rows);
            });
        });
    }

    /**
     *  获取小组详细信息
     * @param groupId
     */
    function getGroupInfo(groupId) {
        return new Promise(function (resolve, reject) {
            var sql = 'select * from rb_group where 1=1 ';
            if (groupId){
                sql += 'and id=?';
            }
            pool.query(sql, [groupId], function(err, rows){
                if (err) reject(err);
                else {
                    if (rows.length == 1)resolve(rows[0]);
                    else resolve(null);
                }
            });
        });
    }

    /**
     * 根据小组获取所有用户
     * @param groupId
     */
    function getUserByGroup(groupId){
        return new Promise(function (resolve, reject) {
            var sql = 'select * from rb_user where 1=1 ';
            if (groupId){
                sql += 'and groupId=?';
            }
            pool.query(sql,[groupId], function(err, rows){
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    /**
     * 查询用户读经信息
     * @param userId
     */
    function getUserReadBibleContent(groupId ,userId, planDetailId){
        return new Promise(function(resolve, reject){
            var sql = 'select * from rb_daily_record where 1=1 ';
            if (groupId){
                sql += 'and groupId=? '
            }
            if (userId){
                sql += 'and userId=? ';
            }
            if (planDetailId){
                sql += 'and planDetailId=? ';
            }
            sql += 'limit 10';
            pool.query(sql, [groupId, userId, planDetailId], function(err, rows){
                if(err) reject(err);
                else resolve(rows);
            });
        });
    }

    /**
     * 查询小组读经计划
     * @param groupId
     * @param time 时间
     */
    function getGroupPlanDetail(groupId, time){
        return new Promise(function(resolve, reject){
            var sql = 'select b.chs, pd.* from rb_plan_detail pd, rb_group g, rb_bible b '+
                        'where 1=1 and g.groupPlanId = pd.plan_Id ' +
                        'and pd.bible_id = b.id ';
            if (groupId){
                sql += 'and g.id = ? ';
            }
            if (time){
                sql += 'and (TO_DAYS(?)-TO_DAYS(g.groupPlanStartTime)+1) = pd.day ';
            }else{
                sql += 'and (TO_DAYS(now())-TO_DAYS(g.groupPlanStartTime)+1) = pd.day ';
            }
            sql += 'order by pd.flag ';
            sql += 'limit 10 ';
            pool.query(sql, [groupId, time], function(err , rows){
                if(err) reject(err);
                else resolve(rows);
            });
        });
    }

    /**
     * 删除笔记记录
     * @param groupId
     * @param userId
     * @param planDetailId
     * @returns {*|exports|module.exports}
     */
    function deleteUserRecord(groupId, userId, planDetailId){
        return new Promise(function(resolve, reject){
            var sql = 'delete from rb_daily_record where groupId=? and userId=? and planDetailId = ?';
            pool.query(sql, [groupId, userId, planDetailId],function (err, rows){
                if(err) reject(err);
                else resolve(rows);
            });
        });
    }

    /**
     * 保存笔记记录
     * @param groupId
     * @param userId
     * @param content
     * @param planDetailId
     * @returns {*|exports|module.exports}
     */
    function saveUserRecord(groupId, userId, content, planDetailId){
        return new Promise(function(resolve, reject){
            var sql = 'insert into rb_daily_record(groupId, userId, content, planDetailId, readTime)values(?,?,?,?,now())';
            pool.query(sql, [groupId, userId, content, planDetailId],function (err, rows){
                if(err) reject(err);
                else resolve(rows);
            });
        });
    }
};