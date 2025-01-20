
const mongoose = require("mongoose")
const {Schema} = mongoose;




const orderSchema = new Schema({

    orderedItems:[{
        product:{
            type:Schema.Types.ObjectId,
            ref:"Product",
            required:true
        },
        quantity:{
            type:Number,
            required:true
        },
        price:{
            type:Number,
            default: 0
        },
        status:{
            type:String,
            default:'pending',
            enum:['pending','processing','shipped','delivered','cancelled','Return Request','Returned']
        }
    }],
    // totalPrice:{
    //     type:Number,
    //     required:true
    // },
    // discount:{
    //     type:Number,
    //     default:0
    // },
    size: { // Track size for size-based quantities
        type: String,
        // required: true,
    },
    finalAmount:{
        type:Number,
        // required:true
    },
    address: {
        name: { type: String, required: true },
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true },
        phone: { type: String, required: true }
    },
    user:{
        type:Schema.Types.ObjectId,
        ref:'User',
        // required:true
    },
    invoiceDate:{
        type:Date
    },
    status:{
        type:String,
       default:'pending',
        enum:['pending','processing','shipped','delivered','cancelled','Return Request','Returned']
    },
    isCancelledByUser: {
        type: Boolean,
        default: false, // Default to false (not cancelled by user)
    },
    createdOn:{
        type:Date,
        default:Date.now,
        required : true
    },
    couponApplied:{
        type:Boolean,
        default:false
    },
    PaymentMethod:{
        type:String
    }
})



const Order = mongoose.model("Order",orderSchema);

module.exports = Order;