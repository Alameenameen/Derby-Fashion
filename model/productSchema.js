
const mongoose = require("mongoose")
const {Schema} = mongoose;

const reviewSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    review: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const sizeQuantitySchema = new Schema({
    size: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 0
    }
});

const productSchema = new Schema({
    productName:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    brand: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand',
        required: true
    },
    category:{
        type:mongoose.Schema.Types.ObjectId,
        ref :"Category",
        required:true
    },
    regularPrice:{
        type:Number,
        required:true
    },
    salePrice:{
        type:Number,
        required:true
    },
    productOffer:{
        type:Number,
        default:0
    },
    quantity:{
        type:Number,
        default:0
    },
    // color:{
    //     type:String,
    //     // required:true
    // },
    sizes: [sizeQuantitySchema],
    
    productImage:{
        type:[String],
        required:true
    },
    isBlocked:{
        type:Boolean,
        default:false
    },
    status:{
        type:String,
        enum:["Available","out of stock","inStock","Discountinued"],
        required:true,
        default:"Available"
    },
  
    // new fields
    reviews: [reviewSchema],
    
    averageRating: {
        type: Number,
        default: 0
    },
    numberOfReviews: {
        type: Number,
        default: 0
    },
    views: {
        type: Number,
        default: 0
    },
    featured: {
        type: Boolean,
        default: false
    }
},{timestamps: true});

// Calculate average rating when a review is added
productSchema.methods.calculateAverageRating = function() {
    if (this.reviews.length === 0) {
        this.averageRating = 0;
        this.numberOfReviews = 0;
    } else {
        this.averageRating = this.reviews.reduce((sum, review) => sum + review.rating, 0) / this.reviews.length;
        this.numberOfReviews = this.reviews.length;
    }
};
    

module.exports = mongoose.model("Product",productSchema)


