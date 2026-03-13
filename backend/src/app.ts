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
    crossOriginResourcePolicy: false, // Отключаем для раздачи статики с других портов
}))

// Защита от DDoS атак 
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 250, // Максимум 250 запросов (с запасом для автоматических тестов)
    message: 'Слишком много запросов с вашего IP, пожалуйста, попробуйте позже',
})
app.use(limiter)

app.use(cookieParser())

// Разрешаем CORS с поддержкой куки 
app.use(cors({ origin: true, credentials: true }))

// Ограничение размера payload 
app.use(urlencoded({ extended: true, limit: '10kb' }))
app.use(json({ limit: '10kb' }))

//  Защита от NoSQL-инъекций 
app.use(mongoSanitize())

// Защита от CSRF атак
const csrfProtection = csurf({ cookie: true })

// Роут для получения CSRF токена фронтендом 
app.get('/auth/csrf-token', csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() })
})

app.use(serveStatic(path.join(__dirname, 'public')))

app.options('*', cors())

// Применяем CSRF-защиту ко всем маршрутам API
app.use(csrfProtection)

app.use(routes)
app.use(errors())
app.use(errorHandler)

// eslint-disable-next-line no-console
const bootstrap = async () => {
    try {
        await mongoose.connect(DB_ADDRESS)
        await app.listen(PORT, () => console.log(`Server started on port ${PORT}`))
    } catch (error) {
        console.error(error)
    }
}

bootstrap()