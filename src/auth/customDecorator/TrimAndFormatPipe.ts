import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class TrimAndFormatPipe implements PipeTransform {
  transform(value: any): any {
    if (typeof value === 'string') {
      return value.trim();
    } else if (typeof value === 'number') {
      return Number(value.toString().trim());
    } else if (Array.isArray(value)) {
      return value.map((item) => this.transform(item));
    }
    
    return value;
  }
}
