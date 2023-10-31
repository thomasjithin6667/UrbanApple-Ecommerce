const User = require('../models/userModel');
const Category = require('../models/categoryModel');
const Product = require('../models/productModel')
const bcrypt = require('bcrypt');
const UserOTPVerification = require('../models/userOTPModel')
const nodemailer = require('nodemailer')




//list and unlist products

const unlistProduct = async (req, res) => {
    try {
        const admin=  req.session.userData
        const id = req.query.id;


        const product = await Product.findById(id);

       

        product.list = !product.list;


        await product.save();

        res.redirect('/admin/productlist');
    } catch (error) {
        console.log(error.message);

       
    }
}

//load add product
const loadaddProduct = async (req, res) => {
    try {
        const admin=  req.session.userData
        const categoriesData = await Category.find({})
      
        res.render('addProduct',{admin:admin,category:categoriesData})
    } catch (error) {
        console.log(error.message)
    }
}


// Create a new product

const insertProduct = async(req,res)=>{
    try {
        try {
            const categoriesData = await Category.find({})
            const admin=  req.session.userData
         
            const existingProduct = await Product.findOne({ name: req.body.name });
          
            if (existingProduct) {
                return res.render('addproduct', { message: "Product already exists",admin:admin,category:categoriesData });
            }
          
     
            const newProduct = {};
          
            if (req.body.name) {
              newProduct.name = req.body.name;
            }
            if (req.body.category) {
              newProduct.category = req.body.category;
            }
            if (req.body.price) {
              newProduct.price = req.body.price;
            }
            if (req.body.discountPrice) {
              newProduct.discountPrice = req.body.discountPrice;
            }
            if (req.body.quantity) {
              newProduct.quantity = req.body.quantity;
            }

            if (req.files && req.files.length > 0) {
                newProduct.productImages = req.files.map((file) =>file.filename);
              } 
          
            if (req.body.battery) {
              newProduct.battery = req.body.battery;
            }
            if (req.body.productColor) {
              newProduct.productColor = req.body.productColor;
            }
            if (req.body.ram) {
              newProduct.ram = req.body.ram;
            }
            if (req.body.rom) {
              newProduct.rom = req.body.rom;
            }
            if (req.body.expandable) {
              newProduct.expandable = req.body.expandable;
            }
            if (req.body.frontCam) {
              newProduct.frontCam = req.body.frontCam;
            }
            if (req.body.rearCam) {
              newProduct.rearCam = req.body.rearCam;
            }
            if (req.body.processor) {
              newProduct.processor = req.body.processor;
            }
          
            const savedProduct = await new Product(newProduct).save();
            return res.render('addproduct', { message: " Product added successfully",admin:admin,category:categoriesData });
          } catch (error) {
           
            res.render('addproduct', { error: error.message ,category:categoriesData});
          }
          

        
    } catch (error) {
        console.log(error.message);
        
    }
}

//load product list
const loadProductList = async (req, res) => {
    const admin=  req.session.userData
    try {
        const search = req.query.search || '';

        const productsData = await Product.find({
            $or: [
                { name: { $regex: new RegExp(search, 'i') } },
                { category: { $regex: new RegExp(search, 'i') } },
            ]
        });
       

        res.render('productlist', { products: productsData ,admin:admin});
    } catch (error) {
        console.log(error.message);
    }
}

//delete product


const deleteProduct= async(req,res)=>{

    try {
        const admin=  req.session.userData
        const id = req.query.id;
        await Product.deleteOne({_id:id})
        res.redirect('/admin/productlist')
        
    } catch (error) {
        console.log(error.message);
        
    }


}

//edit product
const editProduct = async (req, res) => {
    try {
        const categoriesData = await Category.find({})
        const admin=  req.session.userData
      const productId = req.body.productId; 
  
      try {
       
        const existingProduct = await Product.findById(productId);
  
        if (!existingProduct) {
          return res.render('edit-product', { message: "Product not found" ,admin:admin,category:categoriesData});
        }
  
        
        if (req.body.name) {
          existingProduct.name = req.body.name;
        }
        if (req.body.category) {
          existingProduct.category = req.body.category;
        }
        if (req.body.price) {
          existingProduct.price = req.body.price;
        }
        if (req.body.discountPrice) {
          existingProduct.discountPrice = req.body.discountPrice;
        }
        if (req.body.quantity) {
          existingProduct.quantity = req.body.quantity;
        }
  
        if (req.files && req.files.length > 0) {
          existingProduct.productImages = req.files.map((file) => file.filename);
        }
  
        if (req.body.battery) {
          existingProduct.battery = req.body.battery;
        }
        if (req.body.productColor) {
          existingProduct.productColor = req.body.productColor;
        }
        if (req.body.ram) {
          existingProduct.ram = req.body.ram;
        }
        if (req.body.rom) {
          existingProduct.rom = req.body.rom;
        }
        if (req.body.expandable) {
          existingProduct.expandable = req.body.expandable;
        }
        if (req.body.frontCam) {
          existingProduct.frontCam = req.body.frontCam;
        }
        if (req.body.rearCam) {
          existingProduct.rearCam = req.body.rearCam;
        }
        if (req.body.processor) {
          existingProduct.processor = req.body.processor;
        }
  
       
        await existingProduct.save();
      
        
        res.redirect('/admin/productlist')
      } catch (error) {
        res.render('show-product', { error: error.message ,category:categoriesData});
      }
    } catch (error) {
      console.log(error.message);
    }
  };
  


  //load show product page

const loadShowProduct= async (req, res) => {
    try {
        const admin=  req.session.userData
        const id = req.query.id

        const productData = await Product.findById({ _id: id })
        if ( productData ) {
            res.render('show-product', { products:productData ,admin:admin})

        } else {
            res.redirect('/admin/productlist')

        }

    } catch (error) {
        console.log(error.message);

    }
}





//load edit  page
const loadEditProduct= async (req, res) => {
    try {
        const categoriesData = await Category.find({})
        const admin=  req.session.userData
        const id = req.query.id

        const productData = await Product.findById({ _id: id })
        if ( productData) {
            res.render('edit-product', { products: productData ,admin:admin,category:categoriesData})

        } else {
            res.redirect('/admin/productlist')

        }

    } catch (error) {
        console.log(error.message);

    }
}





//product list when not logged in
const productList = async (req, res) => {
    try {
        const productsData = await Product.find({})
        res.render('productlist', { products: productsData, user: null });
    } catch (error) {
        console.log(error.message);
    }
}


//product list when logged in
const userProductList = async (req, res) => {
    try {
        const userData = await User.findById({ _id: req.session.user_id });
     
        const search = req.query.search || '';

        const productsData = await Product.find({
            $or: [
                { name: { $regex: new RegExp(search, 'i') } },
                { category: { $regex: new RegExp(search, 'i') } },
            ]
        });
        
        res.render('productlist',{ products: productsData, user: userData });
    } catch (error) {
        console.log(error.message);
    }
}


  //view product
  const productView= async(req,res)=>{

    try {
        const userData = await User.findById({_id:req.session.user_id})
        const productId = req.params.productId;
        const productData = await Product.findById(productId);
        res.render('productView', { user: userData,product:productData})
       
        
    } catch (error) {
        console.log(error.message);
        
    }


}





module.exports = {

    loadaddProduct,
    insertProduct,
    loadProductList,
    deleteProduct,
    loadEditProduct,
    loadShowProduct,
    editProduct,
    unlistProduct,
    productView,
    userProductList,
    productList,

    
}






