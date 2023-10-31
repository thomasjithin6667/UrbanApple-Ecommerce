//imports

const express= require("express");
const admin_route= express();
const path= require("path")
const adminController = require("../controllers/adminController")
const checkoutController = require('../controllers/checkoutController')
const productController = require('../controllers/productController')
const categoryController = require('../controllers/categoryController')
const multer = require("multer")
const session = require("express-session")
const config = require("../config/config")
const auth =require("../middleware/adminAuth")
const fs = require('fs')


//session setup
admin_route.use(session({
    secret: config.sessionSecret ,
    resave: false, 
    saveUninitialized: true, 
  }));



//application middlewares

admin_route.set('view engine','ejs')
admin_route.set('views','./views/admin')
admin_route.use(express.static('public'))
admin_route.use('assets/css',express.static(__dirname+'public'))
admin_route.use("/public", express.static("public", { "extensions": ["js"] }));

admin_route.use(express.json());
admin_route.use(express.urlencoded({ extended: true }));


//  storage for category images
const categoryStorage = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, path.join(__dirname, '../public/assets/images/categoryImages'));
  },
  filename: function (req, file, cb) {
      const name = Date.now() + '_' + file.originalname;
      cb(null, name);
  }
});


const categoryUpload = multer({ storage: categoryStorage });






//  storage for product images

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
 
    
    cb(null, path.join(__dirname, '../public/assets/images/productImages'));
  },
  filename: function (req, file, cb) {
    const name = Date.now() + '_' + file.originalname;
    cb(null, name);
  },
});

// Create the Multer instance
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }
 
});

//GET REQUESTS
//admin
admin_route.get('/',adminController.loadAdminLogin)
admin_route.post('/',adminController.verifyLogin)
admin_route.get('/dashboard',auth.isLogin,adminController.loadDashboard);
admin_route.get("/logout",auth.isLogin,adminController.logout)
admin_route.get("/userlist",auth.isLogin,adminController.loadUserlist)
admin_route.get('/block-user',auth.isLogin,adminController.blockUser)

//product
admin_route.get("/addproduct",auth.isLogin,productController.loadaddProduct)
admin_route.get("/productlist",auth.isLogin,productController.loadProductList)
admin_route.get('/delete-product',auth.isLogin,productController.deleteProduct)
admin_route.get('/edit-product',auth.isLogin,productController.loadEditProduct)
admin_route.get('/show-product',auth.isLogin,productController.loadShowProduct)
admin_route.get('/unlist-product',auth.isLogin,productController.unlistProduct )
//category
admin_route.get("/addcategory",auth.isLogin,categoryController.loadaddCategory)
admin_route.get("/categorylist",auth.isLogin,categoryController.loadCategorylist)
admin_route.get('/edit-category',auth.isLogin,categoryController.loadEditCategory)
admin_route.get('/delete-category',auth.isLogin,categoryController.deleteCategory)
admin_route.get('/unlist-category',auth.isLogin,categoryController.unlistCategory )
//orders
admin_route.get('/orderlist',auth.isLogin,checkoutController.orderDetails )



//POST REQUESTS
//category
admin_route.post('/addcategory',auth.isLogin, categoryUpload.single('categoryImage'), categoryController.insertCategory);
admin_route.post('/edit-category',auth.isLogin,categoryUpload.single('categoryImage'),categoryController.editCategory);

//product
admin_route.post('/addproduct',auth.isLogin,upload.array('productImages', 4),productController.insertProduct);
admin_route.post('/edit-product',auth.isLogin,upload.array('productImages', 4),productController.editProduct);






admin_route.get('*',(req,res)=>{
    res.render('401-notAuthorized')
})


module.exports =admin_route;