
const mongoose = require("mongoose");
const {Schema} = mongoose;

const categorySchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true
    },
    description:{
        type:String,
        required:true
    },
    categoryImage: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['Clothing', 'Footwear'], // Restrict values to these two types
        required: true,
      },
    isListed:{
        type:Boolean,
        default:true
    },
    categoryOffer: {
        percentage: {
            type: Number,
            min: 1,
            max: 99
        },
        startDate: Date,
        endDate: Date,
        isActive: {
            type: Boolean,
            default: false
        }
    },
    createdAt:{
        type:Date,
        default:Date.now
    }
})


module.exports = mongoose.model("Category",categorySchema);