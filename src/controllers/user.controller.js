import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from 'jsonwebtoken';

// register user
export const registerUser = asyncHandler(async (req, res) => {
    // get user data from request
    const { userName, fullName, email, password } = req.body;
    // console.log({ userName, fullName, email, password })
    // data validation
    if (
        [userName, fullName, email, password].some((field) => field.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }
    // check, is the already exists ? if (return) else (save the user data to the database)
    const existedUser = await User.findOne({
        $or: [{ email }, { userName }]
    })
    if (existedUser) {
        console.log({ existedUser: !!existedUser })
        throw new ApiError(409, 'user with email or username already exists')
    }
    // check for images and avatar(required)
    // i should add more condition to validate images
    let coverImage;
    if (req.files?.coverImage) {
        const coverImageLocalPath = req.files?.coverImage[0]?.path
        // upload coverImage to cloudinary
        coverImage = await uploadOnCloudinary(coverImageLocalPath)
    }
    if (!req.files?.avatar) {
        throw new ApiError(400, 'avatar is required')
    }
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // upload avatar to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    // console.log({ avatar, coverImage })
    if (!avatar) {
        throw new ApiError(500, 'something went wrong, avatar not uploaded')
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
    // console.log({ result })
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


// login user
export const loginUser = asyncHandler(async (req, res) => {
    // get user data from request
    const { email, password } = req.body;
    console.log(req.body)
    if (!email || !password) {
        throw new ApiError(400, "email and password required")
    }
    // find user data from db via user email 
    const dbUser = await User.findOne({ email })
    if (!dbUser) {
        throw new ApiError(404, "User not found")
    }
    // verify password | compare password
    const isPasswordValid = await dbUser.isPasswordCorrect(password)
    console.log(isPasswordValid)
    if (!isPasswordValid) {
        throw new ApiError(401, "wrong password")
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(dbUser._id)

    const loggedInUser = await User.findById(dbUser._id).select("-password -refreshToken")
    console.log(loggedInUser)

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken,
                    verified: true
                },
            )
        )
})


export const logoutUser = asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { refreshToken: undefined } },
        { new: true }
    )
    console.log("after delete refreshToken:", user)

    const options = {
        httpOnly: true,
        secure: true
    }

    res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, { user: null }, 'logout success'))
})


export const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(200, { user: req.user })
})


export const refreshAccessToken = asyncHandler(async (req, res) => {
    try {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
        if (!incomingRefreshToken) {
            throw new ApiError(401, 'unauthorize request')
        }
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const dbUser = await User.findById(decodedToken?._id)

        if (!dbUser) {
            throw new ApiError(401, 'invalid refreshToken')
        }

        if (incomingRefreshToken !== dbUser?.refreshToken) {
            throw new ApiError(401, "invalid or expired refreshToken")
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(dbUser._id);

        const options = {
            httpOnly: true,
            secure: true
        }

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken },
                    "access token refreshed"
                )
            )
    } catch (err) {
        throw new ApiError(401, err?.message || "invalid access token")
    }

})


async function generateAccessAndRefreshToken(userId) {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "something went wrong when generateAccessAndRefreshToken")
    }
}

// update related APIs

export const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) {
        throw new ApiError(400, "invalid password")
    }
    user.password = password
    await user.save({ validateBeforeSave: false })
    res
        .status(200)
        .json(
            new ApiResponse(200, { passwordChanged: true })
        )
})

export const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName } = req.body
    if (!fullName) {
        throw new ApiError(400, "fullName is required")
    }
    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: { fullName } },
        { new: true }
    ).select("-password")
    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedUser, "Account Detail Updated")
        )
})

export const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar.url) {
        throw new ApiError(500, "Error while uploading avatar")
    }
    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: { avatar: avatar?.url } },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedUser, "avatar Updated")
        )
})

export const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;
    if (!coverImageLocalPath) {
        throw new ApiError(400, "coverImage file is missing")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!avatar.url) {
        throw new ApiError(500, "Error while uploading avatar")
    }
    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: { coverImage: coverImage?.url } },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedUser, "coverImage Updated")
        )
})