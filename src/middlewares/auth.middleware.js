import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from 'jsonwebtoken'

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = await req.cookies?.accessToken || req.header('Authorization')?.replace("Bearer ", "")
        if (!token) {
            throw new ApiError(401, "Unauthorize request")
        }
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
        if (!user) {
            throw new ApiError(401, "Invalid Access Token")
        }
        req.user = user;
        next()
    } catch (err) {
        throw new ApiError(401, err?.message || "verifyJWT Token error")
    }
})