import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs'
import dotenv from 'dotenv'
dotenv.config()


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


async function uploadOnCloudinary(localFilePath) {
    try {
        if (!localFilePath) return null;
        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto'
        })
        // file has been uploaded successfully
        console.log('File has been uploaded on cloudinary:', response.url)
        fs.unlinkSync(localFilePath)
        return response;
    } catch (err) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation failed
        console.error("cloudinary error:", err);
        return null;
    }
}

export { uploadOnCloudinary }