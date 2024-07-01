export const asyncHandler = (reqHandler) => {
    return (req, res, next) => {
        Promise.resolve(reqHandler(req, res, next)).catch((err) => next(err))
    }
}


// // Using try catch method
// export const asyncHandler = (fn) => {
//     async (req, res, next) => {
//         try {
//             await fn(req, res, next)
//         } catch (err) {
//             console.error(err);
//             res.status(err.code || 500).json({ success: false, message: err.message })
//         }
//     }
// }