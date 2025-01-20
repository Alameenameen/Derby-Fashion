const mongoose = require("mongoose");
const env = require("dotenv")
env.config();

const connectDB = async()=>{
    try{
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("DB connected");
    }catch(error){
       console.log("DB connected error",error.message);
       process.exit(1);
    }
}

module.exports = connectDB;


