
const mongoose = require("mongoose")
const {Schema} = mongoose;

// const cartSchema = new Schema({
//     userId:{
//         type:Schema.Types.ObjectId,
//         ref:"User",
//         required:true
//     },
//     items:[{
//         productId:{
//             type:Schema.Types.ObjectId,
//             ref:"Product",
//             required:true
//         },
//         quantity:{
//             type:Number,
//             required:true,
//             default:1,
//             min: [1, "Quantity must be at least 1"],
//         },
//         price:{
//             type:Number,
//             required:true
//         },
//         size: { 
//             type: String,
//              required: false
//              },
//         totalPrice:{
//             type:Number,
//             required:true
//         },
//         status:{
//             type:String,
//             default:"placed"
//         },
//         cancellationReason:{
//             type:String,
//             default:"none"
//         }
//     }]

// })

// const Cart = mongoose.model("Cart",cartSchema)

// module.exports = Cart;

const cartItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    size: {
        type: String, // Added size to distinguish items
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        default: 1,
    },
    price: {
        type: Number,
        required: true,
    },
    totalPrice: {
        type: Number,
        required: true,
    },
});

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    items: [cartItemSchema],
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
