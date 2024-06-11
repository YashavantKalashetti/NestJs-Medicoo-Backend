import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class TrimAndFormatPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (typeof value === 'string') {
      value = value.trim();
    }
    
    if (typeof value === 'number') {
      value = Number(value);
    }

    // You can add more formatting logic here if needed

    return value;
  }
}
