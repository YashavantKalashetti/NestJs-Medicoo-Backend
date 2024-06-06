import { Global, Injectable } from '@nestjs/common';
import * as cloudinary from 'cloudinary';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';

@Global()
@Injectable()
export class CloudinaryService {
  constructor(private readonly configService: ConfigService) {}

  async uploadImage(filePath: string): Promise<cloudinary.UploadApiResponse> {

    cloudinary.v2.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });

    return new Promise((resolve, reject) => {
      
      const uploadStream = cloudinary.v2.uploader.upload_stream({}, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });

      const readStream = fs.createReadStream(filePath);
      readStream.pipe(uploadStream);

      readStream.on('end', () => {
        fs.unlink(filePath, (err) => {
          if (err) {
            try {
              fs.unlinkSync(filePath);
            } catch (error) {
              console.error('Error deleting file:', error);
              return;
            }
          } else {
            console.log('File deleted successfully');
          }
        });
      });
      
    });

  }
}
