import { Router, Request, Response, NextFunction } from 'express'
import {
    createOrder,
    deleteOrder,
    getOrderByNumber,
    getOrderCurrentUserByNumber,
    getOrders,
    getOrdersCurrentUser,
    updateOrder,
} from '../controllers/order'
import auth, { roleGuardMiddleware } from '../middlewares/auth'
import { validateOrderBody } from '../middlewares/validations'
import { Role } from '../models/user'
import BadRequestError from '../errors/bad-request-error'

const orderRouter = Router()

// Защита от инъекций объектов и жесткое нормирование лимита пагинации
const normalizeLimitAndPreventInjection = (req: Request, _res: Response, next: NextFunction) => {
    if (req.query.limit) {
        req.query.limit = String(Math.min(Number(req.query.limit), 10)); // Лимит максимум 10
    }
    
    const hasObjectInjection = Object.keys(req.query).some(
        (key) => typeof req.query[key] === 'object'
    );

    if (hasObjectInjection) {
        return next(new BadRequestError('Неверный формат параметра запроса'));
    }

    if (req.query.search && typeof req.query.search === 'string' && req.query.search.length > 50) {
        return next(new BadRequestError('Слишком длинный поисковый запрос'));
    }
    next();
}

orderRouter.post('/', auth, validateOrderBody, createOrder)
orderRouter.get('/all', auth, roleGuardMiddleware(Role.Admin), normalizeLimitAndPreventInjection, getOrders)
orderRouter.get('/all/me', auth, normalizeLimitAndPreventInjection, getOrdersCurrentUser)
orderRouter.get(
    '/:orderNumber',
    auth,
    roleGuardMiddleware(Role.Admin),
    getOrderByNumber
)
orderRouter.get('/me/:orderNumber', auth, getOrderCurrentUserByNumber)
orderRouter.patch(
    '/:orderNumber',
    auth,
    roleGuardMiddleware(Role.Admin),
    updateOrder
)

orderRouter.delete('/:id', auth, roleGuardMiddleware(Role.Admin), deleteOrder)

export default orderRouter