const User=require('../models/userModel');

const Address = require('../models/addressesModel')








async function addAddress(userId, type, phone, houseName, name, street, city, state, pinCode) {
    try {
      const userAddress = new Address({
        user: userId,
        type,
        phone,
        houseName,
        name,
        street,
        city,
        state,
        pinCode,
      });
  
      await userAddress.save();
  
      return { success: true, message: 'Address added successfully' };
    } catch (error) {
      console.error('Error adding address:', error);
      return { success: false, message: 'An error occurred while adding address' };
    }
  }

async function editAddress( addressId, type, phone, houseName, name, street, city, state, pinCode) {
    try {
  
      const addressToUpdate = await Address.findById(addressId);
  
      if (!addressToUpdate) {
        return { success: false, message: 'Address not found' };
      }
      addressToUpdate.type = type;
      addressToUpdate.phone = phone;
      addressToUpdate.houseName = houseName;
      addressToUpdate.name = name;
      addressToUpdate.street = street;
      addressToUpdate.city = city;
      addressToUpdate.state = state;
      addressToUpdate.pinCode = pinCode;
      await addressToUpdate.save();
      
      return { success: true, message: 'Address updated successfully' };
    } catch (error) {
      console.error('Error updating address:', error);
      return { success: false, message: 'An error occurred while updating address' };
    }
  }
  


module.exports = {
 
    addAddress,
    editAddress,
   
};
