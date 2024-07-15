import dotenv from "dotenv";
import connectDB from "./src/db/db.js";
import { app } from "./src/app.js";
dotenv.config()


connectDB()
    .then(() => {
        app.listen(process.env.PORT || 5000, () => {
            console.log('Server is running on port:', process.env.PORT)
        })
    })
    .catch(err => {
        console.error('mongodb connection err:', err);
    })
