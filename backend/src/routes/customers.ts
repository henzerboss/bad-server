import { Router, Request, Response, NextFunction } from 'express'
import {
    deleteCustomer,
    getCustomerById,
    getCustomers,
    updateCustomer,
} from '../controllers/customers'
import auth, { roleGuardMiddleware } from '../middlewares/auth'
import { Role } from '../models/user'
import BadRequestError from '../errors/bad-request-error'

const customerRouter = Router()

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

    next();
}

customerRouter.get('/', auth, roleGuardMiddleware(Role.Admin), normalizeLimitAndPreventInjection, getCustomers)
customerRouter.get('/:id', auth, roleGuardMiddleware(Role.Admin), getCustomerById)
customerRouter.patch('/:id', auth, roleGuardMiddleware(Role.Admin), updateCustomer)
customerRouter.delete('/:id', auth, roleGuardMiddleware(Role.Admin), deleteCustomer)

export default customerRouter