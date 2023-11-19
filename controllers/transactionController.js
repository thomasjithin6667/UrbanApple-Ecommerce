const Transaction = require('../models/transactionModel')

const loadTransaction = async (req, res) => {

    try {
        const admin = req.session.adminData

   
        const transaction = await Transaction.find().sort({date : -1});
        console.log(transaction);

        res.render('transactions', { admin:admin,transaction:transaction});



    } catch (error) {

        console.log(error.message);

    }



}


module.exports = {
loadTransaction

}
