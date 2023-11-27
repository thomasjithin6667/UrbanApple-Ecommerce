const mongoose = require("mongoose");
const adminRoute= require("./routes/adminRoute")
const userRoute= require("./routes/userRoute")
const express= require("express");
const nocache= require("nocache")
const flash = require('express-flash');
require("dotenv").config()





mongoose.connect(process.env.MONGO_URL)
.then((e)=>console.log('Mongo connected sucessfully'));

const app = express();
app.use(nocache())

//middlewares
app.set('view engine','ejs')
app.set('views','./views/users')
app.use(express.static('public'))
app.use('assets/css',express.static(__dirname+'public'))
app.use("/public", express.static("public", { "extensions": ["js"] }));
app.use(flash());


//for user route
app.use('/',userRoute)



//for admin route
app.use('/admin',adminRoute)


app.use((req, res, next) => {
    res.status(404).render("404-error");
  })

const PORT=process.env.PORT
app.listen(PORT,()=>{
    console.log("server running at http://localhost:3000/");

})