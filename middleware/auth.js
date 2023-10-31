const isLogin= async(req,res,next)=>{
try{
    if(req.session.user_id){

    }else{
     res.redirect('/login');
    }
    next();

}catch(error){
    console.log(error.message);
}

}






const isAuthenticated = (req, res, next) => {
    if (!req.session.user) {

        req.session.originalUrl = '/userproductlist';
          return res.redirect('/login');
  
  } else {
      next();
  }
  }
  



const isLogout= async(req,res,next)=>{
    try{

        if(req.session.user_id){
           
            res.redirect('/home');
        }else{

            next();
        }
    
    }catch(error){
        console.log(error.message);
    }
    
    }



    
const isLogoutStore= async(req,res,next)=>{
    try{

        if(req.session.user_id){
           
            res.redirect('/userproductlist');
        }else{

            next();
        }
    
    }catch(error){
        console.log(error.message);
    }
    
    }


module.exports={
    isLogin,
    isLogout,
    isAuthenticated,
    isLogoutStore
}