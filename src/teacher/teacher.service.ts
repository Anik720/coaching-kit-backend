// teacher/teacher.service.ts
import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ConflictException,
  InternalServerErrorException 
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Teacher, TeacherDocument } from './schemas/teacher.schema';
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
      console.log('Creating teacher with email:', createTeacherDto.email);

      // Validate user ID
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }

      // Check if email already exists
      const existingTeacher = await this.teacherModel.findOne({ 
        email: createTeacherDto.email.toLowerCase() 
      });
      
      if (existingTeacher) {
        console.log('Email already exists:', createTeacherDto.email);
        throw new ConflictException('Email already exists');
      }

      // Check if national ID already exists (if provided)
      if (createTeacherDto.nationalId) {
        const existingWithNationalId = await this.teacherModel.findOne({ 
          nationalId: createTeacherDto.nationalId 
        });
        
        if (existingWithNationalId) {
          console.log('National ID already exists:', createTeacherDto.nationalId);
          throw new ConflictException('National ID already exists');
        }
      }

      const createdTeacher = new this.teacherModel({
        ...createTeacherDto,
        email: createTeacherDto.email.toLowerCase(),
        createdBy: new Types.ObjectId(userId)
      });
      
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
        const field = error.keyPattern?.email ? 'Email' : 'National ID';
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

  async findAll(query: any): Promise<TeacherResponseDto[]> {
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
        createdBy
      } = query;

      const filter: any = {};

      if (search) {
        filter.$or = [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { contactNumber: { $regex: search, $options: 'i' } },
          { nationalId: { $regex: search, $options: 'i' } }
        ];
      }

      if (designation) filter.designation = designation;
      if (assignType) filter.assignType = assignType;
      if (status) filter.status = status;
      if (isActive !== undefined) filter.isActive = isActive === 'true';
      if (gender) filter.gender = gender;
      if (religion) filter.religion = religion;
      if (createdBy && Types.ObjectId.isValid(createdBy)) {
        filter.createdBy = new Types.ObjectId(createdBy);
      }

      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 10;

      const teachers = await this.teacherModel
        .find(filter)
        .populate('createdByUser', 'email username role name')
        .populate('updatedByUser', 'email username role name')
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .sort({ createdAt: -1 })
        .exec();

      return teachers.map(teacher => this.mapToResponseDto(teacher));
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
        .findOne({ email: email.trim().toLowerCase() })
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

      // Check for duplicate email if updating
      if (updateTeacherDto.email) {
        const existingTeacher = await this.teacherModel.findOne({ 
          email: updateTeacherDto.email.toLowerCase(),
          _id: { $ne: new Types.ObjectId(id) }
        });
        
        if (existingTeacher) {
          throw new ConflictException('Email already exists');
        }
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

      const updateData: any = { ...updateTeacherDto };
      
      // Lowercase email if updating
      if (updateData.email) {
        updateData.email = updateData.email.toLowerCase();
      }
      
      // Add updatedBy if userId is provided
      if (userId) {
        if (!Types.ObjectId.isValid(userId)) {
          throw new BadRequestException('Invalid user ID');
        }
        updateData.updatedBy = new Types.ObjectId(userId);
      }

      const teacher = await this.teacherModel
        .findByIdAndUpdate(id, updateData, { new: true })
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
        const field = error.keyPattern?.email ? 'Email' : 'National ID';
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

  async updateStatus(id: string, status: string, isActive: boolean, userId?: string): Promise<TeacherResponseDto> {
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

      const [totalTeachers, activeTeachers, verifiedEmail, verifiedPhone, byDesignation, byAssignType] = await Promise.all([
        this.teacherModel.countDocuments(query),
        this.teacherModel.countDocuments({ ...query, isActive: true }),
        this.teacherModel.countDocuments({ ...query, isEmailVerified: true }),
        this.teacherModel.countDocuments({ ...query, isPhoneVerified: true }),
        this.teacherModel.aggregate([
          { $match: query },
          { $group: { _id: '$designation', count: { $sum: 1 } } }
        ]),
        this.teacherModel.aggregate([
          { $match: query },
          { $group: { _id: '$assignType', count: { $sum: 1 } } }
        ]),
      ]);

      const genderDistribution = await this.teacherModel.aggregate([
        { $match: query },
        { $group: { _id: '$gender', count: { $sum: 1 } } }
      ]);

      return {
        totalTeachers,
        activeTeachers,
        inactiveTeachers: totalTeachers - activeTeachers,
        verifiedEmail,
        verifiedPhone,
        byDesignation,
        byAssignType,
        genderDistribution
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
      if (filters?.search) {
        query.$or = [
          { fullName: { $regex: filters.search, $options: 'i' } },
          { email: { $regex: filters.search, $options: 'i' } },
          { contactNumber: { $regex: filters.search, $options: 'i' } },
          { nationalId: { $regex: filters.search, $options: 'i' } }
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