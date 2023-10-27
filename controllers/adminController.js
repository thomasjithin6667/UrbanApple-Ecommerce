const User = require('../models/userModel');
const Category = require('../models/categoryModel');
const Product = require('../models/productModel')
const bcrypt = require('bcrypt');




//load admin loginpage
const loadAdminLogin = async (req, res) => {
    try {
        res.render('adminLogin')

    } catch (error) {
        console.log(error.message);

    }
}

//Verify admin login 
const verifyLogin = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        console.log(email);
        console.log(password);


        const userData = await User.findOne({ email: email });

        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password)

            if (passwordMatch) {


                if (userData.is_Admin === 0) {

                    res.render('adminLogin', { message: 'Your are not Authorised' })


                } else {

                    req.session.user_id = userData._id;
                    res.redirect('/admin/dashboard');
                }


            } else {

                res.render('adminLogin', { message: "Password is incorrect" });
            }
        } else {

            res.render('adminLOgin', { message: "Email is not registered" });
        }
    } catch (error) {
        console.log(error.message);
    }
};

//load user dashboard
const loadDashboard = async (req, res) => {
    try {
        
        res.render('adminDashboard')
    } catch (error) {
        console.log(error.message)
    }
}
//admin logout
const logout = async (req, res) => {
    try {
        req.session.destroy();

        res.redirect('/')

    } catch (error) {
        console.log(error.message);
    }
}

//load user list

const loadUserlist = async (req, res) => {
    try {
        var search = "";

        if (req.query.search) {
            search = req.query.search;
        }


        const usersData = await User.find({
            is_Admin: 0,
            $or: [
                { name: { $regex: '.*' + search + '.*', $options: 'i' } },
                { email: { $regex: '.*' + search + '.*', $options: 'i' } },
                { mobile: { $regex: '.*' + search + '.*', $options: 'i' } },
            ]
        })

        res.render('userlist', { users: usersData },)

    } catch (error) {
        console.log(error.message);

    }

}

//block and unblock user

const blockUser = async (req, res) => {
    try {
        const id = req.query.id;


        const user = await User.findById(id);

        if (!user) {

            return res.status(404).send('User not found');
        }

        user.isBlocked = !user.isBlocked;


        await user.save();

        res.redirect('/admin/userlist');
    } catch (error) {
        console.log(error.message);

       
    }
}


//list and unlist products

const unlistProduct = async (req, res) => {
    try {
        const id = req.query.id;


        const product = await Product.findById(id);

       

        product.list = !product.list;


        await product.save();

        res.redirect('/admin/productlist');
    } catch (error) {
        console.log(error.message);

       
    }
}

//list and unlist category

const unlistCategory = async (req, res) => {
    try {
        const id = req.query.id;


        const category = await Category.findById(id);

       

        category.isListed = !category.isListed;


        await category .save();

        res.redirect('/admin/categorylist');
    } catch (error) {
        console.log(error.message);

       
    }
}






const insertCategory = async (req, res) => {
    try {

        const categoryExist = await Category.findOne({ category: req.body.category });

        if (categoryExist) {
            return res.render('addcategory', { message: "Category already exists" });
        }


        const category = new Category({
            category: req.body.category,
            description: req.body.description,
            image: req.file.filename,
            isListed: true
        });


        const categoryData = await category.save();

        if (categoryData) {
            return res.render('addcategory',{ message: "Category Registration succesful" });
        } else {
            return res.render('addcategory', { message: "Category Registration Failed" });
        }
    } catch (error) {
        console.error(error.message);
        return res.render('addcategory', { message: "An error occurred while creating the category" });
    }
}

//load catergory list
const loadCategorylist = async (req, res) => {
    try {
        var search = "";

        if (req.query.search) {
            search = req.query.search;
        }

        const categoriesData = await Category.find({
            $or: [
                { name: { $regex: '.*' + search + '.*', $options: 'i' } },
                { description: { $regex: '.*' + search + '.*', $options: 'i' } },
            ]
        });

        res.render('categorylist', { categories: categoriesData });
    } catch (error) {
        console.log(error.message);
    }
}


//load insert category page
const loadaddCategory = async (req, res) => {
    try {
      
        res.render('addcategory')
    } catch (error) {
        console.log(error.message)
    }
}

const loadaddProduct = async (req, res) => {
    try {
      
        res.render('addProduct')
    } catch (error) {
        console.log(error.message)
    }
}

       // Create a new product

const insertProduct = async(req,res)=>{
    try {
        try {
         
            const existingProduct = await Product.findOne({ name: req.body.name });
          
            if (existingProduct) {
                return res.render('addproduct', { message: "Product already exists" });
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
            return res.render('addproduct', { message: " Product added successfully" });
          } catch (error) {
           
            res.render('addproduct', { error: error.message });
          }
          

        
    } catch (error) {
        console.log(error.message);
        
    }
}


const loadProductList = async (req, res) => {
    try {
        const search = req.query.search || '';

        const productsData = await Product.find({
            $or: [
                { name: { $regex: new RegExp(search, 'i') } },
                { category: { $regex: new RegExp(search, 'i') } },
            ]
        });
        console.log(productsData);

        res.render('productlist', { products: productsData });
    } catch (error) {
        console.log(error.message);
    }
}


//delete category
const deleteCategory= async(req,res)=>{

    try {
        const id = req.query.id;
        await Category.deleteOne({_id:id})
        res.redirect('/admin/categorylist')
        
    } catch (error) {
        console.log(error.message);
        
    }


}




//load edit category page
const loadEditCategory= async (req, res) => {
    try {
        const id = req.query.id

        const categoryData = await Category.findById({ _id: id })
        if ( categoryData ) {
            res.render('edit-category', { categories: categoryData })

        } else {
            res.redirect('/admin/categorylist')

        }

    } catch (error) {
        console.log(error.message);

    }
}


//edit category
const editCategory = async (req, res) => {
    try {
       
        const categoryId = req.body.category_id 


        const category = await Category.findById(categoryId);

        if (!category) {
         
            return res.render('edit-category', { message: "Category not found" });
        }

        
        const updateFields = {
            category: req.body.category,
            description: req.body.description,
            
        };

       
        if (req.file) {
            updateFields.image = req.file.filename;
        }

   
        await Category.findByIdAndUpdate(categoryId, { $set: updateFields });

        res.redirect('/admin/categorylist');
    } catch (error) {
        console.log(error.message);
       
    }
}

//delete product


const deleteProduct= async(req,res)=>{

    try {
        const id = req.query.id;
        await Product.deleteOne({_id:id})
        res.redirect('/admin/productlist')
        
    } catch (error) {
        console.log(error.message);
        
    }


}

//load edit category page
const loadEditProduct= async (req, res) => {
    try {
        const id = req.query.id

        const productData = await Product.findById({ _id: id })
        if ( productData) {
            res.render('edit-product', { products: productData })

        } else {
            res.redirect('/admin/productlist')

        }

    } catch (error) {
        console.log(error.message);

    }
}

//load show product page

const loadShowProduct= async (req, res) => {
    try {
        const id = req.query.id

        const productData = await Product.findById({ _id: id })
        if ( productData ) {
            res.render('show-product', { products:productData })

        } else {
            res.redirect('/admin/productlist')

        }

    } catch (error) {
        console.log(error.message);

    }
}

//edit product
const editProduct = async (req, res) => {
    try {
      const productId = req.body.productId; 
  
      try {
       
        const existingProduct = await Product.findById(productId);
  
        if (!existingProduct) {
          return res.render('edit-product', { message: "Product not found" });
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
        res.render('show-product', { error: error.message });
      }
    } catch (error) {
      console.log(error.message);
    }
  };
  



module.exports = {
    loadAdminLogin,
    verifyLogin,
    loadDashboard,
    logout,
    loadUserlist,
    blockUser,
    loadCategorylist,
    insertCategory,
    loadaddCategory,
    loadaddProduct,
    insertProduct,
    loadProductList,
    deleteCategory,
    loadEditCategory,
    editCategory,
    deleteProduct,
    loadEditProduct,
    loadShowProduct,
    editProduct,
    unlistProduct,
    unlistCategory 
}

