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


 const loadAddress = async(req, res)=>{
    try{
      const userId = req.query.userId;
      const user = await User.findById(userId)
        const addresses = await Address.find({ user: userId }).sort({ createdDate: -1 }).exec();
          res.render('address-load', { addresses, user});
          
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
     
      const user = await User.findById(userId)
      const addresses = await Address.find({ user: userId }).sort({ createdDate: -1 }).exec();
        res.render('address-load', { addresses, user});
     
  
      
  }
  

const deleteAddress= async(req,res)=>{

  try {
      const  AddressId = req.query.addressId;
      const userId = req.query.userId;
      await Address.deleteOne({_id: AddressId})
    
    
      const user = await User.findById(userId)
        const addresses = await Address.find({ user: userId }).sort({ createdDate: -1 }).exec();
          res.render('address-load', { addresses, user});
          
      
  } catch (error) {
      console.log(error.message);
      
  }


}


  const loadEditAddress = async (req, res) => {
    try {

      
    const userId = req.query.userId; 
    const addressId = req.query.addressId;
    const user = await User.findById(userId)
      const address = await Address.findById(addressId);
      res.render('address-edit', { address, user });
    } catch (error) {
      console.log("Error occurred", error);
    }
  };

const editAddress = async (req, res) => {
  const addressId = req.query.addressId;
  const userId = req.query.userId; 

    const { type, phone, houseName, name, street, city, state, pinCode } = req.body;
  
    try {
        const result = await userHelper.editAddress( addressId, type, phone, houseName, name, street, city, state, pinCode);
        const user = await User.findById(userId)
        const addresses = await Address.find({ user: userId }).sort({ createdDate: -1 }).exec();
      
        if (result.success) {
          res.render('address-load', { addresses, user });
        } else {
         
            res.render('address-load', { addresses, user,message: 'Address edit failed' })
        }
    } catch (error) {
        console.error('Error editing address:', error);
        
        
    }
  }
  


  

module.exports = {
  loadAddress,
  postAddAddress,
  deleteAddress,
  loadEditAddress,
  editAddress,
  loadAddAddress

}

