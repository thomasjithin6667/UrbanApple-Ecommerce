const User=require('../models/userModel');
const userHelper = require('../helpers/userHelper')
const Address = require('../models/addressesModel')


const loadAddAddress = async(req, res)=>{
  try{
    const userId = req.query.userId;
    const userData = await User.findById(userId)
 
        res.render('addaddress', { user: userData});
    }catch(error){
        console.log(error.message);
    }
  }


 const manageAddress = async(req, res)=>{
    try{
      const userId = req.query.userId;
      const user = await User.findById(userId)
        const addresses = await Address.find({ user: userId }).sort({ createdDate: -1 }).exec();
          res.render('./user/address', { addresses, user});
      }catch(error){
          console.log(error);
      }
    }
  

  
 const postAddAddress = async (req, res) => {
      const userId = req.query.userId;
      const { type, phone, houseName, name, street, city, state, pinCode } = req.body;
  
      const addAddressResult = await userHelper.addAddress(userId, type, phone, houseName, name, street, city, state, pinCode);
  
      if (!addAddressResult.success) {
          return res.status(400).json({ errorMessage: addAddressResult.message });
      }
      const userData = await User.findById({_id:userId})
      res.render('userProfile',{user:userData})
  
      
  }
  
  const removeAddress = async (req, res) => {
    const userId = req.session.user._id
      const addressIndex = req.params.addressIndex;
  
      const removeAddressResult = await userHelper.removeAddress(addressIndex);
  
      if (!removeAddressResult.success) {
          return res.status(400).json({ errorMessage: removeAddressResult.message });
      }
  
      res.redirect('/manageaddress/' + userId);
  }


  const getEditAddress = async (req, res) => {
    try {
    const addressId = req.params.addressId;
      const address = await Address.findById(addressId);
      res.render('./user/addressEditForm', { address });
    } catch (error) {
      console.log("Error occurred", error);
    }
  };

const postEditAddress = async (req, res) => {
    const addressId = req.params.addressId;
    const user = req.session.user
    const userId = user._id
    const { type, phone, houseName, name, street, city, state, pinCode } = req.body;
  
    try {
        const result = await userHelper.editAddress( addressId, type, phone, houseName, name, street, city, state, pinCode);
        if (result.success) {
            res.redirect('/manageaddress/' + userId);
        } else {
            res.status(400).json({ message: 'Address edit failed' });
        }
    } catch (error) {
        console.error('Error editing address:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  


  

module.exports = {
  manageAddress,
  postAddAddress,
  removeAddress,
  getEditAddress,
  postEditAddress,
  loadAddAddress

}

