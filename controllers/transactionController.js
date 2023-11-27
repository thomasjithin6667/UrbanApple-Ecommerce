//=====================================================================================================================================//
//TRANSACTION CONTROLLER
//=====================================================================================================================================//
//module imports

const Transaction = require('../models/transactionModel')
//=====================================================================================================================================//
//function to load transaction list in admin side
const loadTransaction = async (req, res) => {
    try {
      const admin = req.session.adminData;
      const page = parseInt(req.query.page) || 1;
      const limit = 10; 
  
      const totalTransactionsCount = await Transaction.countDocuments();
      const totalPages = Math.ceil(totalTransactionsCount / limit);
      const skip = (page - 1) * limit;
  
      const transactions = await Transaction.find()
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit);
  
      res.render('transactions', { admin, transaction: transactions, totalPages, currentPage: page });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  

//=====================================================================================================================================//


module.exports = {
loadTransaction

}
//=====================================================================================================================================//
//=====================================================================================================================================//
