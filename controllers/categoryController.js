const User = require('../models/userModel');
const Product = require('../models/productModel')
const Category = require('../models/categoryModel');
const Cart = require('../models/cartModel');
const Order = require('../models/orderModel')
const Address = require('../models/addressesModel')








//list and unlist category

const unlistCategory = async (req, res) => {
    try {
        const id = req.query.id;

         
        const category = await Category.findById(id);



        category.isListed = !category.isListed;


        await category.save();

        res.redirect('/admin/categorylist');
    } catch (error) {
        console.log(error.message);


    }
}





//insert category
const insertCategory = async (req, res) => {
    try {
        const admin = req.session.adminData
        const categoryName = req.body.category;

        const categoryExist = await Category.findOne({ category: { $regex: new RegExp(`^${categoryName}$`, 'i') } });

        if (categoryExist) {
            return res.render('addcategory', { admin:admin,message: "Category already exists" });
        }

        const category = new Category({
            category: categoryName,
            description: req.body.description,
            image: req.file.filename,
            isListed: true
        });

        const categoryData = await category.save();

        if (categoryData) {
            res.render('addcategory', { admin:admin,message: "Category Registration successful" });
        } else {
             res.render('addcategory', { admin:admin,message: "Category Registration Failed"});
        }
    } catch (error) {
        const admin = req.session.adminData
        console.error(error.message);
         res.render('addcategory', { admin:admin,message: "An error occurred while creating the category" });
    }
}

//load catergory list
const loadCategorylist = async (req, res) => {
    try {
        const admin = req.session.adminData;
        const search = req.query.search || ""; 
        const page = parseInt(req.query.page) || 1;
        const perPage = 3;
        const isBlocked = req.query.blocked;

        const filter = {
            $or: [
                { category: { $regex: '.*' + search + '.*', $options: 'i' } },
                { description: { $regex: '.*' + search + '.*', $options: 'i' } },
            ],
        };

        if (isBlocked === "true") {
            filter.isListed = false;
        } else if (isBlocked === "false") {
            filter.isListed = true;
        } else {
        
        }

        const totalCategories = await Category.countDocuments(filter);
        const totalPages = Math.ceil(totalCategories / perPage);

        const categoriesData = await Category.find(filter)
            .skip((page - 1) * perPage)
            .limit(perPage);

        res.render('categorylist', { categories: categoriesData, admin: admin, totalPages, currentPage: page });
    } catch (error) {
        console.log(error.message);
    }
}



//load insert category page
const loadaddCategory = async (req, res) => {
    try {


        const admin = req.session.adminData

        res.render('addcategory', { admin: admin })
    } catch (error) {
        console.log(error.message)
    }
}



//delete category
const deleteCategory = async (req, res) => {

    try {
        const id = req.query.id;
        await Category.deleteOne({ _id: id })
        res.redirect('/admin/categorylist')

    } catch (error) {
        console.log(error.message);

    }


}




//load edit category page
const loadEditCategory = async (req, res) => {
    try {
        const id = req.query.id
        const admin = req.session.adminData


        const categoryData = await Category.findById({ _id: id })
        if (categoryData) {
            res.render('edit-category', { categories: categoryData, admin: admin })

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
        const admin = req.session.adminData;
        const categoryId = req.body.category_id;
        const category = await Category.findById(categoryId);
        const updatedCategoryName = req.body.category;

        const duplicateCategory = await Category.findOne({ _id: { $ne: categoryId }, category: { $regex: new RegExp(`^${updatedCategoryName}$`, 'i') } });

        if (duplicateCategory) {
            res.render('edit-category', { categories: category, admin: admin, message: "Category with the same name already exists" });
            return; 
        }

        if (!category) {
            res.render('edit-category', { categories: category, admin: admin, message: "Category not found" });
            return; 
        }

        const updateFields = {};

    
        if (req.body.category) {
            updateFields.category = updatedCategoryName;
        }
        if (req.body.description) {
            updateFields.description = req.body.description;
        }
        if (req.file) {
            updateFields.image = req.file.filename;
        }

        if (Object.keys(updateFields).length === 0) {
           
            res.redirect('/admin/categorylist');
            return; 
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






