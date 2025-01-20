const Category = require("../../model/categorySchema");

console.log(Category)



const categoryInfo = async (req,res)=>{
      try {
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page-1)*limit;
        const categoryData = await Category.find({})
        .sort({createdAt:-1})
        .skip(skip)
        .limit(limit);

        const totalCategories = await Category.countDocuments();
        const totalPages = Math.ceil(totalCategories / limit);
        res.render('category',{
            cat:categoryData,
            currentPage:page,
            totalPages:totalPages,
            totalCategories:totalCategories
        });
      } catch (error) {
        console.error("error fetching categories",error);
        res.redirect("/pageerror")
      }
}



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



module.exports = {
    categoryInfo,
    addCategory,
    getunListCategory,
    getListCategory,
    getEditCategory,
    editCategory
}