import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const registerUser = asyncHandler(async (req, res) => {
    // get user data from request
    const { userName, fullName, email, password } = req.body;
    console.log({ userName, fullName, email, password })
    // data validation
    if (
        [userName, fullName, email, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }
    // check, is the already exists ? if (return) else (save the user data to the database)
    const existedUser = await User.findOne({
        $or: [{ email }, { userName }]
    })
    if (existedUser) {
        throw new ApiError(409, 'user with email or username already exists')
    }
    // check for images and avatar(required)
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path
    console.log({ avatar: req.files?.avatar[0]?.path })
    if (!avatarLocalPath) {
        throw new ApiError(400, 'avatar is required')
    }
    // upload them to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    console.log({ avatar, coverImage })
    if (!avatar) {
        throw new ApiError(400, 'avatar is required')
    }
    // create user object - create entry in db
    const result = await User.create({
        fullName,
        userName: userName.toLowerCase(),
        email,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
    })
    console.log({ result })
    // check for user creation
    // remove password and refresh token field from response
    const createdUser = await User.findById(result._id).select(
        "-password -refreshToken"
    )
    if (!createdUser) {
        throw new ApiError(500, `something went wrong while register`)
    }
    // return response
    return res.status(302).json(
        new ApiResponse(201, createdUser, 'registration success')
    )
})