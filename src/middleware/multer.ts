// import { Request } from 'express'
// import multer from 'multer'

// const storage = multer.diskStorage({
//     destination : function(req:Request,file:Express.Multer.File,cb:any){
//         cb(null,'./src/uploads')
//     }, 
//     filename : function(req:Request,file:Express.Multer.File,cb:any){
//         cb(null,Date.now() + "-" + file.originalname)
//     }
// })

// export {multer,storage}


import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import { envConfig } from '../config/config'; // adjust path if needed

cloudinary.config({
  cloud_name: envConfig.cloud_name,
  api_key: envConfig.cloud_api_key,
  api_secret: envConfig.cloud_api_secret,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      folder: 'e-shoe',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    };
  },
});

const upload = multer({ storage });

export { upload };
