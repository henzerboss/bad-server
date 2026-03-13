import { NextFunction, Request, Response } from 'express'
import fs from 'fs'
import path from 'path'

export default function serveStatic(baseDir: string) {
    return (req: Request, res: Response, next: NextFunction) => {
        //  Нормализация путей
        const normalizedBaseDir = path.resolve(baseDir)
        const filePath = path.resolve(path.join(normalizedBaseDir, req.path))

        // Проверяем, что итоговый путь не выходит за пределы директории baseDir
        if (!filePath.startsWith(normalizedBaseDir)) {
            return next()
        }

        fs.access(filePath, fs.constants.F_OK, (accessErr) => {
            if (accessErr) {
                return next()
            }
            return res.sendFile(filePath, (sendErr) => {
                if (sendErr) {
                    next(sendErr)
                }
            })
        })
    }
}