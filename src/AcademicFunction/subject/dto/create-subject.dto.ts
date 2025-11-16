import { IsNotEmpty, IsString } from 'class-validator';

// Note: 'Trim' isn't a standard decorator; if you want trimming, add a transform in pipe or use class-transformer
import { Transform } from 'class-transformer';

export class CreateSubjectDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  subjectName: string;
}
