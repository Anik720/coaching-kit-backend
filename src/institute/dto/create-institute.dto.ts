import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsNotEmpty, 
  IsEmail, 
  IsOptional, 
  IsBoolean, 
  IsDateString,
  MinLength,
  MaxLength,
  Matches
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateInstituteDto {
  @ApiProperty({ 
    example: 'Fahim Academy', 
    description: 'Name of the institute' 
  })
  @IsString()
  @IsNotEmpty({ message: 'Institute name is required' })
  @MinLength(2, { message: 'Institute name must be at least 2 characters' })
  @MaxLength(200, { message: 'Institute name cannot exceed 200 characters' })
  @Transform(({ value }) => value?.trim())
  instituteName: string;

  @ApiProperty({ 
    example: 'Gulkibari Kazi Office Road, Mymensingh', 
    description: 'Address of the institute' 
  })
  @IsString()
  @IsNotEmpty({ message: 'Address is required' })
  @MaxLength(500, { message: 'Address cannot exceed 500 characters' })
  @Transform(({ value }) => value?.trim())
  address: string;

  @ApiProperty({ 
    example: '0170388696', 
    description: 'Phone number of the institute' 
  })
  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^[0-9]{10,15}$/, { 
    message: 'Phone number must be 10-15 digits' 
  })
  @Transform(({ value }) => value?.trim())
  phone: string;

  @ApiProperty({ 
    example: 'fahimacademy10@gmail.com', 
    description: 'Email of the institute' 
  })
  @IsString()
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiPropertyOptional({ 
    example: 'institute-logo.jpg', 
    description: 'Institute profile picture filename' 
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  profilePicture?: string;

  @ApiPropertyOptional({ 
    example: 'https://example.com/logo.jpg', 
    description: 'Profile picture URL' 
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  profilePictureUrl?: string;

  @ApiPropertyOptional({ 
    example: true, 
    description: 'Active status of the institute',
    default: true 
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  isActive?: boolean = true;

  @ApiPropertyOptional({ 
    example: 'A leading educational institution...', 
    description: 'Description of the institute' 
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000, { message: 'Description cannot exceed 1000 characters' })
  @Transform(({ value }) => value?.trim())
  description?: string;

  @ApiPropertyOptional({ 
    example: '2010-01-01', 
    description: 'Establishment date of the institute' 
  })
  @IsDateString()
  @IsOptional()
  establishmentDate?: string;

  @ApiPropertyOptional({ 
    example: 'Fahim Ahmed', 
    description: 'Name of the principal/head' 
  })
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Principal name cannot exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  principalName?: string;
}