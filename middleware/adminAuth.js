const isLogin = async (req, res, next) => {
    try {
        if (req.session.user_id) {

        } else {
            res.redirect('401-notAuthorized');
        }
        next();

    } catch (error) {
        console.log(error.message);
    }

}



const isLogout = async (req, res, next) => {
    try {

        if (req.session.user_id) {
            res.redirect('/admin/home');
        }else{
            next();

        }
       

    } catch (error) {
        console.log(error.message);
    }

}

module.exports = {
    isLogin,
    isLogout
}