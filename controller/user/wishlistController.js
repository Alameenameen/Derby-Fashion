
const Wishlist = require('../../model/wishlistSchema');
const Product = require("../../model/productSchema");



    
 const addToWishlist = async (req, res) => {
        try {
            const { productId } = req.body;
            const userId = req.user._id;

            console.log('User:', req.user);  // Check if user exists
            console.log('User ID:', req.user._id);

            let wishlist = await Wishlist.findOne({ userId });

            if (!wishlist) {
                wishlist = new Wishlist({
                    userId,
                    products: []
                });
            }

            const productExists = wishlist.products.some(item => 
                item.productsId.toString() === productId
            );

            if (!productExists) {
                wishlist.products.push({
                    productsId: productId
                });
                await wishlist.save();
                
                // Get updated count for response
                const count = wishlist.products.length;
                res.json({ 
                    success: true, 
                    message: 'Product added to wishlist',
                    count
                });
            } else {
                res.json({ 
                    success: false, 
                    message: 'Product already in wishlist',
                    count: wishlist.products.length
                });
            }
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // Remove from wishlist
 const  removeFromWishlist = async (req, res) => {
        try {
            const { productId } = req.params;
            const userId = req.user._id;

            const wishlist = await Wishlist.findOne({ userId });
            if (!wishlist) {
                return res.status(404).json({ success: false, message: 'Wishlist not found' });
            }

            wishlist.products = wishlist.products.filter(
                item => item.productsId.toString() !== productId
            );

            await wishlist.save();
            res.json({ 
                success: true, 
                message: 'Product removed from wishlist',
                count: wishlist.products.length
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // Get wishlist page
 const  getWishlist = async (req, res) => {
        try {
            const userId = req.user._id;
            const wishlist = await Wishlist.findOne({ userId })
                .populate({
                    path: 'products.productsId',
                    populate: [
                        {
                            path: 'category',
                            select: 'categoryOffer'
                        },
                        {
                            path: 'brand',
                            select: 'name'
                        }
                    ]
                });

            const wishlistCount = wishlist ? wishlist.products.length : 0;

            res.render('wishlist', {
                wishlistItems: wishlist ? wishlist.products : [],
                wishlistCount
            });
        } catch (error) {
            res.status(500).render('error', { message: error.message });
        }
    }

    // Get wishlist count
   const getWishlistCount = async (req, res) => {
        try {

             if (!req.user) {
            return res.json({ count: 0 });
        }
            const userId = req.user._id;
            const wishlist = await Wishlist.findOne({ userId });
            const count = wishlist ? wishlist.products.length : 0;
            res.json({ count });
        } catch (error) {
            res.json({ count: 0 });
        }
    }


module.exports = {
    getWishlistCount,
    getWishlist,
    removeFromWishlist,
    addToWishlist
}
