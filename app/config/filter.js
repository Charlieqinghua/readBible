/**
 * Created by liqinghua on 16/3/10.
 */

module.exports.authorize = function (req, res, next){
    if (req.session.user){
        res.redirect('/');
    }else {
        next();
    }
}