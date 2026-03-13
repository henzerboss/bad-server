import { NextFunction, Request, Response } from 'express'
import { constants } from 'http2'
import { basename } from 'path'
import fs from 'fs'
import sharp from 'sharp'
import BadRequestError from '../errors/bad-request-error'

export const uploadFile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (!req.file) {
        return next(new BadRequestError('Файл не загружен'))
    }

    // Лимит файла по минимуму (отсеиваем файлы меньше 2kb)
    if (req.file.size <= 2048) {
        fs.unlinkSync(req.file.path);
        return next(new BadRequestError('Размер файла должен быть больше 2kb'));
    }

    try {
        // Проверка метаданных, чтобы убедиться, что это действительно картинка
        await sharp(req.file.path).metadata();
    } catch (err) {
        fs.unlinkSync(req.file.path);
        return next(new BadRequestError('Недействительный формат изображения'));
    }

    try {
        // Извлекаем чистое имя файла без вложенностей через basename()
        const safeFileName = basename(req.file.filename);
        const fileName = process.env.UPLOAD_PATH
            ? `/${process.env.UPLOAD_PATH}/${safeFileName}`
            : `/${safeFileName}`
        return res.status(constants.HTTP_STATUS_CREATED).send({
            fileName,
            originalName: req.file?.originalname,
        })
    } catch (error) {
        return next(error)
    }
}

export default {}