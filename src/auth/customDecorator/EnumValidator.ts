// validate-enum.pipe.ts
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class ValidateEnumPipe implements PipeTransform {
  constructor(private readonly enumType: any) {}

  transform(value: any, metadata: ArgumentMetadata) {
    // console.log('metadata', metadata);
    if (value == undefined || value == '') {
      return undefined;
    }

    const enumValues = Object.values(this.enumType);
    if (!enumValues.includes(value)) {
      throw new BadRequestException(`Invalid value '${value}' for enum '${metadata.data}'.`);
    }
    return value;
  }
}
