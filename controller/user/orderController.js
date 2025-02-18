const mongoose = require('mongoose')
const Order = require('../../model/orderSchema');
const Address = require('../../model/addressSchema');
const Product = require('../../model/productSchema')
const Wallet = require('../../model/walletSchema')
const User = require('../../model/userSchema')

// const mongoose = require("mongoose");



const orderSuccessPage = async (req, res) => {
    try {
        // console.log("user Id",req.session.user._id)
        if (!req.session.user || !req.session.user._id) {
            return res.redirect('/login');
        }

        const orderId = req.params.orderId;
        console.log("orderrrid:",orderId)

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.render('page-404', {
                user: req.session.user,
                error: 'Invalid order ID',
                page: 'page-404'
            });
        }

        // Fetch order with populated product details
        const order = await Order.findById({ _id:orderId }).populate('orderedItems.product').populate('user')
            // console.log("orders:",order)
         
        //  console.log(order.product.productImage)


        if (!order) {
            return res.render('page-404', {
                user: req.session.user,
                error: 'Order not found',
                page: 'page-404'
            });
        }

     

      

        res.render('order-details', {
            order: order,
            user: req.session.user,
            // address: order.address 
        });

        // console.log("orders:",order)

    } catch (error) {
        console.error('Error loading order details:', error);
        res.render('page-404', {
            user: req.session.user,
            error: 'Error loading order details',
            page:'page-404'
        });
    }
};




// const cancelOrder = async (req, res) => {

//     let session = null;
//     try {
//         const orderId = req.params.orderId;
//         const userId = req.session.user._id;
        
//         // Find the order and populate necessary product details
//         const order = await Order.findById(orderId)
//             .populate({
//                 path: 'orderedItems.product',
//                 select: 'productName quantity sizes status'
//             })
            

//         // Basic validation to ensure order exists and can be cancelled
//         if (!order) {
//             return res.status(404).json({
//                 success: false,
//                 error: 'Order not found'
//             });
//         }

//         if (order.status !== 'pending' && order.status !== 'processing') {
//             return res.status(400).json({
//                 success: false,
//                 error: 'Only pending and processing orders can be cancelled'
//             });
//         }

//         if (order.isCancelledByUser) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Order is already cancelled."
//             });
//         }


//         if (order.PaymentMethod !== 'COD') {
//             console.log(`Processing refund for order ${orderId}, amount: ${order.finalAmount}`);
            
//             const refundSuccess = await processRefund(
//                 orderId,
//                 userId,
//                 order.finalAmount,
//                 'Order cancellation refund'
//             );

//             if (!refundSuccess) {
//                 throw new Error('Failed to process refund');
//             }
//         }

//         // Process each ordered item to restore quantities
//         for (const orderItem of order.orderedItems) {
//             const product = await Product.findById(orderItem.product._id)
            
//             if (!product) {
//                 console.log(`Product not found for order item: ${orderItem._id}`);
//                 continue;
//             }

//             // Log initial state for debugging
//             console.log('Before quantity restoration:', {
//                 productId: product._id,
//                 currentTotalQuantity: product.quantity,
//                 orderQuantity: orderItem.quantity,
//                 currentSizes: product.sizes,
//                 orderSize: order.size // Using size from root level of order
//             });

//             // Restore the total product quantity
//             product.quantity += orderItem.quantity;

//             // Find and update the specific size quantity using the order-level size
//             if (order.size) {
//                 const sizeIndex = product.sizes.findIndex(s => s.size === order.size);
                
//                 if (sizeIndex !== -1) {
//                     // Restore the quantity for this specific size
//                     product.sizes[sizeIndex].quantity += orderItem.quantity;
                    
//                     console.log('Size quantity restored:', {
//                         size: order.size,
//                         quantityRestored: orderItem.quantity,
//                         newSizeQuantity: product.sizes[sizeIndex].quantity
//                     });


//                 } else {
//                     console.log(`Warning: Size ${order.size} not found in product sizes`);
//                 }
//             }

//             // Update product status if it was out of stock
//             if (product.status === 'out of stock' && product.quantity > 0) {
//                 product.status = 'Available';
//             }

//             await product.save()

//             // Log final state for verification
//             console.log('After quantity restoration:', {
//                 productId: product._id,
//                 newTotalQuantity: product.quantity,
//                 updatedSizes: product.sizes
//             });
//         }

//         // Update the order status
//         order.status = 'cancelled';
//         order.isCancelledByUser = true;
//         order.cancelledAt = new Date();

//         // if (order.PaymentMethod !== 'COD') {
//         //     const refundAmount = order.finalAmount;
//         //     const refundSuccess = await processRefund(
//         //         orderId, 
//         //         order.user, 
//         //         refundAmount, 
//         //         'Order cancellation refund'
//         //     );

//         //     if (!refundSuccess) {
//         //         return res.status(500).json({ error: 'Failed to process refund' });
//         //     }
//         // }


             
//         await order.save();
       

//         res.json({ 
//             success: true,
//             message: 'Order cancelled successfully and quantities restored'
//         });

//     } catch (error) {
//         console.error('Error cancelling order:', error);
//         res.status(500).json({
//             success: false,
//             error: 'Failed to cancel order',
//             details: error.message
//         });
//     } 
// };


// Handle return requests
// const requestReturn = async (req, res) => {
//     try {
//         const orderId = req.params.orderId;
//         // const order = await Order.findById(orderId);
//         const { returnReason } = req.body;

//         // Validate return reason
//         const validReasons = [
//             'Wrong Size', 
//             'Damaged Product', 
//             'Not as Described', 
//             'Changed Mind', 
//             'Quality Issue', 
//             'Other'
//         ];

//         // Basic validation
//         if (!returnReason) {
//             return res.status(400).json({
//                 success: false,
//                 error: 'Please provide a valid return reason'
//             });
//         }

//         // Additional validation for "Other" reason
//         if (returnReason === 'Other' && returnReason.trim().length < 10) {
//             return res.status(400).json({
//                 success: false,
//                 error: 'Please provide more detailed information for "Other" reason'
//             });
//         }

//         const order = await Order.findById(orderId);

//         if (!order) {
//             return res.status(404).json({
//                 success: false,
//                 error: 'Order not found'
//             });
//         }

//         // Check if order is delivered
//         if (order.status !== 'delivered') {
//             return res.status(400).json({
//                 success: false,
//                 error: 'Only delivered orders can be returned'
//             });
//         }


//         // Check return period (7 days)
//         const sevenDaysInMilliseconds = 7 * 24 * 60 * 60 * 1000;
//         const isWithinReturnPeriod = (new Date() - new Date(order.deliveredDate)) < sevenDaysInMilliseconds;
//         // console.log(".........",isWithinReturnPeriod)
        

//         if (!isWithinReturnPeriod) {
//             return res.status(400).json({
//                 success: false,
//                 error: 'Return period has expired'
//             });
//         }

//         // Check if already returned or return requested
//         if (order.status === 'Return Request' || order.status === 'Returned') {
//             return res.status(400).json({
//                 success: false,
//                 error: 'Return already processed'
//             });
//         }

//         // Update order status with return details
//         order.status = 'Return Request';
//         order.returnRequestedAt = new Date();
//         order.returnReason = returnReason;

//         const refundAmount = parseInt(order.totalAmount);
//         // await order.save();

//         const refundSuccess = await processRefund(
//             orderId,
//             order.user,
//             refundAmount,  // Pass the converted number
//             'Refund for returned order'
//         );

//         if (!refundSuccess) {
//             console.error('Failed to process refund');
//             return res.status(500).json({
//                 success: false,
//                 error: 'Failed to process refund'
//             });
//         }

//         await order.save();

//         res.json({ 
//             success: true,
//             message: 'Return request submitted successfully' 
//         });

//     } catch (error) {
//         console.error('Error requesting return:', error);
//         res.status(500).json({
//             success: false,
//             error: 'Failed to request return',
//             details: error.message
//         });
//     }
// };



// ................../

// const cancelOrder = async (req, res) => {
//     try {
//         const orderId = req.params.orderId;
//         const userId = req.session.user._id;
        
//         // Find the order and populate necessary product details
//         const order = await Order.findById(orderId)
//             .populate({
//                 path: 'orderedItems.product',
//                 select: 'productName quantity sizes status'
//             });

//         // Basic validation to ensure order exists and can be cancelled
//         if (!order) {
//             return res.status(404).json({
//                 success: false,
//                 error: 'Order not found'
//             });
//         }

//         if (order.status !== 'pending' && order.status !== 'processing') {
//             return res.status(400).json({
//                 success: false,
//                 error: 'Only pending and processing orders can be cancelled'
//             });
//         }

//         if (order.isCancelledByUser) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Order is already cancelled."
//             });
//         }

//         // Process each ordered item to restore quantities - do this BEFORE refund processing
//        // In cancelOrder function:
// for (const orderItem of order.orderedItems) {
//     const product = orderItem.product;
    
//     if (!product || !product._id) {
//         console.log(`Product reference missing for order item:`, orderItem);
//         continue;
//     }

//     // Find the full product document to update
//     const fullProduct = await Product.findById(product._id);
//     if (!fullProduct) {
//         console.log(`Product not found for ID: ${product._id}`);
//         continue;
//     }

//     // Restore the total product quantity
//     fullProduct.quantity += orderItem.quantity;

//     // Find and update the specific size quantity using the order-level size
//     if (order.size && Array.isArray(fullProduct.sizes)) {
//         const sizeIndex = fullProduct.sizes.findIndex(s => s.size === order.size);
        
//         if (sizeIndex !== -1) {
//             // Restore the quantity for this specific size
//             fullProduct.sizes[sizeIndex].quantity += orderItem.quantity;
            
//             console.log('Size quantity restored:', {
//                 size: order.size,
//                 quantityRestored: orderItem.quantity,
//                 newSizeQuantity: fullProduct.sizes[sizeIndex].quantity
//             });
//         } else {
//             console.log(`Warning: Size ${order.size} not found in product sizes`);
//         }
//     }

//     // Update product status if it was out of stock but now has inventory
//     if (fullProduct.status === 'out of stock' && fullProduct.quantity > 0) {
//         fullProduct.status = 'Available';
//     }

//     // Save the updated product
//     await fullProduct.save();
// }

//         // Process refund if needed
//         if (order.PaymentMethod !== 'COD') {
//             console.log(`Processing refund for order ${orderId}, amount: ${order.finalAmount}`);
            
//             const refundSuccess = await processRefund(
//                 orderId,
//                 userId,
//                 order.finalAmount,
//                 'Order cancellation refund'
//             );

//             if (!refundSuccess) {
//                 throw new Error('Failed to process refund');
//             }
//         }

//         // Update the order status
//         order.status = 'cancelled';
//         order.isCancelledByUser = true;
//         order.cancelledAt = new Date();
        
//         // Save the updated order
//         await order.save();

//         res.json({ 
//             success: true,
//             message: 'Order cancelled successfully and quantities restored'
//         });

//     } catch (error) {
//         console.error('Error cancelling order:', error);
//         res.status(500).json({
//             success: false,
//             error: 'Failed to cancel order',
//             details: error.message
//         });
//     }
// };

// const requestReturn = async (req, res) => {
//     try {
//         const orderId = req.params.orderId;
//         const { returnReason } = req.body;

//         // Validate return reason
//         const validReasons = [
//             'Wrong Size', 
//             'Damaged Product', 
//             'Not as Described', 
//             'Changed Mind', 
//             'Quality Issue', 
//             'Other'
//         ];

//         // Basic validation
//         if (!returnReason || !validReasons.includes(returnReason)) {
//             return res.status(400).json({
//                 success: false,
//                 error: 'Please provide a valid return reason'
//             });
//         }

//         // Additional validation for "Other" reason
//         if (returnReason === 'Other' && (!req.body.otherReason || req.body.otherReason.trim().length <10)) {
//             return res.status(400).json({
//                 success: false,
//                 error: 'Please provide more detailed information for "Other" reason'
//             });
//         }

//         const order = await Order.findById(orderId)
//         .populate({
//             path: 'orderedItems.product',
//             select: 'productName quantity sizes status'
//         });

//         if (!order) {
//             return res.status(404).json({
//                 success: false,
//                 error: 'Order not found'
//             });
//         }

//         // Check if order is delivered
//         if (order.status !== 'delivered') {
//             return res.status(400).json({
//                 success: false,
//                 error: 'Only delivered orders can be returned'
//             });
//         }

//         console.log('Order amount fields:', {
//             finalAmount: order.finalAmount,
//             totalItems: order.orderedItems?.length
//         });

//         // Check return period (7 days)
//         const sevenDaysInMilliseconds = 7 * 24 * 60 * 60 * 1000;
//         const deliveredDate = new Date(order.deliveredDate);
        
//         if (isNaN(deliveredDate.getTime())) {
//             return res.status(400).json({
//                 success: false,
//                 error: 'Invalid delivery date'
//             });
//         }
        
//         const isWithinReturnPeriod = (new Date() - deliveredDate) < sevenDaysInMilliseconds;
        
//         if (!isWithinReturnPeriod) {
//             return res.status(400).json({
//                 success: false,
//                 error: 'Return period has expired'
//             });
//         }

//         // Check if already returned or return requested
//         if (order.status === 'Return Request' || order.status === 'Returned') {
//             return res.status(400).json({
//                 success: false,
//                 error: 'Return already processed'
//             });
//         }



//         // Parse refund amount properly
//     let refundAmount = order.finalAmount;

//         if (isNaN(refundAmount) || refundAmount <= 0) {
//             return res.status(400).json({
//                 success: false,
//                 error: 'Invalid order amount'
//             });
//         }

//         try {
//             // 1. First restore inventory quantities
//            // 1. First restore inventory quantities
// for (const orderItem of order.orderedItems) {
//     const product = await Product.findById(orderItem.product._id);
    
//     if (!product) {
//         console.log(`Product not found for order item: ${orderItem._id}`);
//         continue;
//     }

//     // Restore the total product quantity
//     product.quantity += orderItem.quantity;

//     // Find and update the specific size quantity if applicable
//     if (order.size && Array.isArray(product.sizes)) {
//         const sizeIndex = product.sizes.findIndex(s => s.size === order.size);
        
//         if (sizeIndex !== -1) {
//             // Restore the quantity for this specific size
//             product.sizes[sizeIndex].quantity += orderItem.quantity;
            
//             console.log('Size quantity restored for return:', {
//                 size: order.size,
//                 quantityRestored: orderItem.quantity,
//                 newSizeQuantity: product.sizes[sizeIndex].quantity
//             });
//         } else {
//             console.log(`Warning: Size ${order.size} not found in product sizes during return`);
//         }
//     }

//     // Update product status if it was out of stock
//     if (product.status === 'out of stock' && product.quantity > 0) {
//         product.status = 'Available';
//     }

//     await product.save();
// }

//             // 2. Update order status
//             order.status = 'Return Request';
//             order.returnRequestedAt = new Date();
//             order.returnReason = returnReason;

//             // 3. Process refund to wallet
//             const refundSuccess = await processRefund(
//                 orderId,
//                 order.user,
//                 refundAmount,
//                 'Refund for returned order'
//             );

//             // 4. Save order after successful inventory update and refund
//             await order.save();
            
//             return res.json({
//                 success: true,
//                 message: 'Return request submitted, inventory restored, and refund processed successfully'
//             });
//         } catch (error) {
//             console.error('Return process failed:', error);
//             return res.status(500).json({
//                 success: false,
//                 error: 'Failed to process return',
//                 details: error.message
//             });
//         }

//     } catch (error) {
//         console.error('Error requesting return:', error);
//         res.status(500).json({
//             success: false,
//             error: 'Failed to request return',
//             details: error.message
//         });
//     }
// };



// ..........................



// const mongoose = require('mongoose');




const cancelOrder = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const userId = req.session.user._id;
        
        console.log('Starting cancel order process for order:', orderId);
        
        // Find the order and populate necessary product details
        const order = await Order.findById(orderId)
            .populate({
                path: 'orderedItems.product',
                select: '_id productName quantity sizes status'
            });

        if (!order) {
            console.log('Order not found:', orderId);
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        // Log each ordered item's details for debugging
        order.orderedItems.forEach((item, index) => {
            console.log(`Order Item ${index + 1}:`, {
                productId: item.product._id,
                quantity: item.quantity,
                itemSize: item.size || 'Not specified',
                orderSize: order.size || 'Not specified'
            });
        });

        // Basic validation
        if (order.status !== 'pending' && order.status !== 'processing') {
            console.log('Invalid order status for cancellation:', order.status);
            return res.status(400).json({
                success: false,
                error: 'Only pending and processing orders can be cancelled'
            });
        }

        if (order.isCancelledByUser) {
            console.log('Order already cancelled:', orderId);
            return res.status(400).json({
                success: false,
                message: "Order is already cancelled."
            });
        }

        // Process each ordered item to restore quantities
        // for (const orderItem of order.orderedItems) {
        //     try {
        //         console.log('===== STARTING QUANTITY RESTORATION =====');
        //         console.log('Processing order item:', {
        //             productId: orderItem.product._id,
        //             quantity: orderItem.quantity,
        //             itemSize: orderItem.size,
        //             orderSize: order.size
        //         });
                
        //         if (!orderItem || !orderItem.quantity || orderItem.quantity <= 0) {
        //             console.warn('Invalid order item or quantity', orderItem);
        //             continue;
        //         }

        //         const quantityToRestore = parseInt(orderItem.quantity, 10);
        //         if (isNaN(quantityToRestore)) {
        //             console.error('Invalid quantity format:', orderItem.quantity);
        //             continue;
        //         }
                
        //         const productId = orderItem.product._id || orderItem.product;
        //         const product = await Product.findById(productId);
                
        //         if (!product) {
        //             console.error(`Product not found for ID: ${productId}`);
        //             continue;
        //         }

        //         console.log('Found product:', {
        //             id: product._id,
        //             name: product.productName,
        //             currentQuantity: product.quantity,
        //             availableSizes: product.sizes.map(s => ({ size: s.size, qty: s.quantity }))
        //         });

        //         // Determine the size to use
        //         const sizeToUse = orderItem.size || order.size;
        //         console.log('Size being used for restoration:', sizeToUse);

        //         // Update total quantity
        //         const updatedQuantity = product.quantity + quantityToRestore;
                
        //         // Prepare size update
        //         let updatedSizes = [...product.sizes];
        //         if (sizeToUse) {
        //             const sizeIndex = updatedSizes.findIndex(s => s.size === sizeToUse);
        //             if (sizeIndex !== -1) {
        //                 console.log(`Updating existing size ${sizeToUse}:`, {
        //                     currentQty: updatedSizes[sizeIndex].quantity,
        //                     addingQty: quantityToRestore,
        //                     newQty: updatedSizes[sizeIndex].quantity + quantityToRestore
        //                 });
                        
        //                 updatedSizes[sizeIndex] = {
        //                     ...updatedSizes[sizeIndex],
        //                     quantity: updatedSizes[sizeIndex].quantity + quantityToRestore
        //                 };
        //             } else {
        //                 console.log(`Adding new size ${sizeToUse} with quantity ${quantityToRestore}`);
        //                 updatedSizes.push({
        //                     size: sizeToUse,
        //                     quantity: quantityToRestore
        //                 });
        //             }
        //         } else {
        //             console.log('No size specified, only updating total quantity');
        //         }

        //         // Update product status if necessary
        //         const newStatus = updatedQuantity > 0 ? 'Available' : 'out of stock';

        //         // Update product in a single operation
        //         const updatedProduct = await Product.findByIdAndUpdate(
        //             productId,
        //             {
        //                 $set: {
        //                     quantity: updatedQuantity,
        //                     sizes: updatedSizes,
        //                     status: newStatus
        //                 }
        //             },
        //             { new: true }
        //         );

        //         console.log('Product after update:', {
        //             id: updatedProduct._id,
        //             newQuantity: updatedProduct.quantity,
        //             updatedSizes: updatedProduct.sizes.map(s => ({ size: s.size, qty: s.quantity })),
        //             newStatus: updatedProduct.status
        //         });

        //         console.log('✅ Product successfully updated');
                
        //     } catch (error) {
        //         console.error('❌ Error during quantity restoration:', error);
        //         throw error;
        //     }
        // }

        
for (const orderItem of order.orderedItems) {
    try {
        console.log('===== STARTING QUANTITY RESTORATION =====');
        
        const quantityToRestore = parseInt(orderItem.quantity, 10);
        if (isNaN(quantityToRestore)) {
            console.error('Invalid quantity format:', orderItem.quantity);
            continue;
        }
        
        const productId = orderItem.product._id || orderItem.product;
        const product = await Product.findById(productId);
        
        if (!product) {
            console.error(`Product not found for ID: ${productId}`);
            continue;
        }

        // Log the order item details for debugging
        console.log('Order Item Details:', {
            productId: productId,
            quantity: quantityToRestore,
            size: orderItem.size, // Size should come from the order item
            productSizes: product.sizes
        });

        // Update total quantity first
        const updatedQuantity = product.quantity + quantityToRestore;
        
        // Get the size from the order item
        const sizeToRestore = orderItem.size;
        let updatedSizes = [...product.sizes];

        if (sizeToRestore) {
            // If we have a size, update the specific size quantity
            const sizeIndex = updatedSizes.findIndex(s => s.size === sizeToRestore);
            if (sizeIndex !== -1) {
                console.log(`Updating size ${sizeToRestore} quantity:`, {
                    before: updatedSizes[sizeIndex].quantity,
                    adding: quantityToRestore,
                    after: updatedSizes[sizeIndex].quantity + quantityToRestore
                });
                
                updatedSizes[sizeIndex].quantity += quantityToRestore;
            } else {
                console.log(`Adding new size ${sizeToRestore}`);
                updatedSizes.push({
                    size: sizeToRestore,
                    quantity: quantityToRestore
                });
            }
        }

        // Update product status
        const newStatus = updatedQuantity > 0 ? 'Available' : 'out of stock';

        // Update the product
        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            {
                $set: {
                    quantity: updatedQuantity,
                    sizes: updatedSizes,
                    status: newStatus
                }
            },
            { new: true }
        );

        console.log('Updated Product:', {
            id: updatedProduct._id,
            totalQuantity: updatedProduct.quantity,
            sizes: updatedProduct.sizes,
            status: updatedProduct.status
        });

    } catch (error) {
        console.error('Error restoring quantity:', error);
        throw error;
    }
}

        // Process refund if needed
        if (order.PaymentMethod !== 'COD') {
            console.log(`Processing refund for order ${orderId}, amount: ${order.finalAmount}`);
            
            try {
                const refundSuccess = await processRefund(
                    orderId,
                    userId,
                    order.finalAmount,
                    'Order cancellation refund'
                );

                if (!refundSuccess) {
                    throw new Error('Failed to process refund');
                }
                console.log('Refund processed successfully');
            } catch (refundError) {
                console.error('Refund processing failed:', refundError);
                throw new Error('Failed to process refund: ' + refundError.message);
            }
        }

        // Update order status
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            {
                $set: {
                    status: 'cancelled',
                    isCancelledByUser: true,
                    cancelledAt: new Date()
                }
            },
            { new: true }
        );

        console.log('Order updated:', {
            id: updatedOrder._id,
            newStatus: updatedOrder.status,
            cancelledAt: updatedOrder.cancelledAt
        });

        res.json({ 
            success: true,
            message: 'Order cancelled successfully and quantities restored'
        });

    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to cancel order',
            details: error.message
        });
    }
};



// const requestReturn = async (req, res) => {
//     try {
//         const orderId = req.params.orderId;
//         const { returnReason } = req.body;
        
//         console.log('Starting return request process for order:', orderId);
//         console.log('Return reason:', returnReason);

//         // Validate return reason
//         const validReasons = [
//             'Wrong Size', 
//             'Damaged Product', 
//             'Not as Described', 
//             'Changed Mind', 
//             'Quality Issue', 
//             'Other'
//         ];

//         if (!returnReason || !validReasons.includes(returnReason)) {
//             console.log('Invalid return reason:', returnReason);
//             return res.status(400).json({
//                 success: false,
//                 error: 'Please provide a valid return reason'
//             });
//         }

//         if (returnReason === 'Other' && (!req.body.otherReason || req.body.otherReason.trim().length < 10)) {
//             console.log('Insufficient details for "Other" reason');
//             return res.status(400).json({
//                 success: false,
//                 error: 'Please provide more detailed information for "Other" reason'
//             });
//         }

//         const order = await Order.findById(orderId)
//             .populate({
//                 path: 'orderedItems.product',
//                 select: '_id productName quantity sizes status'
//             });

//         if (!order) {
//             console.log('Order not found:', orderId);
//             return res.status(404).json({
//                 success: false,
//                 error: 'Order not found'
//             });
//         }

//         // Validation checks
//         if (order.status !== 'delivered') {
//             return res.status(400).json({
//                 success: false,
//                 error: 'Only delivered orders can be returned'
//             });
//         }

//         const sevenDaysInMilliseconds = 7 * 24 * 60 * 60 * 1000;
//         const deliveredDate = new Date(order.deliveredDate);
        
//         if (isNaN(deliveredDate.getTime())) {
//             return res.status(400).json({
//                 success: false,
//                 error: 'Invalid delivery date'
//             });
//         }
        
//         const isWithinReturnPeriod = (new Date() - deliveredDate) < sevenDaysInMilliseconds;
//         if (!isWithinReturnPeriod) {
//             return res.status(400).json({
//                 success: false,
//                 error: 'Return period has expired'
//             });
//         }

//         if (order.status === 'Return Request' || order.status === 'Returned') {
//             return res.status(400).json({
//                 success: false,
//                 error: 'Return already processed'
//             });
//         }

//         // 1. First process the refund
//         try {
//             console.log(`Processing refund for return, order ${orderId}, amount: ${order.finalAmount}`);
//             const refundSuccess = await processRefund(
//                 orderId,
//                 order.user,
//                 order.finalAmount,
//                 'Refund for returned order'
//             );

//             if (!refundSuccess) {
//                 throw new Error('Failed to process refund for return');
//             }
//             console.log('Return refund processed successfully');
//         } catch (refundError) {
//             console.error('Return refund processing failed:', refundError);
//             throw new Error('Failed to process return refund: ' + refundError.message);
//         }

//         // 2. Update order status
//         const updatedOrder = await Order.findByIdAndUpdate(
//             orderId,
//             {
//                 $set: {
//                     status: 'Return Request',
//                     returnRequestedAt: new Date(),
//                     returnReason: returnReason === 'Other' ? 
//                         `${returnReason}: ${req.body.otherReason}` : returnReason
//                 }
//             },
//             { new: true }
//         );

//         if (!updatedOrder) {
//             throw new Error('Failed to update order status');
//         }

//         // 3. Restore inventory quantities
//         for (const orderItem of order.orderedItems) {
//             try {
//                 const quantityToRestore = parseInt(orderItem.quantity, 10);
//                 if (isNaN(quantityToRestore)) {
//                     console.error('Invalid quantity format:', orderItem.quantity);
//                     continue;
//                 }
                
//                 const productId = orderItem.product._id || orderItem.product;
//                 const product = await Product.findById(productId);
                
//                 if (!product) {
//                     console.error(`Product not found for ID: ${productId}`);
//                     continue;
//                 }

//                 // Update total quantity
//                 const updatedQuantity = product.quantity + quantityToRestore;
                
//                 // Update size-specific quantity
//                 let updatedSizes = [...product.sizes];
//                 if (orderItem.size) {
//                     const sizeIndex = updatedSizes.findIndex(s => s.size === orderItem.size);
//                     if (sizeIndex !== -1) {
//                         updatedSizes[sizeIndex].quantity += quantityToRestore;
//                     } else {
//                         updatedSizes.push({
//                             size: orderItem.size,
//                             quantity: quantityToRestore
//                         });
//                     }
//                 }

//                 // Update product in database
//                 await Product.findByIdAndUpdate(
//                     productId,
//                     {
//                         $set: {
//                             quantity: updatedQuantity,
//                             sizes: updatedSizes,
//                             status: updatedQuantity > 0 ? 'Available' : 'out of stock'
//                         }
//                     }
//                 );

//             } catch (error) {
//                 console.error('Error restoring quantity:', error);
//                 // Continue with other items even if one fails
//                 continue;
//             }
//         }

//         return res.json({
//             success: true,
//             message: 'Return request submitted, inventory restored, and refund processed successfully'
//         });

//     } catch (error) {
//         console.error('Error requesting return:', error);
//         res.status(500).json({
//             success: false,
//             error: 'Failed to request return',
//             details: error.message
//         });
//     }
// };

// Initial return request by user



const requestReturn = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const { returnReason } = req.body;
        
        console.log('Starting return request process for order:', orderId);
        console.log('Return reason:', returnReason);

        // Validate return reason
        const validReasons = [
            'Wrong Size', 
            'Damaged Product', 
            'Not as Described', 
            'Changed Mind', 
            'Quality Issue', 
            'Other'
        ];

        if (!returnReason || !validReasons.includes(returnReason)) {
            console.log('Invalid return reason:', returnReason);
            return res.status(400).json({
                success: false,
                error: 'Please provide a valid return reason'
            });
        }

        if (returnReason === 'Other' && (!req.body.otherReason || req.body.otherReason.trim().length < 10)) {
            console.log('Insufficient details for "Other" reason');
            return res.status(400).json({
                success: false,
                error: 'Please provide more detailed information for "Other" reason'
            });
        }

        const order = await Order.findById(orderId)
            .populate({
                path: 'orderedItems.product',
                select: '_id productName quantity sizes status'
            });

        if (!order) {
            console.log('Order not found:', orderId);
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        // Validation checks
        if (order.status !== 'delivered') {
            return res.status(400).json({
                success: false,
                error: 'Only delivered orders can be returned'
            });
        }

        const sevenDaysInMilliseconds = 7 * 24 * 60 * 60 * 1000;
        const deliveredDate = new Date(order.deliveredDate);
        
        if (isNaN(deliveredDate.getTime())) {
            return res.status(400).json({
                success: false,
                error: 'Invalid delivery date'
            });
        }
        
        const isWithinReturnPeriod = (new Date() - deliveredDate) < sevenDaysInMilliseconds;
        if (!isWithinReturnPeriod) {
            return res.status(400).json({
                success: false,
                error: 'Return period has expired'
            });
        }

        if (order.status === 'Return Request' || order.status === 'Returned') {
            return res.status(400).json({
                success: false,
                error: 'Return already processed'
            });
        }

        // Update order status to Return Request
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            {
                $set: {
                    status: 'Return Request',
                    returnRequestedAt: new Date(),
                    returnReason: returnReason === 'Other' ? 
                        `${returnReason}: ${req.body.otherReason}` : returnReason
                }
            },
            { new: true }
        );

        return res.json({
            success: true,
            message: 'Return request submitted successfully'
        });

    } catch (error) {
        console.error('Error requesting return:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to request return',
            details: error.message
        });
    }
};

// // Admin processing of return request
// const processReturnRequest = async (req, res) => {
//     try {
//         const { orderId } = req.params;
//         const { status } = req.body;

//         console.log('Processing return request:', { orderId, newStatus: status });

//         if (status !== 'Returned') {
//             return res.status(400).json({
//                 success: false,
//                 error: 'Invalid status update'
//             });
//         }

//         const order = await Order.findById(orderId)
//             .populate({
//                 path: 'orderedItems.product',
//                 select: '_id productName quantity sizes status'
//             });

//         if (!order) {
//             return res.status(404).json({
//                 success: false,
//                 error: 'Order not found'
//             });
//         }

//         if (order.status !== 'Return Request') {
//             return res.status(400).json({
//                 success: false,
//                 error: 'Order is not in return request status'
//             });
//         }

//         // Process refund
//         try {
//             console.log(`Processing refund for return, order ${orderId}, amount: ${order.finalAmount}`);
//             const refundSuccess = await processRefund(
//                 orderId,
//                 order.user,
//                 order.finalAmount,
//                 'Refund for returned order'
//             );

//             if (!refundSuccess) {
//                 throw new Error('Failed to process refund for return');
//             }
//             console.log('Return refund processed successfully');
//         } catch (refundError) {
//             console.error('Return refund processing failed:', refundError);
//             throw new Error('Failed to process return refund: ' + refundError.message);
//         }

//         // Restore inventory quantities
//         for (const orderItem of order.orderedItems) {
//             try {
//                 const quantityToRestore = parseInt(orderItem.quantity, 10);
//                 if (isNaN(quantityToRestore)) {
//                     console.error('Invalid quantity format:', orderItem.quantity);
//                     continue;
//                 }
                
//                 const productId = orderItem.product._id || orderItem.product;
//                 const product = await Product.findById(productId);
                
//                 if (!product) {
//                     console.error(`Product not found for ID: ${productId}`);
//                     continue;
//                 }

//                 // Update total quantity
//                 const updatedQuantity = product.quantity + quantityToRestore;
                
//                 // Update size-specific quantity
//                 let updatedSizes = [...product.sizes];
//                 if (orderItem.size) {
//                     const sizeIndex = updatedSizes.findIndex(s => s.size === orderItem.size);
//                     if (sizeIndex !== -1) {
//                         updatedSizes[sizeIndex].quantity += quantityToRestore;
//                     } else {
//                         updatedSizes.push({
//                             size: orderItem.size,
//                             quantity: quantityToRestore
//                         });
//                     }
//                 }

//                 // Update product in database
//                 await Product.findByIdAndUpdate(
//                     productId,
//                     {
//                         $set: {
//                             quantity: updatedQuantity,
//                             sizes: updatedSizes,
//                             status: updatedQuantity > 0 ? 'Available' : 'out of stock'
//                         }
//                     }
//                 );

//             } catch (error) {
//                 console.error('Error restoring quantity:', error);
//                 continue;
//             }
//         }

//         // Update order status to Returned
//         await Order.findByIdAndUpdate(
//             orderId,
//             {
//                 $set: {
//                     status: 'Returned',
//                     refundStatus: {
//                         isRefunded: true,
//                         refundedAmount: order.finalAmount,
//                         refundedAt: new Date(),
//                         refundMethod: 'wallet'
//                     }
//                 }
//             }
//         );

//         return res.json({
//             success: true,
//             message: 'Return processed successfully, inventory restored and refund issued'
//         });

//     } catch (error) {
//         console.error('Error processing return:', error);
//         res.status(500).json({
//             success: false,
//             error: 'Failed to process return',
//             details: error.message
//         });
//     }
// };


const getUserOrders = async (req, res) => {
    try {
        if (!req.session.user || !req.session.user._id) {
            return res.redirect('/login');
        }

        // Fetch orders with populated product details
        const orders = await Order.find({ user: req.session.user._id })
            .populate('orderedItems.product')
            .populate('user')
            .sort({ createdOn: -1 }) // Most recent orders first
            .lean();


            console.log(orders)

        // Format orders for display
        const formattedOrders = orders.map(order => {
            // Calculate total items in order
            const totalItems = order.orderedItems.reduce((sum, item) => sum + item.quantity, 0);
            
            return {
                orderId: order._id,
                date: new Date(order.createdOn).toLocaleDateString(),
                status: order.status,
                total: order.finalAmount,
                paymentMethod: order.PaymentMethod,
                itemCount: totalItems,
                canReturn: order.status === 'delivered' && 
                          new Date() - new Date(order.createdOn) < 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
            };
        });

        console.log("FORMA",formattedOrders)

        return res.render('user/profile', {
            orders: formattedOrders,
            user: req.session.user,
            activeTab: 'orders'
        });

    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).render('error', {
            user: req.session.user,
            error: 'Error fetching orders'
        });
    }
};

// const processRefund = async (orderId, userId, amount, reason) => {

   
//     try {
//         const order = await Order.findById(orderId);
//         if (!order) throw new Error('Order not found');

//         let wallet = await Wallet.findOne({ user: userId });
// console.log('wallet :',wallet)

//         if (!wallet) {
//             wallet = new Wallet({ 
//                 user: userId,
//                 balance: 0,
//                 transactions: []
//             });
//         }

//         wallet.balance += amount;
//         wallet.transactions.push({
//             amount: amount,
//             type: 'credit',
//             description: reason,
//             orderId: orderId,
//             timestamp: new Date()
//         });

//         await wallet.save();

//         order.refundStatus = {
//             isRefunded: true,
//             refundedAmount: amount,
//             refundedAt: new Date(),
//             refundMethod: 'wallet'
//         };

//         await order.save();

//         console.log(`Refund processed successfully: Amount ${amount} credited to wallet for order ${orderId}`);
//         return true;
//     } catch (error) {
//         console.error('Refund processing error:', error);
//         return false;
//     }
// };

const processRefund = async (orderId, userId, amount, reason) => {
    try {
        const order = await Order.findById(orderId);
        if (!order) throw new Error('Order not found');

        // Find or create wallet with proper error handling
        let wallet = await Wallet.findOne({ user: userId });
        console.log('wallet before:', wallet);

        if (!wallet) {
            wallet = new Wallet({ 
                user: userId,
                balance: 0,
                transactions: []
            });
            // Save the new wallet first
            await wallet.save();
            console.log('Created new wallet');
        }

        // Ensure amount is a number
        const refundAmount = Number(amount);
        if (isNaN(refundAmount) || refundAmount <= 0) {
            throw new Error(`Invalid refund amount: ${amount}`);
        }

        // Update wallet with transaction
        wallet.balance += refundAmount;
        wallet.transactions.push({
            amount: refundAmount,
            type: 'credit',
            description: reason,
            orderId: orderId,
            timestamp: new Date()
        });

        // Save wallet changes
        const updatedWallet = await wallet.save();
        console.log('Updated wallet balance:', updatedWallet.balance);

        // Update order status
        order.refundStatus = {
            isRefunded: true,
            refundedAmount: refundAmount,
            refundedAt: new Date(),
            refundMethod: 'wallet'
        };

        await order.save();

        console.log(`Refund processed successfully: Amount ${refundAmount} credited to wallet for order ${orderId}`);
        return true;
    } catch (error) {
        console.error('Refund processing error:', error);
        throw error; // Re-throw to handle it in the calling function
    }
};





module.exports = {
    orderSuccessPage,
    cancelOrder,
    requestReturn,
    getUserOrders,
    processRefund
};