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
  async function removeAddress(addressIndex) {
    try {
        const address = await Address.findByIdAndRemove(addressIndex);

        if (!address) {
            // Address not found, return an error
            return { success: false, errorMessage: 'Address not found' };
        }

        // No need to save here since the address is already removed by findByIdAndRemove

        return { success: true };
    } catch (error) {
        console.error('Error removing address:', error);
        return { success: false, errorMessage: 'Internal Server Error' };
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
  
async function resetPassword(phone, newPassword, confirmPassword) {
    try {
        if (newPassword !== confirmPassword) {
            return { success: false, message: "Passwords don't match" };
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatedUser = await User.findOneAndUpdate(
            { phoneNumber: phone },
            { password: hashedPassword },
            { new: true }
        );
        if (!updatedUser) {
            return { success: false, message: 'User not found' };
        }
        return { success: true, message: 'Password reset successfully' };
    } catch (error) {
        console.error("An error occurred during resetting the password:", error);
        return { success: false, message: 'Internal Server Error' };
    }
}

module.exports = {
 
    addAddress,
    removeAddress,
    editAddress,
    resetPassword
};
