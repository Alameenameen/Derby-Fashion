
const multer = require("multer");
const path = require("path");


const storage = multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,path.join(__dirname,"../public/uploads"))
    },
    filename:(req,file,cb)=>{
        cb(null,Date.now()+"-"+file.originalname)
    }
})


const uploads = multer({ storage });

const addBrandWithImage = uploads.single('brandImage');

const uploadCategoryImage = uploads.single('categoryImage');

module.exports = {
    uploads,
    addBrandWithImage,
    uploadCategoryImage,
};


// const multer = require("multer");
// const path = require("path");
// const sharp = require("sharp"); // Recommended for image processing

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, path.join(__dirname, "../public/uploads"));
//     },
//     filename: (req, file, cb) => {
//         cb(null, Date.now() + "-" + file.originalname);
//     }
// });

// const fileFilter = (req, file, cb) => {
//     // Accept only specific image types
//     if (
//         file.mimetype === 'image/jpeg' || 
//         file.mimetype === 'image/png' || 
//         file.mimetype === 'image/webp'
//     ) {
//         cb(null, true);
//     } else {
//         cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'), false);
//     }
// };

// const uploadOptions = {
//     storage: storage,
//     fileFilter: fileFilter,
//     limits: {
//         fileSize: 5 * 1024 * 1024 // 5MB file size limit
//     }
// };

// const uploads = multer(uploadOptions);

// // Image processing middleware
// const processImage = async (req, file, cb) => {
//     if (!file) return cb(null, file);

//     try {
//         const processedImageBuffer = await sharp(file.buffer)
//             .resize({
//                 width: 800,  // Resize to a standard width
//                 height: 800, // Resize to a standard height
//                 fit: sharp.fit.cover, // Crop to cover
//                 position: sharp.strategy.attention // Smart cropping
//             })
//             .webp({ quality: 80 }) // Convert to WebP with good quality
//             .toBuffer();

//         // Modify the file object
//         file.buffer = processedImageBuffer;
//         file.originalname = file.originalname.split('.')[0] + '.webp';
        
//         cb(null, file);
//     } catch (error) {
//         cb(error);
//     }
// };

// const addBrandWithImage = [
//     uploads.single('brandImage'),
//     processImage
// ];

// const uploadCategoryImage = [
//     uploads.single('categoryImage'),
//     processImage
// ];

// module.exports = {
//     uploads,
//     addBrandWithImage,
//     uploadCategoryImage,
//     processImage
// };
