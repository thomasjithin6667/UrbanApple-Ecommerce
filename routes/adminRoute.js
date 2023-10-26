//imports

const express= require("express");
const admin_route= express();
const path= require("path")
const adminController = require("../controllers/adminController")
const multer = require("multer")
const session = require("express-session")
const config = require("../config/config")
const auth =require("../middleware/auth")
const fs = require('fs');



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
  limits: { fileSize: 10 * 1024 * 1024 },
  // fileFilter: function (req, file, cb) {
  //   if (file.mimetype.startsWith('image/')) {
  //     cb(null, true);
  //   } else {
  //     cb(new Error('Invalid file type.'));
  //   }
  // },
});

//GET REQUESTS
//admin
admin_route.get('/',adminController.loadAdminLogin)
admin_route.post('/',adminController.verifyLogin)
admin_route.get('/dashboard',adminController.loadDashboard);
admin_route.get("/logout",adminController.logout)
admin_route.get("/userlist",adminController.loadUserlist)
admin_route.get('/block-user',adminController.blockUser)
//product
admin_route.get("/addproduct",adminController.loadaddProduct)
admin_route.get("/productlist",adminController.loadProductList)
admin_route.get('/delete-product',adminController.deleteProduct)
admin_route.get('/edit-product',adminController.loadEditProduct)
admin_route.get('/show-product',adminController.loadShowProduct)
//category
admin_route.get("/addcategory",adminController.loadaddCategory)
admin_route.get("/categorylist",adminController.loadCategorylist)
admin_route.get('/edit-category',adminController.loadEditCategory)
admin_route.get('/delete-category',adminController.deleteCategory)


//POST REQUESTS
//category
admin_route.post('/addcategory', categoryUpload.single('categoryImage'), adminController.insertCategory);
admin_route.post('/edit-category',categoryUpload.single('categoryImage'),adminController.editCategory);

//product
admin_route.post('/addproduct',upload.array('productImages', 4),adminController.insertProduct);
admin_route.post('/edit-product',upload.array('productImages', 4),adminController.editProduct);






admin_route.get('*',(req,res)=>{
    res.redirect('/admin')
})


module.exports =admin_route;