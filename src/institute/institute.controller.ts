import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  UseGuards,
  UseFilters,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { InstituteService } from './institute.service';
import { CreateInstituteDto } from './dto/create-institute.dto';
import { UpdateInstituteDto } from './dto/update-institute.dto';
import { 
  InstituteResponseDto, 
  InstituteListResponseDto 
} from './dto/institute-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../shared/interfaces/user.interface';
import { AuthExceptionFilter } from '../shared/filters/auth-exception.filter';
import { diskStorage } from 'multer';
import { extname } from 'path';

// Configure file storage for profile pictures
const storage = diskStorage({
  destination: './uploads/institutes',
  filename: (req, file, callback) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    const filename = `institute-${uniqueSuffix}${ext}`;
    callback(null, filename);
  },
});

@ApiTags('institutes')
@ApiBearerAuth('JWT-auth')
@Controller('institutes')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseFilters(AuthExceptionFilter)
export class InstituteController {
  constructor(private readonly instituteService: InstituteService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN)
  @ApiOperation({ summary: 'Create a new institute' })
  @ApiBody({ type: CreateInstituteDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Institute created successfully',
    type: InstituteResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
    schema: {
      example: {
        statusCode: 400,
        message: ['instituteName must be at least 2 characters'],
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Institute already exists',
    schema: {
      example: {
        statusCode: 409,
        message: 'Institute with this name already exists',
        error: 'Conflict',
      },
    },
  })
  async create(@Body() createInstituteDto: CreateInstituteDto): Promise<InstituteResponseDto> {
    const institute = await this.instituteService.create(createInstituteDto);
    return this.serializeInstitute(institute);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get all institutes with filtering and pagination' })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by name, email, phone, address, or principal name',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (starts from 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
    example: 10,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Field to sort by',
    example: 'createdAt',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order',
    example: 'desc',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of institutes',
    type: InstituteListResponseDto,
  })
  async findAll(
    @Query('search') search?: string,
    @Query('isActive') isActive?: boolean,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ): Promise<InstituteListResponseDto> {
    const query = {
      search,
      isActive,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc',
    };

    const result = await this.instituteService.findAll(query);
    
    return {
      data: result.data.map(institute => this.serializeInstitute(institute)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  @Get('active')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get all active institutes' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of active institutes',
    type: [InstituteResponseDto],
  })
  async findActive(): Promise<InstituteResponseDto[]> {
    const institutes = await this.instituteService.findActiveInstitutes();
    return institutes.map(institute => this.serializeInstitute(institute));
  }

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN)
  @ApiOperation({ summary: 'Get institute statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Institute statistics',
    schema: {
      example: {
        totalInstitutes: 15,
        activeInstitutes: 12,
        totalPhoneContacts: 15,
        latestEstablishment: '2023-01-01T00:00:00.000Z',
        oldestEstablishment: '2010-01-01T00:00:00.000Z',
      },
    },
  })
  async getStats() {
    return await this.instituteService.getStats();
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get an institute by ID' })
  @ApiParam({
    name: 'id',
    description: 'Institute ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Institute details',
    type: InstituteResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Institute not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Institute not found',
        error: 'Not Found',
      },
    },
  })
  async findOne(@Param('id') id: string): Promise<InstituteResponseDto> {
    const institute = await this.instituteService.findOne(id);
    return this.serializeInstitute(institute);
  }

  @Get('email/:email')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN)
  @ApiOperation({ summary: 'Get an institute by email' })
  @ApiParam({
    name: 'email',
    description: 'Institute email',
    example: 'fahimacademy10@gmail.com',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Institute details',
    type: InstituteResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Institute not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Institute not found',
        error: 'Not Found',
      },
    },
  })
  async findByEmail(@Param('email') email: string): Promise<InstituteResponseDto> {
    const institute = await this.instituteService.findByEmail(email);
    if (!institute) {
      throw new NotFoundException('Institute not found');
    }
    return this.serializeInstitute(institute);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN)
  @ApiOperation({ summary: 'Update an institute' })
  @ApiParam({
    name: 'id',
    description: 'Institute ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({ type: UpdateInstituteDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Institute updated successfully',
    type: InstituteResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Institute not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Institute not found',
        error: 'Not Found',
      },
    },
  })
  async update(
    @Param('id') id: string,
    @Body() updateInstituteDto: UpdateInstituteDto,
  ): Promise<InstituteResponseDto> {
    const institute = await this.instituteService.update(id, updateInstituteDto);
    return this.serializeInstitute(institute);
  }

  @Put(':id/toggle-active')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN)
  @ApiOperation({ summary: 'Toggle institute active status' })
  @ApiParam({
    name: 'id',
    description: 'Institute ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Institute status toggled successfully',
    type: InstituteResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Institute not found',
  })
  async toggleActive(@Param('id') id: string): Promise<InstituteResponseDto> {
    const institute = await this.instituteService.toggleActive(id);
    return this.serializeInstitute(institute);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an institute' })
  @ApiParam({
    name: 'id',
    description: 'Institute ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Institute deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Institute not found',
  })
  async remove(@Param('id') id: string): Promise<void> {
    await this.instituteService.remove(id);
  }

  @Post(':id/upload-picture')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN)
  @ApiOperation({ summary: 'Upload institute profile picture' })
  @ApiParam({
    name: 'id',
    description: 'Institute ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Profile picture file',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', { storage }))
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile picture uploaded successfully',
    type: InstituteResponseDto,
  })
  async uploadProfilePicture(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<InstituteResponseDto> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Generate URL for the uploaded file
    const fileUrl = `/uploads/institutes/${file.filename}`;
    
    const institute = await this.instituteService.updateProfilePicture(
      id, 
      file.filename, 
      fileUrl
    );
    
    return this.serializeInstitute(institute);
  }

  @Get('search/quick')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Quick search institutes by various criteria' })
  @ApiQuery({
    name: 'name',
    required: false,
    type: String,
    description: 'Search by institute name',
  })
  @ApiQuery({
    name: 'email',
    required: false,
    type: String,
    description: 'Search by email',
  })
  @ApiQuery({
    name: 'phone',
    required: false,
    type: String,
    description: 'Search by phone',
  })
  @ApiQuery({
    name: 'address',
    required: false,
    type: String,
    description: 'Search by address',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Search results',
    type: [InstituteResponseDto],
  })
  async search(
    @Query('name') name?: string,
    @Query('email') email?: string,
    @Query('phone') phone?: string,
    @Query('address') address?: string,
  ): Promise<InstituteResponseDto[]> {
    const criteria = { name, email, phone, address };
    const institutes = await this.instituteService.searchInstitutes(criteria);
    return institutes.map(institute => this.serializeInstitute(institute));
  }

  /**
   * Serialize Mongoose document to InstituteResponseDto
   */
  private serializeInstitute(institute: any): InstituteResponseDto {
    const plainInstitute = institute.toObject ? institute.toObject() : institute;
    
            // Generate full profile picture path if exists
        let profilePicturePath: string | null = null;
        if (plainInstitute.profilePicture) {
        profilePicturePath = `/uploads/institutes/${plainInstitute.profilePicture}`;
        }

    return {
      _id: plainInstitute._id.toString(),
      instituteName: plainInstitute.instituteName,
      address: plainInstitute.address,
      phone: plainInstitute.phone,
      email: plainInstitute.email,
      profilePicture: plainInstitute.profilePicture || undefined,
      profilePictureUrl: plainInstitute.profilePictureUrl || undefined,
      isActive: plainInstitute.isActive,
      description: plainInstitute.description || undefined,
      establishmentDate: plainInstitute.establishmentDate || undefined,
      principalName: plainInstitute.principalName || undefined,
      createdAt: plainInstitute.createdAt,
      updatedAt: plainInstitute.updatedAt,
      profilePicturePath: profilePicturePath || undefined,
    };
  }
}