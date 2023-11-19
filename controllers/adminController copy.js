
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



const loadDashboard = async (req, res) => {
    try {


      const [totalRevenue, totalUsers, totalOrders, totalProducts,totalCategories, orders, monthlyEarnings, newUsers] = await Promise.all([
        Order.aggregate([
          { $match: { paymentStatus: "Payment Successful" } },
          { $group: { _id: null, totalAmount: { $sum: "$totalAmount" } } },
        ]),
        User.countDocuments({ isBlocked: false, is_verified: true }),
        Order.countDocuments(),
        Product.countDocuments(),
        Category.countDocuments(),
        Order.find().limit(10).sort({ orderDate: -1 }),
        Order.aggregate([
          {
            $match: {
              paymentStatus: "Payment Successful",
              orderDate: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
            },
          },
          { $group: { _id: null, monthlyAmount: { $sum: "$totalAmount" } } },
        ]),
        User.aggregate([
          { $match: { isBlocked: false, is_verified: true } },
          { $sort: { date: -1 } },  
          { $limit: 5 },
        ])
            ]);
  
      const adminData = req.session.adminData;
      const totalRevenueValue = totalRevenue.length > 0 ? totalRevenue[0].totalAmount : 0;
      const monthlyEarningsValue = monthlyEarnings.length > 0 ? monthlyEarnings[0].monthlyAmount : 0;

      // Assuming you have an Order model defined


      



      const currentDate = new Date(); // Current date
      const sevenMonthsAgo = new Date(); // Date 7 months ago
      sevenMonthsAgo.setMonth(sevenMonthsAgo.getMonth() - 7); // Calculate the date 7 months ago
      
      const monthlyOrders = await Order.aggregate([
        {
          $match: {
            orderDate: { $gte: sevenMonthsAgo, $lte: currentDate } // Filtering orders for the last 7 months
          }
        },
        {
          $group: {
            _id: { $month: '$orderDate' },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id': 1 } // Sort by month
        }
      ]);
      
      // Create an array with monthly order data
      const monthlyDataArray = [];
      for (let i = 6; i >= 0; i--) {
        const monthIndex = (currentDate.getMonth() - i + 12) % 12 + 1; // Calculate month index
        const foundMonth = monthlyOrders.find(order => order._id === monthIndex); // Find data for the month
        const count = foundMonth ? foundMonth.count : 0; // Set count to 0 if no data found
        monthlyDataArray.push({ month: monthIndex, count }); // Add month data to the array
      }
      
      console.log('Monthly Orders for Last 7 Months:', monthlyDataArray);
      const months = monthlyDataArray.map(item => item.month);
const orderCounts = monthlyDataArray.map(item => item.count);
console.log(months);
console.log(orderCounts);



const sevenDaysAgo = new Date(currentDate); // Date 7 days ago
sevenDaysAgo.setDate(currentDate.getDate() - 7); // Calculate the date 7 days ago

const dailyOrders = await Order.aggregate([
  {
    $match: {
      orderDate: { $gte: sevenDaysAgo, $lte: currentDate } // Filtering orders for the last 7 days
    }
  },
  {
    $group: {
      _id: { $dayOfMonth: '$orderDate' },
      count: { $sum: 1 }
    }
  },
  {
    $sort: { '_id': 1 } // Sort by day
  }
]);

// Create an array with daily order data
const dailyDataArray = [];
for (let i = 6; i >= 0; i--) {
  const day = new Date(currentDate);
  day.setDate(currentDate.getDate() - i); // Calculate each day for the last 7 days

  const foundDay = dailyOrders.find(order => order._id === day.getDate()); // Find data for the day
  const count = foundDay ? foundDay.count : 0; // Set count to 0 if no data found
  dailyDataArray.push({ day: day.getDate(), count }); // Add day data to the array
}

console.log('Daily Orders for Last 7 Days:', dailyDataArray);



const sevenYearsAgo = new Date(currentDate); // Date 7 years ago
sevenYearsAgo.setFullYear(currentDate.getFullYear() - 7); // Calculate the date 7 years ago

const yearlyOrders = await Order.aggregate([
  {
    $match: {
      orderDate: { $gte: sevenYearsAgo, $lte: currentDate } // Filtering orders for the last 7 years
    }
  },
  {
    $group: {
      _id: { $year: '$orderDate' },
      count: { $sum: 1 }
    }
  },
  {
    $sort: { '_id': 1 } // Sort by year
  }
]);

// Create an array with yearly order data
const yearlyDataArray = [];
for (let i = 6; i >= 0; i--) {
  const year = currentDate.getFullYear() - i; // Calculate each year for the last 7 years

  const foundYear = yearlyOrders.find(order => order._id === year); // Find data for the year
  const count = foundYear ? foundYear.count : 0; // Set count to 0 if no data found
  yearlyDataArray.push({ year, count }); // Add year data to the array
}

console.log('Yearly Orders for Last 7 Years:', yearlyDataArray);

      

  
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

                    req.session.adminData= userData;
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
        req.session.user_id=id
        
        if(req.session.user_id)
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

    const orders = await Order.find({paymentStatus:"Payment Successful" })
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

