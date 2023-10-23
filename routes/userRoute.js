//imports

const express= require("express");
const user_route= express();
const path= require("path")
const userController = require("../controllers/userController")
const multer = require("multer")
const session = require("express-session")
const config = require("../config/config")
const auth =require("../middleware/auth")

//session setup
user_route.use(session({
    secret: config.sessionSecret ,
    resave: false, 
    saveUninitialized: true, 
  }));



//application middlewares

user_route.set('view engine','ejs')
user_route.set('views','./views/users')
user_route.use(express.static('public'))
user_route.use('assets/css',express.static(__dirname+'public'))
user_route.use("/public", express.static("public", { "extensions": ["js"] }));

user_route.use(express.json());
user_route.use(express.urlencoded({ extended: true }));


//file upload
const storage =multer.diskStorage({
    destination:function(req,file,cb){
     cb(null,path.join(__dirname,'../public/assets/images/userImages'))
    },
    filename:function(req,file,cb){
      const name=Date.now()+'_'+file.originalname
      cb(null,name);
    }

})

const upload =multer({storage:storage});

user_route.get('/register',userController.loadRegister);
user_route.get('/',userController.loadHome)
user_route.post('/register',upload.single('image'),userController.insertUser)
user_route.get('/otp-page',userController.loadOTPpage)
user_route.post('/otpVerification',userController.OTPVerification)
user_route.get('/login',userController.loginLoad)
user_route.post('/login',userController.verifyLogin)
user_route.get('/userProfile',userController.loadUserProfile)
user_route.get('/logout',userController.userLogout)
user_route.get('/productlist',userController.productList)





module.exports =user_route;