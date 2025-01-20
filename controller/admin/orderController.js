const Order = require('../../model/orderSchema');
const Product = require('../../model/productSchema');
const Address = require('../../model/addressSchema');




    // Get all orders
    const getAllOrders = async (req, res) => {
        try {
            const orders = await Order.find()
                .populate({
                    path: 'orderedItems.product',
                    select: 'productName productImage salePrice'
                })
                .populate('user', 'name email')
                .sort({ createdOn: -1 });
    

                // console.log("total orders:",orders)
            // Pass additional details like status if needed
            res.render('orders', {
                orders,  // Rendered data
                currentPage: 'orders'  // For highlighting the current page in navigation
            });
        } catch (error) {
            console.error('Error fetching orders:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching orders',
                error: error.message
            });
        }
    };
    
    


    const updateOrderStatus = async (req, res) => {
        try {
            const orderId = req.params.id;
            const { status } = req.body;


            // console.log("orderid of status",orderId)
            // console.log("orderid of status2",status)

            
            const order = await Order.findByIdAndUpdate(
                orderId,
                { status },
                { new: true }
            );
    
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }
    
            if (order.isCancelledByUser) {
                return res.status(403).json({
                    success: false,
                    message: "Order has been cancelled by the user. Status updates are not allowed.",
                });
            }

            order.status = status;
            await order.save();

            res.status(200).json({
                success: true,
                message: 'Order status updated successfully',
                order
            });
        } catch (error) {
            console.error('Error updating order status:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating order status',
                error: error.message
            });
        }
    };
  

module.exports = {
    getAllOrders,
    updateOrderStatus,
}