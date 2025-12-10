import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, IsOptional, IsBoolean } from 'class-validator';

export class CreateClassDto {
  @ApiProperty({ example: 'Class 10', description: 'Name of the class' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  classname: string;

  @ApiProperty({ 
    example: 'Tenth standard class', 
    description: 'Description of the class',
    required: false 
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ 
    example: true, 
    description: 'Active status of the class',
    required: false 
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}