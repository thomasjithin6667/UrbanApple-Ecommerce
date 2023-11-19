
const bcrypt = require('bcrypt');
const User = require('../models/userModel');
const Product = require('../models/productModel')
const Category = require('../models/categoryModel');
const Cart = require('../models/cartModel');
const Order = require('../models/orderModel')
const Address = require('../models/addressesModel')
const mongoose = require('mongoose')
const Coupon = require('../models/couponModel')
const Transaction = require('../models/transactionModel')
const Razorpay = require('razorpay');
const chartData = require('../helpers/chartData')



const loadDashboard = async (req, res) => {
  try {


    const [totalRevenue, totalUsers, totalOrders, totalProducts, totalCategories, orders, monthlyEarnings, newUsers] = await Promise.all([
      Order.aggregate([
        { $match: { paymentStatus: "Payment Successful" } },
        { $group: { _id: null, totalAmount: { $sum: "$totalAmount" } } },
      ]),
      User.countDocuments({ isBlocked: false, is_verified: true }),
      Order.countDocuments(),
      Product.countDocuments(),
      Category.countDocuments(),
      Order.find().limit(10).sort({ orderDate: -1 }).populate('user'),
      Order.aggregate([
        {
          $match: {
            paymentStatus: "Payment Successful",
            orderDate: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
          },
        },
        { $group: { _id: null, monthlyAmount: { $sum: "$totalAmount" } } },
      ]),
      User.find({isBlocked: false, is_verified: true }).sort({date:-1}).limit(5)
    ]);

    const adminData = req.session.adminData;
    const totalRevenueValue = totalRevenue.length > 0 ? totalRevenue[0].totalAmount : 0;
    const monthlyEarningsValue = monthlyEarnings.length > 0 ? monthlyEarnings[0].monthlyAmount : 0;



    // Get monthly data
    const monthlyDataArray = await chartData.getMonthlyDataArray();

    // Get daily data
    const dailyDataArray = await chartData.getDailyDataArray();

    // Get yearly data
    const yearlyDataArray = await chartData.getYearlyDataArray();
    console.log('Daily Orders for Last 7 Days:', dailyDataArray);







    res.render('adminDashboard', {
      admin: adminData,
      orders,
      newUsers,
      totalRevenue: totalRevenueValue,
      totalOrders,
      totalProducts,
      totalCategories,
      totalUsers,
      monthlyEarnings: monthlyEarningsValue,
      monthlyMonths: monthlyDataArray.map(item => item.month),
      monthlyOrderCounts: monthlyDataArray.map(item => item.count),
      dailyDays: dailyDataArray.map(item => item.day),
      dailyOrderCounts: dailyDataArray.map(item => item.count),
      yearlyYears: yearlyDataArray.map(item => item.year),
      yearlyOrderCounts: yearlyDataArray.map(item => item.count),

    });
  } catch (error) {
    console.log(error.message);
  }
};


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



    const userData = await User.findOne({ email: email });

    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password)

      if (passwordMatch) {


        if (userData.is_Admin === 0) {

          res.render('adminLogin', { message: 'Your are not Authorised' })


        } else {

          req.session.adminData = userData;
          req.session.admin_id = userData._id;
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





// //admin logout
const logout = async (req, res) => {
  try {
    req.session.destroy();

    res.redirect('/')

  } catch (error) {
    console.log(error.message);
  }
}

//load user list

// const loadUserlist = async (req, res) => {
//     const admin=  req.session.adminData

//     try {
//         var search = "";

//         if (req.query.search) {
//             search = req.query.search;
//         }


//         const usersData = await User.find({
//             is_Admin: 0,
//             $or: [
//                 { name: { $regex: '.*' + search + '.*', $options: 'i' } },
//                 { email: { $regex: '.*' + search + '.*', $options: 'i' } },
//                 { mobile: { $regex: '.*' + search + '.*', $options: 'i' } },
//             ]
//         })

//         res.render('userlist', { users: usersData ,admin:admin})

//     } catch (error) {
//         console.log(error.message);

//     }

// }


const loadUserlist = async (req, res) => {
  const admin = req.session.adminData;

  try {
    var search = "";
    var isBlocked = req.query.blocked;
    const page = parseInt(req.query.page) || 1;
    const perPage = 3;

    if (req.query.search) {
      search = req.query.search;
    }

    const filter = {
      is_Admin: 0,
      $or: [
        { name: { $regex: '.*' + search + '.*', $options: 'i' } },
        { email: { $regex: '.*' + search + '.*', $options: 'i' } },
        { mobile: { $regex: '.*' + search + '.*', $options: 'i' } },
      ],
    };

    if (isBlocked === "true") {
      filter.isBlocked = true;
    } else if (isBlocked === "false") {
      filter.isBlocked = false;
    } else {
    }

    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / perPage);

    const usersData = await User.find(filter)
      .skip((page - 1) * perPage)
      .limit(perPage);

    res.render('userlist', { users: usersData, admin: admin, totalPages, currentPage: page });
  } catch (error) {
    console.log(error.message);
  }
}










//block and unblock user

// const blockUser = async (req, res) => {
//     try {
//         const id = req.query.id;

//         const user = await User.findById(id);

//         if (!user) {
//             return res.status(404).send('User not found');
//         }


//         if (req.session.user_id === user._id) {

//             return res.redirect('/login');
//         }


//         user.isBlocked = !user.isBlocked;
//         await user.save();

//         res.redirect('/admin/userlist');
//     } catch (error) {
//         console.log(error.message);
//     }
// }


// const blockUser = async (req, res) => {
//     try {
//         const id = req.query.id;

//         const user = await User.findById(id);

//         if (!user) {
//             return res.status(404).send('User not found');
//         }

//         // Check if the user is currently logged in and their session exists.
//         if (req.session.user_id === user._id) {
//             // Destroy the user's session to log them out.
//             req.session.destroy((err) => {
//                 if (err) {
//                     console.error('Error destroying session:', err);
//                 }
//             });
//         }

//         user.isBlocked = !user.isBlocked;
//         await user.save();

//         res.redirect('/admin/userlist');
//     } catch (error) {
//         console.log(error.message);
//     }
// }



const blockUser = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.findById({ _id: id });

    if (userData.isBlocked === false) {

      userData.isBlocked = true;
      req.session.user_id = id

      if (req.session.user_id)
        delete req.session.user_id;
      delete req.session.userData


    } else {
      userData.isBlocked = false;
    }

    await userData.save();
    res.redirect('/admin/userlist')
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};



// load sales report


const getSalesReport = async (req, res) => {
  try {
    const admin = req.session.adminData

    const orders = await Order.find({ paymentStatus: "Payment Successful" })
      .populate('user')
      .populate({
        path: 'address',
        model: 'Address',
      })
      .populate({
        path: 'items.product',
        model: 'Product',
      })
      .sort({ orderDate: -1 });
    res.render('salesReport', { orders, admin: admin });

  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};




module.exports = {
  loadAdminLogin,
  verifyLogin,
  loadDashboard,
  logout,
  loadUserlist,
  blockUser,
  getSalesReport
}

