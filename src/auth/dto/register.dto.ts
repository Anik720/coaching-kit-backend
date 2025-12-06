import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsEmail, 
  IsNotEmpty, 
  IsString, 
  MinLength, 
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  IsDateString
} from 'class-validator';
import { UserRole } from '../../shared/interfaces/user.interface';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'User password (min 6 characters)',
    minLength: 6,
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiPropertyOptional({
    enum: UserRole,
    example: UserRole.STAFF,
    description: 'User role',
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Invalid role' })
  role?: UserRole;

  @ApiPropertyOptional({
    example: 'Software Developer',
    description: 'Job designation',
  })
  @IsOptional()
  @IsString({ message: 'Designation must be a string' })
  designation?: string;

  @ApiPropertyOptional({
    example: 50000,
    description: 'Salary amount',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Salary must be a number' })
  @Min(0, { message: 'Salary cannot be negative' })
  salary?: number;

  @ApiPropertyOptional({
    example: '2023-12-06',
    description: 'Joining date in ISO format',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Please provide a valid date' })
  joiningDate?: string;

  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Advertisement name',
  })
  @IsOptional()
  @IsString({ message: 'Ad name must be a string' })
  adName?: string;

  @ApiPropertyOptional({
    example: 'johndoe',
    description: 'Username',
  })
  @IsOptional()
  @IsString({ message: 'Username must be a string' })
  username?: string;

  @ApiPropertyOptional({
    example: '123 Main St',
    description: 'Address',
  })
  @IsOptional()
  @IsString({ message: 'Address must be a string' })
  address?: string;

  // Add other optional fields as needed...
}