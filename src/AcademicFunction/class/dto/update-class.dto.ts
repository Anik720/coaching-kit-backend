import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, IsBoolean } from 'class-validator';

export class UpdateClassDto {
  @ApiProperty({ 
    example: 'Class 10 Updated', 
    description: 'Updated name of the class',
    required: false 
  })
  @IsString()
  @IsOptional()
  @MinLength(2)
  classname?: string;

  @ApiProperty({ 
    example: 'Updated tenth standard class', 
    description: 'Updated description',
    required: false 
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ 
    example: false, 
    description: 'Updated active status',
    required: false 
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}