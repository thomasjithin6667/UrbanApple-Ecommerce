const mongoose = require("mongoose");
const adminRoute= require("./routes/adminRoute")
const userRoute= require("./routes/userRoute")
const express= require("express");



mongoose.connect("mongodb://127.0.0.1:27017/apple_store");

const app = express();


//for user route
app.use('/',userRoute)


//for user route
app.use('/admin',adminRoute)

port=3000
app.listen(port,()=>{
    console.log("server running at http://localhost:3000/");

})