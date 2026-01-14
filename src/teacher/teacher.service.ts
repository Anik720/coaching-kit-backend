import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ConflictException,
  InternalServerErrorException 
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Teacher, TeacherDocument, TeacherStatus } from './schemas/teacher.schema';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { TeacherResponseDto } from './dto/teacher-response.dto';

@Injectable()
export class TeacherService {
  constructor(
    @InjectModel(Teacher.name) private teacherModel: Model<TeacherDocument>,
  ) {}

  private mapToResponseDto(teacher: TeacherDocument | any): TeacherResponseDto {
    try {
      const createdByUser = (teacher as any).createdByUser as any;
      const updatedByUser = (teacher as any).updatedByUser as any;
      const teacherId = (teacher as any)._id;

      return {
        _id: teacherId?.toString(),
        fullName: teacher.fullName,
        fatherName: teacher.fatherName,
        motherName: teacher.motherName,
        religion: teacher.religion,
        gender: teacher.gender,
        dateOfBirth: teacher.dateOfBirth,
        contactNumber: teacher.contactNumber,
        emergencyContactNumber: teacher.emergencyContactNumber,
        presentAddress: teacher.presentAddress,
        permanentAddress: teacher.permanentAddress,
        whatsappNumber: teacher.whatsappNumber,
        email: teacher.email,
        secondaryEmail: teacher.secondaryEmail,
        nationalId: teacher.nationalId,
        bloodGroup: teacher.bloodGroup,
        profilePicture: teacher.profilePicture,
        systemEmail: teacher.systemEmail,
        isEmailVerified: teacher.isEmailVerified,
        isPhoneVerified: teacher.isPhoneVerified,
        designation: teacher.designation,
        assignType: teacher.assignType,
        monthlyTotalClass: teacher.monthlyTotalClass,
        salary: teacher.salary,
        joiningDate: teacher.joiningDate,
        status: teacher.status,
        isActive: teacher.isActive,
        remarks: teacher.remarks,
        createdBy: createdByUser ? {
          _id: createdByUser._id.toString(),
          email: createdByUser.email,
          username: createdByUser.username,
          role: createdByUser.role,
          name: createdByUser.name
        } : undefined,
        updatedBy: updatedByUser ? {
          _id: updatedByUser._id.toString(),
          email: updatedByUser.email,
          username: updatedByUser.username,
          role: updatedByUser.role,
          name: updatedByUser.name
        } : undefined,
        createdAt: (teacher as any).createdAt,
        updatedAt: (teacher as any).updatedAt
      };
    } catch (error) {
      console.error('Error mapping teacher to response DTO:', error, teacher);
      throw new InternalServerErrorException('Error processing teacher data');
    }
  }

  async create(createTeacherDto: CreateTeacherDto, userId: string): Promise<TeacherResponseDto> {
    try {
      console.log('Creating teacher with data:', {
        fullName: createTeacherDto.fullName,
        email: createTeacherDto.email,
        systemEmail: createTeacherDto.systemEmail,
        nationalId: createTeacherDto.nationalId,
        userId: userId
      });

      // Validate user ID
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }

      // Check if email already exists
      const existingEmail = await this.teacherModel.findOne({ 
        email: createTeacherDto.email.toLowerCase() 
      });
      
      if (existingEmail) {
        console.log('Email already exists:', createTeacherDto.email);
        throw new ConflictException('Email already exists');
      }

      // Check if system email already exists
      const existingSystemEmail = await this.teacherModel.findOne({ 
        systemEmail: createTeacherDto.systemEmail.toLowerCase() 
      });
      
      if (existingSystemEmail) {
        console.log('System email already exists:', createTeacherDto.systemEmail);
        throw new ConflictException('System email already exists');
      }

      // Check if national ID already exists
      if (createTeacherDto.nationalId) {
        const existingNationalId = await this.teacherModel.findOne({ 
          nationalId: createTeacherDto.nationalId 
        });
        
        if (existingNationalId) {
          console.log('National ID already exists:', createTeacherDto.nationalId);
          throw new ConflictException('National ID already exists');
        }
      }

      const teacherData = {
        ...createTeacherDto,
        email: createTeacherDto.email.toLowerCase(),
        systemEmail: createTeacherDto.systemEmail.toLowerCase(),
        dateOfBirth: new Date(createTeacherDto.dateOfBirth),
        joiningDate: new Date(createTeacherDto.joiningDate),
        status: createTeacherDto.status || TeacherStatus.ACTIVE,
        isActive: createTeacherDto.status !== TeacherStatus.INACTIVE,
        isEmailVerified: createTeacherDto.isEmailVerified || false,
        isPhoneVerified: createTeacherDto.isPhoneVerified || false,
        createdBy: new Types.ObjectId(userId)
      };

      const createdTeacher = new this.teacherModel(teacherData);
      
      const savedTeacher = await createdTeacher.save();
      console.log('Teacher created successfully:', savedTeacher.email);
      
      const populatedTeacher = await this.teacherModel
        .findById(savedTeacher._id)
        .populate('createdByUser', 'email username role name')
        .populate('updatedByUser', 'email username role name')
        .exec();

      if (!populatedTeacher) {
        throw new Error('Failed to create teacher');
      }

      return this.mapToResponseDto(populatedTeacher);
    } catch (error: any) {
      console.error('Teacher creation error:', error);
      if (error.code === 11000) {
        const field = error.keyPattern?.email ? 'Email' : 
                     error.keyPattern?.systemEmail ? 'System Email' : 
                     error.keyPattern?.nationalId ? 'National ID' : 'Field';
        throw new ConflictException(`${field} already exists`);
      }
      if (error.name === 'ValidationError') {
        throw new BadRequestException(`Validation failed: ${error.message}`);
      }
      if (error instanceof ConflictException || 
          error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Teacher creation failed');
    }
  }

  async findAll(query: any): Promise<{ 
    teachers: TeacherResponseDto[]; 
    total: number; 
    page: number; 
    limit: number; 
    totalPages: number; 
  }> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        designation,
        assignType,
        status,
        isActive,
        gender,
        religion,
        bloodGroup,
        createdBy
      } = query;

      const filter: any = {};

      if (search) {
        filter.$or = [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { systemEmail: { $regex: search, $options: 'i' } },
          { contactNumber: { $regex: search, $options: 'i' } },
          { whatsappNumber: { $regex: search, $options: 'i' } },
          { nationalId: { $regex: search, $options: 'i' } },
          { fatherName: { $regex: search, $options: 'i' } },
          { motherName: { $regex: search, $options: 'i' } }
        ];
      }

      if (designation) filter.designation = designation;
      if (assignType) filter.assignType = assignType;
      if (status) filter.status = status;
      if (isActive !== undefined) filter.isActive = isActive === 'true';
      if (gender) filter.gender = gender;
      if (religion) filter.religion = religion;
      if (bloodGroup) filter.bloodGroup = bloodGroup;
      if (createdBy && Types.ObjectId.isValid(createdBy)) {
        filter.createdBy = new Types.ObjectId(createdBy);
      }

      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 10;
      const skip = (pageNum - 1) * limitNum;

      const [teachers, total] = await Promise.all([
        this.teacherModel
          .find(filter)
          .populate('createdByUser', 'email username role name')
          .populate('updatedByUser', 'email username role name')
          .skip(skip)
          .limit(limitNum)
          .sort({ createdAt: -1 })
          .exec(),
        this.teacherModel.countDocuments(filter).exec()
      ]);

      return {
        teachers: teachers.map(teacher => this.mapToResponseDto(teacher)),
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      };
    } catch (error) {
      console.error('Find all teachers error:', error);
      throw new InternalServerErrorException('Failed to fetch teachers');
    }
  }

  async findOne(id: string): Promise<TeacherResponseDto> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid teacher ID');
      }

      const teacher = await this.teacherModel
        .findById(id)
        .populate('createdByUser', 'email username role name')
        .populate('updatedByUser', 'email username role name')
        .exec();

      if (!teacher) {
        throw new NotFoundException(`Teacher with ID ${id} not found`);
      }

      return this.mapToResponseDto(teacher);
    } catch (error) {
      console.error('Find one teacher error:', error);
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch teacher');
    }
  }

  async findByEmail(email: string): Promise<TeacherResponseDto> {
    try {
      if (!email || email.trim().length === 0) {
        throw new BadRequestException('Email is required');
      }

      const teacher = await this.teacherModel
        .findOne({ $or: [
          { email: email.trim().toLowerCase() },
          { systemEmail: email.trim().toLowerCase() }
        ]})
        .populate('createdByUser', 'email username role name')
        .populate('updatedByUser', 'email username role name')
        .exec();

      if (!teacher) {
        throw new NotFoundException(`Teacher with email ${email} not found`);
      }

      return this.mapToResponseDto(teacher);
    } catch (error) {
      console.error('Find by email error:', error);
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch teacher by email');
    }
  }

  async update(id: string, updateTeacherDto: UpdateTeacherDto, userId?: string): Promise<TeacherResponseDto> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid teacher ID');
      }

      const updateData: any = { ...updateTeacherDto };
      
      // Lowercase emails if updating
      if (updateData.email) {
        // Check for duplicate email
        const existingEmail = await this.teacherModel.findOne({ 
          email: updateData.email.toLowerCase(),
          _id: { $ne: new Types.ObjectId(id) }
        });
        
        if (existingEmail) {
          throw new ConflictException('Email already exists');
        }
        updateData.email = updateData.email.toLowerCase();
      }

      if (updateData.systemEmail) {
        // Check for duplicate system email
        const existingSystemEmail = await this.teacherModel.findOne({ 
          systemEmail: updateData.systemEmail.toLowerCase(),
          _id: { $ne: new Types.ObjectId(id) }
        });
        
        if (existingSystemEmail) {
          throw new ConflictException('System email already exists');
        }
        updateData.systemEmail = updateData.systemEmail.toLowerCase();
      }

      // Check for duplicate national ID if updating
      if (updateTeacherDto.nationalId) {
        const existingTeacher = await this.teacherModel.findOne({ 
          nationalId: updateTeacherDto.nationalId,
          _id: { $ne: new Types.ObjectId(id) }
        });
        
        if (existingTeacher) {
          throw new ConflictException('National ID already exists');
        }
      }

      // Convert date strings to Date objects
      if (updateData.dateOfBirth) {
        updateData.dateOfBirth = new Date(updateData.dateOfBirth);
      }
      if (updateData.joiningDate) {
        updateData.joiningDate = new Date(updateData.joiningDate);
      }

      // Add updatedBy if userId is provided
      if (userId) {
        if (!Types.ObjectId.isValid(userId)) {
          throw new BadRequestException('Invalid user ID');
        }
        updateData.updatedBy = new Types.ObjectId(userId);
      }

      const teacher = await this.teacherModel
        .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
        .populate('createdByUser', 'email username role name')
        .populate('updatedByUser', 'email username role name')
        .exec();

      if (!teacher) {
        throw new NotFoundException(`Teacher with ID ${id} not found`);
      }

      return this.mapToResponseDto(teacher);
    } catch (error: any) {
      console.error('Update teacher error:', error);
      if (error.code === 11000) {
        const field = error.keyPattern?.email ? 'Email' : 
                     error.keyPattern?.systemEmail ? 'System Email' : 
                     error.keyPattern?.nationalId ? 'National ID' : 'Field';
        throw new ConflictException(`${field} already exists`);
      }
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException ||
          error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update teacher');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid teacher ID');
      }

      const result = await this.teacherModel.findByIdAndDelete(id).exec();
      if (!result) {
        throw new NotFoundException(`Teacher with ID ${id} not found`);
      }
    } catch (error) {
      console.error('Delete teacher error:', error);
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete teacher');
    }
  }

  async updateStatus(id: string, status: TeacherStatus, isActive: boolean, userId?: string): Promise<TeacherResponseDto> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid teacher ID');
      }

      const updateData: any = { status, isActive };
      
      // Add updatedBy if userId is provided
      if (userId) {
        if (!Types.ObjectId.isValid(userId)) {
          throw new BadRequestException('Invalid user ID');
        }
        updateData.updatedBy = new Types.ObjectId(userId);
      }

      const teacher = await this.teacherModel
        .findByIdAndUpdate(
          id,
          updateData,
          { new: true }
        )
        .populate('createdByUser', 'email username role name')
        .populate('updatedByUser', 'email username role name')
        .exec();

      if (!teacher) {
        throw new NotFoundException(`Teacher with ID ${id} not found`);
      }

      return this.mapToResponseDto(teacher);
    } catch (error) {
      console.error('Update teacher status error:', error);
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update teacher status');
    }
  }

  async verifyEmail(id: string, userId?: string): Promise<TeacherResponseDto> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid teacher ID');
      }

      const updateData: any = { isEmailVerified: true };
      
      if (userId) {
        if (!Types.ObjectId.isValid(userId)) {
          throw new BadRequestException('Invalid user ID');
        }
        updateData.updatedBy = new Types.ObjectId(userId);
      }

      const teacher = await this.teacherModel
        .findByIdAndUpdate(
          id,
          updateData,
          { new: true }
        )
        .populate('createdByUser', 'email username role name')
        .populate('updatedByUser', 'email username role name')
        .exec();

      if (!teacher) {
        throw new NotFoundException(`Teacher with ID ${id} not found`);
      }

      return this.mapToResponseDto(teacher);
    } catch (error) {
      console.error('Verify email error:', error);
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to verify teacher email');
    }
  }

  async verifyPhone(id: string, userId?: string): Promise<TeacherResponseDto> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid teacher ID');
      }

      const updateData: any = { isPhoneVerified: true };
      
      if (userId) {
        if (!Types.ObjectId.isValid(userId)) {
          throw new BadRequestException('Invalid user ID');
        }
        updateData.updatedBy = new Types.ObjectId(userId);
      }

      const teacher = await this.teacherModel
        .findByIdAndUpdate(
          id,
          updateData,
          { new: true }
        )
        .populate('createdByUser', 'email username role name')
        .populate('updatedByUser', 'email username role name')
        .exec();

      if (!teacher) {
        throw new NotFoundException(`Teacher with ID ${id} not found`);
      }

      return this.mapToResponseDto(teacher);
    } catch (error) {
      console.error('Verify phone error:', error);
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to verify teacher phone');
    }
  }

  async changePassword(id: string, newPassword: string, userId?: string): Promise<TeacherResponseDto> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid teacher ID');
      }

      if (!newPassword || newPassword.length < 6) {
        throw new BadRequestException('Password must be at least 6 characters long');
      }

      const updateData: any = { password: newPassword };
      
      if (userId) {
        if (!Types.ObjectId.isValid(userId)) {
          throw new BadRequestException('Invalid user ID');
        }
        updateData.updatedBy = new Types.ObjectId(userId);
      }

      const teacher = await this.teacherModel
        .findByIdAndUpdate(
          id,
          updateData,
          { new: true }
        )
        .populate('createdByUser', 'email username role name')
        .populate('updatedByUser', 'email username role name')
        .exec();

      if (!teacher) {
        throw new NotFoundException(`Teacher with ID ${id} not found`);
      }

      return this.mapToResponseDto(teacher);
    } catch (error) {
      console.error('Change password error:', error);
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to change teacher password');
    }
  }

  async getStatistics(userId?: string): Promise<any> {
    try {
      const query: any = {};
      if (userId && Types.ObjectId.isValid(userId)) {
        query.createdBy = new Types.ObjectId(userId);
      }

      const [
        totalTeachers,
        activeTeachers,
        verifiedEmail,
        verifiedPhone,
        byDesignation,
        byAssignType,
        byStatus,
        byGender,
        byReligion,
        byBloodGroup
      ] = await Promise.all([
        this.teacherModel.countDocuments(query),
        this.teacherModel.countDocuments({ ...query, isActive: true }),
        this.teacherModel.countDocuments({ ...query, isEmailVerified: true }),
        this.teacherModel.countDocuments({ ...query, isPhoneVerified: true }),
        this.teacherModel.aggregate([
          { $match: query },
          { $group: { _id: '$designation', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        this.teacherModel.aggregate([
          { $match: query },
          { $group: { _id: '$assignType', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        this.teacherModel.aggregate([
          { $match: query },
          { $group: { _id: '$status', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        this.teacherModel.aggregate([
          { $match: query },
          { $group: { _id: '$gender', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        this.teacherModel.aggregate([
          { $match: query },
          { $group: { _id: '$religion', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        this.teacherModel.aggregate([
          { $match: query },
          { $group: { _id: '$bloodGroup', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
      ]);

      const recentTeachers = await this.teacherModel
        .find(query)
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('createdByUser', 'email username role name')
        .exec();

      return {
        totalTeachers,
        activeTeachers,
        inactiveTeachers: totalTeachers - activeTeachers,
        verifiedEmail,
        verifiedPhone,
        byDesignation,
        byAssignType,
        byStatus,
        byGender,
        byReligion,
        byBloodGroup,
        recentTeachers: recentTeachers.map(teacher => this.mapToResponseDto(teacher))
      };
    } catch (error) {
      console.error('Get statistics error:', error);
      throw new InternalServerErrorException('Failed to get teacher statistics');
    }
  }

  async getMyTeachers(userId: string, filters?: any, pagination?: any) {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }

      const query: any = { createdBy: new Types.ObjectId(userId) };
      
      if (filters?.status) {
        query.status = filters.status;
      }
      if (filters?.isActive !== undefined) {
        query.isActive = filters.isActive;
      }
      if (filters?.designation) {
        query.designation = filters.designation;
      }
      if (filters?.assignType) {
        query.assignType = filters.assignType;
      }
      if (filters?.gender) {
        query.gender = filters.gender;
      }
      if (filters?.religion) {
        query.religion = filters.religion;
      }
      if (filters?.bloodGroup) {
        query.bloodGroup = filters.bloodGroup;
      }
      if (filters?.search) {
        query.$or = [
          { fullName: { $regex: filters.search, $options: 'i' } },
          { email: { $regex: filters.search, $options: 'i' } },
          { systemEmail: { $regex: filters.search, $options: 'i' } },
          { contactNumber: { $regex: filters.search, $options: 'i' } },
          { whatsappNumber: { $regex: filters.search, $options: 'i' } },
          { nationalId: { $regex: filters.search, $options: 'i' } },
          { fatherName: { $regex: filters.search, $options: 'i' } },
          { motherName: { $regex: filters.search, $options: 'i' } }
        ];
      }

      const { page = 1, limit = 10 } = pagination || {};
      const skip = (page - 1) * limit;

      const [teachers, total] = await Promise.all([
        this.teacherModel
          .find(query)
          .populate('createdByUser', 'email username role name')
          .populate('updatedByUser', 'email username role name')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.teacherModel.countDocuments(query).exec()
      ]);

      return {
        teachers: teachers.map(teacher => this.mapToResponseDto(teacher)),
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('Get my teachers error:', error);
      throw new InternalServerErrorException('Failed to fetch user teachers');
    }
  }

  async countTeachersByUser(userId: string): Promise<number> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }
      
      return this.teacherModel.countDocuments({ 
        createdBy: new Types.ObjectId(userId) 
      }).exec();
    } catch (error) {
      console.error('Count teachers by user error:', error);
      throw new InternalServerErrorException('Failed to count user teachers');
    }
  }

  async countActiveTeachersByUser(userId: string): Promise<number> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }
      
      return this.teacherModel.countDocuments({ 
        createdBy: new Types.ObjectId(userId),
        isActive: true 
      }).exec();
    } catch (error) {
      console.error('Count active teachers by user error:', error);
      throw new InternalServerErrorException('Failed to count active user teachers');
    }
  }
}