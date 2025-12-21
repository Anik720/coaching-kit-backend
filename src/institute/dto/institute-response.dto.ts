import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InstituteResponseDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'Institute ID' })
  _id: string;

  @ApiProperty({ example: 'Fahim Academy', description: 'Institute name' })
  instituteName: string;

  @ApiProperty({ example: 'Gulkibari Kazi Office Road, Mymensingh', description: 'Address' })
  address: string;

  @ApiProperty({ example: '0170388696', description: 'Phone number' })
  phone: string;

  @ApiProperty({ example: 'fahimacademy10@gmail.com', description: 'Email' })
  email: string;

  @ApiPropertyOptional({ example: 'institute-logo.jpg', description: 'Profile picture filename' })
  profilePicture?: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.jpg', description: 'Profile picture URL' })
  profilePictureUrl?: string;

  @ApiProperty({ example: true, description: 'Active status' })
  isActive: boolean;

  @ApiPropertyOptional({ example: 'A leading educational institution...', description: 'Description' })
  description?: string;

  @ApiPropertyOptional({ example: '2010-01-01T00:00:00.000Z', description: 'Establishment date' })
  establishmentDate?: Date;

  @ApiPropertyOptional({ example: 'Fahim Ahmed', description: 'Principal name' })
  principalName?: string;

  @ApiProperty({ example: '2023-12-06T10:30:00.000Z', description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2023-12-06T10:30:00.000Z', description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiPropertyOptional({ example: '/uploads/institute-logo.jpg', description: 'Full profile picture path' })
  profilePicturePath?: string;
}

export class InstituteListResponseDto {
  @ApiProperty({ type: [InstituteResponseDto] })
  data: InstituteResponseDto[];

  @ApiProperty({ example: 1, description: 'Total number of institutes' })
  total: number;

  @ApiProperty({ example: 1, description: 'Current page number' })
  page: number;

  @ApiProperty({ example: 10, description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ example: 1, description: 'Total number of pages' })
  totalPages: number;
}