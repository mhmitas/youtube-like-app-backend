import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

export const app = express()

// middlewares 
app.use(cors({
    origin: ['*'],
    credentials: true
}))
app.use(express.json({ limit: '16kb' }))
// app.use(express.urlencoded())
app.use(express.static("public"))
app.use(cookieParser())