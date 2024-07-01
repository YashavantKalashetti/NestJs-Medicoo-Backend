import { Global, Injectable } from '@nestjs/common';
import * as cloudinary from 'cloudinary';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';

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

      const fullPathArray = filePath.split('\\');
      const fileWithNumbers = fullPathArray.pop();
      const fileName = fileWithNumbers.split('#_#').pop().split('.')[0];
      
      const uploadStream = cloudinary.v2.uploader.upload_stream({ public_id: fileName }, (error, result) => {
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
            console.error('Error deleting file:', err);
          } else {
            console.log('File deleted successfully');
          }
        });
      });
    });
  }
}
