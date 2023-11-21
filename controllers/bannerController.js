//=====================================================================================================================================//
//BANNER CONTROLLER
//=====================================================================================================================================//
const Product = require('../models/productModel')
const Category = require('../models/categoryModel');
const Banner = require('../models/bannerModel')

//=====================================================================================================================================//
//function to add banner details
const addBanner = async (req, res) => {
  try {
    const productData = await Product.find({})
    const categoryData = await Category.find({})
    const admin = req.session.adminData
    const { bannerType, title, link, category, subtitle, product, startDate, endDate, offer } = req.body;


    if (!req.file) {

      return res.render('banner-add', { admin: admin, message: 'Banner image is required', product: productData, category: categoryData });
    }

    const image = req.file.filename;

    const newBanner = new Banner({
      bannerType,
      title,
      image,
      link,
      category,
      product,
      startDate,
      endDate,
      subtitle,
      offer


    });

    await newBanner.save();
    return res.render('banner-add', { admin: admin, message: "Banner added succesfully", product: productData, category: categoryData });
  } catch (error) {
    console.error(error);
    const admin = req.session.adminData
    const productData = await Product.find({})
    const categoryData = await Category.find({})

    return res.render('banner-add', { admin: admin, error: 'An error occurred while adding the banner', product: productData, category: categoryData });
  }
};

//=====================================================================================================================================//
//function to edit banner details
const editBanner = async (req, res) => {
  try {
    const { id } = req.query; 

    const bannerToUpdate = await Banner.findById(id);

    if (!bannerToUpdate) {
      return res.render('banner-edit', { error: 'Banner not found' });
    }

    if (req.body.bannerType) {
      bannerToUpdate.bannerType = req.body.bannerType;
    }
    if (req.body.title) {
      bannerToUpdate.title = req.body.title;
    }
    if (req.body.link) {
      bannerToUpdate.link = req.body.link;
    }
    if (req.body.category) {
      bannerToUpdate.category = req.body.category;
    }
    if (req.body.subtitle) {
      bannerToUpdate.subtitle = req.body.subtitle;
    }
    if (req.body.product) {
      bannerToUpdate.product = req.body.product;
    }
    if (req.body.startDate) {
      bannerToUpdate.startDate = req.body.startDate;
    }
    if (req.body.endDate) {
      bannerToUpdate.endDate = req.body.endDate;
    }
    if (req.body.offer) {
      bannerToUpdate.offer = req.body.offer;
    }

    if (req.file) {
      bannerToUpdate.image = req.file.filename;
    }

    await bannerToUpdate.save();
    
    return res.redirect('/admin/banner-list');
  } catch (error) {
    console.error(error);
    return res.render('banner-edit', { error: 'An error occurred while updating the banner' });
  }
};

//=====================================================================================================================================//
//function to load add banner page
const loadAddBanner = async (req, res) => {
  const admin = req.session.adminData
  const product = await Product.find({})
  const categoryData = await Category.find({})

  res.render('banner-add', { admin: admin, product: product, category: categoryData })
};

//=====================================================================================================================================//
//function to load edit banner page
const loadEditBanner = async (req, res) => {
  try {
    const BannerId = req.query.id;


    const banner = await Banner.findById(BannerId).populate('product');
    const category = await Category.find({})
    const admin = req.session.adminData;
    const product = await Product.find({});
    const startDate = new Date(banner.startDate).toISOString().split('T')[0];
    const endDate = new Date(banner.endDate).toISOString().split('T')[0];


    res.render('banner-edit', { banner, admin, product, category, startDate, endDate });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

//=====================================================================================================================================//
//function to load banner list in admin side
const loadBannerList = async (req, res) => {
  const admin = req.session.adminData
  const banner = await Banner.find().populate('product')
  res.render('banner-list', { banner, admin: admin })
};

//=====================================================================================================================================//
//toggle function to list and unlist banners
const unlistBanner = async (req, res) => {
  try {
    const id = req.query.id;


    const banner = await Banner.findById(id);



    banner.isListed = !banner.isListed;


    await banner.save();

    res.redirect('/admin/banner-list');
  } catch (error) {
    console.log(error.message);


  }
}

//=====================================================================================================================================//

module.exports = {

  loadAddBanner,
  loadBannerList,
  addBanner,
  loadEditBanner,
  unlistBanner,
  editBanner

}
//=====================================================================================================================================//
//=====================================================================================================================================//