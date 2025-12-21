import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InstituteController } from './institute.controller';
import { InstituteService } from './institute.service';
import { Institute, InstituteSchema } from './schemas/institute.schema';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

// Configure Multer for file uploads
const multerConfig = {
  storage: diskStorage({
    destination: './uploads/institutes',
    filename: (req, file, callback) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);
      const filename = `institute-${uniqueSuffix}${ext}`;
      callback(null, filename);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, callback) => {
    const allowedTypes = /jpg|jpeg|png|gif/;
    const extname = allowedTypes.test(file.originalname.toLowerCase().split('.').pop());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return callback(null, true);
    }
    callback(new Error('Only image files (jpg, jpeg, png, gif) are allowed'));
  },
};

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Institute.name, schema: InstituteSchema },
    ]),
    MulterModule.register(multerConfig),
  ],
  controllers: [InstituteController],
  providers: [InstituteService],
  exports: [InstituteService, MongooseModule],
})
export class InstituteModule {}