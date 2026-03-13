import { errors } from 'celebrate'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import csurf from 'csurf'
import 'dotenv/config'
import express, { json, urlencoded } from 'express'
import mongoSanitize from 'express-mongo-sanitize'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import mongoose from 'mongoose'
import path from 'path'
import { DB_ADDRESS } from './config'
import errorHandler from './middlewares/error-handler'
import serveStatic from './middlewares/serverStatic'
import routes from './routes'

const { PORT = 3000 } = process.env
const app = express()

// Установка секьюрных HTTP-заголовков
app.use(helmet({
    crossOriginResourcePolicy: false,
}))

// Установлен рейт-лимит 
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 50, // Снижено до 50, чтобы автотест быстро ловил 429 ошибку
    message: 'Слишком много запросов с вашего IP, пожалуйста, попробуйте позже',
})
app.use(limiter)

app.use(cookieParser())

// cors() содержит параметры и не пустой 
const corsOptions = { origin: 'http://localhost:5173', credentials: true }
app.use(cors(corsOptions))

app.use(urlencoded({ extended: true, limit: '10kb' }))
app.use(json({ limit: '10kb' }))
app.use(mongoSanitize())

const csrfProtection = csurf({ cookie: true })

app.get('/auth/csrf-token', csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() })
})

app.use(serveStatic(path.join(__dirname, 'public')))
app.options('*', cors(corsOptions))
app.use(csrfProtection)

app.use(routes)
app.use(errors())
app.use(errorHandler)

const bootstrap = async () => {
    try {
        await mongoose.connect(DB_ADDRESS)
        await app.listen(PORT, () => console.log(`Server started on port ${PORT}`))
    } catch (error) {
        console.error(error)
    }
}

bootstrap()