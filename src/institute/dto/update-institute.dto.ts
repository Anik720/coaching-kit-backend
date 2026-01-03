import { PartialType } from '@nestjs/mapped-types';
import { CreateInstituteDto } from './create-institute.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsOptional, 
  IsString, 
  IsEmail, 
  IsBoolean,
  IsDateString,
  MinLength,
  MaxLength,
  Matches
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateInstituteDto extends PartialType(CreateInstituteDto) {
  @ApiPropertyOptional({ 
    example: 'Updated Institute Name', 
    description: 'Updated name of the institute' 
  })
  @IsString()
  @IsOptional()
  @MinLength(2, { message: 'Institute name must be at least 2 characters' })
  @MaxLength(200, { message: 'Institute name cannot exceed 200 characters' })
  @Transform(({ value }) => value?.trim())
  instituteName?: string;

  @ApiPropertyOptional({ 
    example: 'Updated Address', 
    description: 'Updated address of the institute' 
  })
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Address cannot exceed 500 characters' })
  @Transform(({ value }) => value?.trim())
  address?: string;

  @ApiPropertyOptional({ 
    example: '01812345678', 
    description: 'Updated phone number' 
  })
  @IsString()
  @IsOptional()
  @Matches(/^[0-9]{10,15}$/, { 
    message: 'Phone number must be 10-15 digits' 
  })
  @Transform(({ value }) => value?.trim())
  phone?: string;

  @ApiPropertyOptional({ 
    example: 'updated@example.com', 
    description: 'Updated email address' 
  })
  @IsString()
  @IsOptional()
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email?: string;

  @ApiPropertyOptional({ 
    example: 'new-logo.jpg', 
    description: 'Updated profile picture filename' 
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  profilePicture?: string;

  @ApiPropertyOptional({ 
    example: 'https://example.com/new-logo.jpg', 
    description: 'Updated profile picture URL' 
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  profilePictureUrl?: string;

  @ApiPropertyOptional({ 
    example: false, 
    description: 'Updated active status' 
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  isActive?: boolean;

  @ApiPropertyOptional({ 
    example: 'Updated description...', 
    description: 'Updated description' 
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000, { message: 'Description cannot exceed 1000 characters' })
  @Transform(({ value }) => value?.trim())
  description?: string;

  @ApiPropertyOptional({ 
    example: '2015-01-01', 
    description: 'Updated establishment date' 
  })
  @IsDateString()
  @IsOptional()
  establishmentDate?: string;

  @ApiPropertyOptional({ 
    example: 'New Principal Name', 
    description: 'Updated principal name' 
  })
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Principal name cannot exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  principalName?: string;
}