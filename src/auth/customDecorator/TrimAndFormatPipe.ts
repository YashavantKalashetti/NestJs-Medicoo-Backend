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
    } else if (typeof value === 'object' && value !== null) {
      const trimmedObject = {};
      for (const key in value) {
        if (value.hasOwnProperty(key)) {
          trimmedObject[key] = this.transform(value[key]);
        }
      }
      return trimmedObject;
    }
    return value;
  }
}
