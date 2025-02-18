const Category = require("../../model/categorySchema");
const Product  = require("../../model/productSchema");

// console.log(Category)



// const categoryInfo = async (req,res)=>{
//       try {
//         const page = parseInt(req.query.page) || 1;
//         const limit = 4;
//         const skip = (page-1)*limit;
//         const categoryData = await Category.find({})
//         .sort({createdAt:-1})
//         .skip(skip)
//         .limit(limit);

//         const totalCategories = await Category.countDocuments();
//         const totalPages = Math.ceil(totalCategories / limit);
//         res.render('category',{
//             cat:categoryData,
//             currentPage:page,
//             totalPages:totalPages,
//             totalCategories:totalCategories
//         });
//       } catch (error) {
//         console.error("error fetching categories",error);
//         res.redirect("/pageerror")
//       }
// }

const categoryInfo = async (req, res) => {
    try {
        const search = req.query.search || "";
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;

        // Create search query
        const searchQuery = {
            name: { $regex: new RegExp(".*" + search + ".*", "i") }
        };

        const categoryData = await Category.find(searchQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Count total matching documents for pagination
        const totalCategories = await Category.countDocuments(searchQuery);
        const totalPages = Math.ceil(totalCategories / limit);

        res.render('category', {
            cat: categoryData,
            currentPage: page,
            totalPages: totalPages,
            totalCategories: totalCategories,
            searchQuery: search  // Pass search query to maintain in input field
        });
    } catch (error) {
        console.error("error fetching categories", error);
        res.redirect("/pageerror");
    }
};



const addCategory = async (req,res)=>{
    const {name,description,type} = req.body;
    try {
        const existingCategory = await Category.findOne({name});
        const categoryImage = req.file ? req.file.filename : null;

        if (!categoryImage) {
            return res.status(400).json({ error: "Category image is required" });
        }

        if(existingCategory){
            return res.status(400).json({error:"category already exists"})
        }

        if (!['Clothing', 'Footwear'].includes(type)) {
            return res.status(400).json({ error: "Invalid category type" });
        }

        const newCategory = new Category({
            name,
            description,
            type,
            categoryImage,
            isListed: true
        })

        await newCategory.save();
        return res.json({message:"category added succefully"})
    } catch (error) {
        return res.status(500).json({error:"internal server error"})
    }
}


const getListCategory = async(req,res)=>{
      try {
        let id = req.query.id;
        await Category.updateOne({_id:id},{$set:{isListed:false}});
        res.redirect("/admin/Category");
      } catch (error) {
        res.redirect("/pageerror");
      }
}


const getunListCategory = async(req,res)=>{
    try {
      let id = req.query.id;
      await Category.updateOne({_id:id},{$set:{isListed:true}});
      res.redirect("/admin/Category");
    } catch (error) {
      res.redirect("/pageerror");
    }
}




const getEditCategory =async(req,res)=>{
    try {

        const id= req.query.id;
        const category = await Category.findOne({_id:id});
        res.render("edit-category",{category:category});
        
    } catch (error) {
        res.redirect("/pageerror")
    }
}


// edit category///
const editCategory = async(req,res)=>{
    try {

        const id = req.params.id;
        const {categoryName,description,type} = req.body;
        const existingCategory = await Category.findOne({
            name: categoryName,
            _id: { $ne: id }, // Ensure we're not matching the current category being edited
        });

        if (!['Clothing', 'Footwear'].includes(type)) {
            return res.status(400).json({ error: "Invalid category type" });
        }
        // checking existing name 
        if(existingCategory){
            return res.status(400).json({error:"Category exist, Please choose another Name."})
        }

        //update category
        const updateCategory = await Category.findByIdAndUpdate(
            id,
            { name: categoryName, description, type },
            { new: true } // Return the updated document
        );

        if(updateCategory){
            res.redirect("/admin/category")
        }else{
            res.status(404).json({error:"Category Not found"})
        }
        
    } catch (error) {
        res.status(500).json({error:"Internal server error"})
        
    }
}


// const getOffer = async (req, res) => {
//     try {
//         const categoryId = req.params.id;
//         const category = await Category.findById(categoryId);
        
//         if (!category || !category.categoryOffer) {
//             return res.status(404).json({ error: "Offer not found" });
//         }

//         res.json({
//             percentage: category.categoryOffer.percentage,
//             startDate: category.categoryOffer.startDate,
//             endDate: category.categoryOffer.endDate
//         });
//     } catch (error) {
//         console.error("Error fetching offer:", error);
//         res.status(500).json({ error: "Internal server error" });
//     }
// };

// const addOffer = async (req, res) => {
//     try {
//         const { categoryId, percentage, startDate, endDate } = req.body;
        
//         if (!categoryId || !percentage || !startDate || !endDate) {
//             return res.status(400).json({ error: "All fields are required" });
//         }

//         // Validate percentage
//         if (percentage < 1 || percentage >= 100) {
//             return res.status(400).json({ error: "Percentage must be between 1 and 99" });
//         }

//         const category = await Category.findById(categoryId);
//         if (!category) {
//             return res.status(404).json({ error: "Category not found" });
//         }

//         category.categoryOffer = {
//             percentage: parseInt(percentage),
//             startDate: new Date(startDate),
//             endDate: new Date(endDate),
//             isActive: true
//         };
        
//         await category.save();
        
//         res.status(200).json({ message: "Category offer added successfully" });
//     } catch (error) {
//         console.error("Error adding offer:", error);
//         res.status(500).json({ error: "Internal server error" });
//     }
// };

// const editOffer = async (req, res) => {
//     try {
//         const { categoryId, percentage, startDate, endDate } = req.body;
        
//         if (!categoryId || !percentage || !startDate || !endDate) {
//             return res.status(400).json({ error: "All fields are required" });
//         }

//         const category = await Category.findById(categoryId);
//         if (!category) {
//             return res.status(404).json({ error: "Category not found" });
//         }

//         category.categoryOffer = {
//             percentage: parseInt(percentage),
//             startDate: new Date(startDate),
//             endDate: new Date(endDate),
//             isActive: true
//         };
        
//         await category.save();
        
//         res.status(200).json({ message: "Category offer updated successfully" });
//     } catch (error) {
//         console.error("Error editing offer:", error);
//         res.status(500).json({ error: "Internal server error" });
//     }
// };

// const removeOffer = async (req, res) => {
//     try {
//         const { categoryId } = req.body;
        
//         const category = await Category.findById(categoryId);
//         if (!category) {
//             return res.status(404).json({ error: "Category not found" });
//         }

//         category.categoryOffer = undefined;
//         await category.save();
        
//         res.status(200).json({ message: "Category offer removed successfully" });
//     } catch (error) {
//         console.error("Error removing offer:", error);
//         res.status(500).json({ error: "Internal server error" });
//     }
// };

const getOffer = async (req, res) => {
    try {
        const categoryId = req.params.id;

        // Validate categoryId format
        if (!categoryId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: "Invalid category ID" });
        }

        const category = await Category.findById(categoryId);

        console.log("Category Data:", category);


        if (!category || !category.categoryOffer || !category.categoryOffer.isActive) {
            return res.status(404).json({ error: "Offer not found" });
        }

        console.log("Offer Data:", category.categoryOffer);

        res.json({
            percentage: category.categoryOffer.percentage,
            startDate: category.categoryOffer.startDate,
            endDate: category.categoryOffer.endDate,
            isActive: category.categoryOffer.isActive
        });
    } catch (error) {
        console.error("Error fetching offer:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


const addOffer = async (req, res) => {
    try {
        const { categoryId, percentage, startDate, endDate } = req.body;

        if (!categoryId || !percentage || !startDate || !endDate) {
            return res.status(400).json({ error: "All fields are required" });
        }

        if (percentage < 1 || percentage >= 100) {
            return res.status(400).json({ error: "Percentage must be between 1 and 99" });
        }

        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ error: "Category not found" });
        }

        category.categoryOffer = {
            percentage: parseInt(percentage),
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            isActive: true
        };

        await category.save();

        // Update all products in this category
        const products = await Product.find({ category: categoryId });

        for (const product of products) {
            const productDiscount = product.offer?.percentage || 0;
            const categoryDiscount = parseInt(percentage);

            // Apply the highest discount
            const maxDiscount = Math.max(productDiscount, categoryDiscount);
           let offerPrice = product.regularPrice - (product.regularPrice * maxDiscount) / 100;
           product.salePrice = parseInt(offerPrice)

            await product.save();
        }

        res.status(200).json({ message: "Category offer added successfully and product prices updated" });
    } catch (error) {
        console.error("Error adding offer:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


const editOffer = async (req, res) => {
    try {
        const { categoryId, percentage, startDate, endDate } = req.body;

        if (!categoryId || !percentage || !startDate || !endDate) {
            return res.status(400).json({ error: "All fields are required" });
        }

        if (percentage < 1 || percentage >= 100) {
            return res.status(400).json({ error: "Percentage must be between 1 and 99" });
        }

        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ error: "Category not found" });
        }

        category.categoryOffer = {
            percentage: parseInt(percentage),
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            isActive: true
        };

        await category.save();

        // Update all products in this category
        const products = await Product.find({ category: categoryId });

        for (const product of products) {
            const productDiscount = product.offer?.percentage || 0;
            const categoryDiscount = parseInt(percentage);

            // Apply the highest discount
            const maxDiscount = Math.max(productDiscount, categoryDiscount);
           let offerPrice = product.regularPrice - (product.regularPrice * maxDiscount) / 100;
           product.salePrice = parseInt(offerPrice)

            await product.save();
        }

        res.status(200).json({ message: "Category offer updated successfully and product prices adjusted" });
    } catch (error) {
        console.error("Error editing offer:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


const removeOffer = async (req, res) => {
    try {
        const { categoryId } = req.body;

        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ error: "Category not found" });
        }

        category.categoryOffer = undefined;
        await category.save();

        // Update all products in this category
        const products = await Product.find({ category: categoryId });

        for (const product of products) {
            const productDiscount = product.offer?.percentage || 0;

            if (productDiscount > 0) {
                // Apply product's own discount if available
                product.salePrice = parseInt(product.regularPrice - (product.regularPrice * productDiscount) / 100);
            } else {
                // Otherwise, reset to original price
                product.salePrice = product.regularPrice;
            }

            await product.save();
        }

        res.status(200).json({ message: "Category offer removed and product prices restored" });
    } catch (error) {
        console.error("Error removing offer:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};



module.exports = {
    categoryInfo,
    addCategory,
    getunListCategory,
    getListCategory,
    getEditCategory,
    editCategory,
    getOffer,
    addOffer,
    editOffer,
    removeOffer
}