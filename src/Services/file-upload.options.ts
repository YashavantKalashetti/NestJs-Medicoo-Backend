import { diskStorage } from 'multer';
import { extname } from 'path';

export const multerOptions = {
    storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
            const userFileName = req.body.filename;
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const finalFileName = `${uniqueSuffix}#_#${file.originalname}`;
            cb(null, finalFileName);
        },
    }),
};
