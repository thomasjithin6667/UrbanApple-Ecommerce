//imports

const express= require("express");
const user_route= express();
const path= require("path")
const userController = require("../controllers/userController")
const multer = require("multer")
const session = require("express-session")
const config = require("../config/config")
const auth =require("../middleware/auth")
const addressController = require('../controllers/addressController')
const cartController = require('../controllers/cartController')

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


//GET REQUESTS
user_route.get('/register',userController.loadRegister);
user_route.get('/',auth.isLogout,userController.loadHome)
user_route.get('/home',userController.loadUserHome)
user_route.get('/otp-page',userController.loadOTPpage)
user_route.get('/login',userController.loginLoad)
user_route.get('/userProfile',userController.loadUserProfile)
user_route.get('/logout',userController.userLogout)
user_route.get('/checkout',userController.loadCheckout)
user_route.get('/forgotpassword',userController.forgotPassword)
user_route.get('/edituser',userController.loadEditUser)
user_route.get('/changePassword',userController.loadUserPasswordReset)
user_route.get('/delete-user',userController.deleteUser)
//address
user_route.get('/address',addressController.loadAddress)
user_route.get('/addaddress',addressController.loadAddAddress)
user_route.get('/editaddress',addressController.loadEditAddress)
user_route.get('/deleteaddress',addressController.deleteAddress)
//product
user_route.get('/productlist',userController.productList)
user_route.get('/viewproduct/:productId',auth.isAuthenticated,userController.productView)


//cart
user_route.get('/cart',userController.loadCart)
//wishlist
user_route.get('/wishlist',userController.loadWishlist)




//POST REQUESTS
//user
user_route.post('/register',upload.single('image'),userController.insertUser)
user_route.post('/login',userController.verifyLogin)
user_route.post('/otpVerification',userController.OTPVerification)
user_route.post('/forgotpassword',userController.forgotPasswordOTP)
user_route.post('/passwordotpVerification',userController.passwordOTPVerification)
user_route.post('/resetpassword',userController.resetPassword )
user_route.post('/userResetpassword',userController.userResetPassword )
user_route.post('/edituser',upload.single('image'),userController.updateProfile)
//address
user_route.post('/addAddress',addressController.postAddAddress );
user_route.post('/editaddress',addressController.editAddress);
//cart
user_route.post('/add-to-cart/:productId', cartController.addtocart);






module.exports =user_route;