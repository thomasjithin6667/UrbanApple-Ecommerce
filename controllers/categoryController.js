const User=require('../models/userModel');
const Product = require('../models/productModel')
const Category = require('../models/categoryModel');
const Cart = require('../models/cartModel'); 
const Order = require('../models/orderModel')
const Address =require('../models/addressesModel')








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
        const admin=  req.session.adminData
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

        res.render('categorylist', { categories: categoriesData ,admin:admin});
    } catch (error) {
        console.log(error.message);
    }
}


//load insert category page
const loadaddCategory = async (req, res) => {
    try {

        
        const admin=  req.session.adminData
      
        res.render('addcategory',{admin:admin} )
    } catch (error) {
        console.log(error.message)
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
        const admin=  req.session.adminData
      

        const categoryData = await Category.findById({ _id: id })
        if ( categoryData ) {
            res.render('edit-category', { categories: categoryData,admin:admin  })

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


module.exports = {
 
    loadCategorylist,
    insertCategory,
    loadaddCategory,
    deleteCategory,
    loadEditCategory,
    editCategory,
    unlistCategory 
}






