import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ConflictException 
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Subject, SubjectDocument } from './subject.schema';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

@Injectable()
export class SubjectService {
  constructor(
    @InjectModel(Subject.name) private subjectModel: Model<SubjectDocument>,
  ) {}

  async create(dto: CreateSubjectDto, userId: string) {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }

      // Check for duplicate subject name (case-insensitive)
      const existingSubject = await this.subjectModel
        .findOne({ subjectName: { $regex: new RegExp(`^${dto.subjectName}$`, 'i') } })
        .exec();

      if (existingSubject) {
        throw new ConflictException('Subject with this name already exists');
      }

      const userObjectId = new Types.ObjectId(userId);
      const newSubject = new this.subjectModel({
        ...dto,
        createdBy: userObjectId
      });
      
      const savedSubject = await newSubject.save();
      
      // Populate createdBy field
      await savedSubject.populate('createdBy', 'email username role');
      
      return savedSubject;
    } catch (err) {
      if (err instanceof ConflictException || err instanceof BadRequestException) {
        throw err;
      }
      if (err?.code === 11000) {
        throw new ConflictException('Subject with this name already exists');
      }
      throw err;
    }
  }

  async findAll({ 
    page = 1, 
    limit = 20, 
    search, 
    isActive 
  }: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    isActive?: boolean;
  } = {}) {
    const filter: any = {};
    
    if (search) {
      filter.subjectName = { $regex: search, $options: 'i' };
    }
    
    if (isActive !== undefined) {
      filter.isActive = isActive === true;
    }
    
    const skip = (page - 1) * limit;
    const docs = await this.subjectModel
      .find(filter)
      .populate('createdBy', 'email username role')
      .populate('updatedBy', 'email username role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
    const total = await this.subjectModel.countDocuments(filter).exec();
    
    return { 
      data: docs, 
      meta: { 
        total, 
        page: Number(page), 
        limit: Number(limit),
        totalPages: Math.ceil(total / limit)
      } 
    };
  }

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid subject ID');
    }

    const result = await this.subjectModel
      .findById(id)
      .populate('createdBy', 'email username role')
      .populate('updatedBy', 'email username role')
      .exec();
    
    if (!result) throw new NotFoundException('Subject not found');
    return result;
  }

  async update(id: string, dto: UpdateSubjectDto, userId?: string) {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid subject ID');
      }

      // Check for duplicate subject name if updating subjectName
      if (dto.subjectName) {
        const existingSubject = await this.subjectModel
          .findOne({ 
            subjectName: { $regex: new RegExp(`^${dto.subjectName}$`, 'i') },
            _id: { $ne: id }
          })
          .exec();

        if (existingSubject) {
          throw new ConflictException('Subject with this name already exists');
        }
      }

      const updateData: any = { ...dto };
      if (userId) {
        if (!Types.ObjectId.isValid(userId)) {
          throw new BadRequestException('Invalid user ID');
        }
        updateData.updatedBy = new Types.ObjectId(userId);
      }

      const updated = await this.subjectModel
        .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
        .populate('createdBy', 'email username role')
        .populate('updatedBy', 'email username role')
        .exec();
        
      if (!updated) throw new NotFoundException('Subject not found');
      
      return updated;
    } catch (err) {
      if (err instanceof NotFoundException || 
          err instanceof ConflictException || 
          err instanceof BadRequestException) {
        throw err;
      }
      if (err?.code === 11000) {
        throw new ConflictException('Subject with this name already exists');
      }
      throw err;
    }
  }

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid subject ID');
    }

    const deleted = await this.subjectModel
      .findByIdAndDelete(id)
      .populate('createdBy', 'email username role')
      .exec();
    
    if (!deleted) throw new NotFoundException('Subject not found');
    
    return { 
      message: 'Subject deleted successfully',
      deletedSubject: deleted
    };
  }

  async findByName(name: string) {
    return this.subjectModel
      .findOne({ subjectName: name })
      .collation({ locale: 'en', strength: 2 })
      .populate('createdBy', 'email username role')
      .exec();
  }

  async findActive() {
    return this.subjectModel
      .find({ isActive: true })
      .populate('createdBy', 'email username role')
      .populate('updatedBy', 'email username role')
      .sort({ subjectName: 1 })
      .exec();
  }

  async toggleActive(id: string, userId: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid subject ID');
    }

    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const subject = await this.subjectModel.findById(id).exec();
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    subject.isActive = !subject.isActive;
    subject.updatedBy = new Types.ObjectId(userId);
    await subject.save();
    
    await subject.populate([
      { path: 'createdBy', select: 'email username role' },
      { path: 'updatedBy', select: 'email username role' }
    ]);

    return {
      _id: subject._id,
      subjectName: subject.subjectName,
      description: subject.description,
      isActive: subject.isActive,
      createdBy: subject.createdBy,
      updatedBy: subject.updatedBy,
      message: 'Subject status updated successfully',
    };
  }

  async getSubjectStatus(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid subject ID');
    }

    const subject = await this.subjectModel
      .findById(id)
      .populate('createdBy', 'email username role')
      .populate('updatedBy', 'email username role')
      .exec();
    
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    return {
      subject: {
        _id: subject._id,
        subjectName: subject.subjectName,
        description: subject.description,
        isActive: subject.isActive,
        createdBy: subject.createdBy,
        updatedBy: subject.updatedBy,
      },
      totalBatches: 0,
      activeBatches: 0,
      totalStudents: 0,
      averageStudentsPerBatch: 0,
    };
  }

  async findByCreator(userId: string, query?: any) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const { 
      search, 
      isActive, 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = query || {};
    
    const filter: any = { createdBy: new Types.ObjectId(userId) };
    
    if (search) {
      filter.subjectName = { $regex: search, $options: 'i' };
    }
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true' || isActive === true;
    }
    
    const currentPage = Math.max(1, Number(page));
    const pageSize = Math.max(1, Math.min(100, Number(limit)));
    const skip = (currentPage - 1) * pageSize;
    
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [data, total] = await Promise.all([
      this.subjectModel
        .find(filter)
        .populate('createdBy', 'email username role')
        .populate('updatedBy', 'email username role')
        .sort(sort)
        .skip(skip)
        .limit(pageSize)
        .exec(),
      this.subjectModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page: currentPage,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async countSubjectsByUser(userId: string): Promise<number> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    
    return this.subjectModel.countDocuments({ 
      createdBy: new Types.ObjectId(userId) 
    }).exec();
  }

  async countActiveSubjectsByUser(userId: string): Promise<number> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    
    return this.subjectModel.countDocuments({ 
      createdBy: new Types.ObjectId(userId),
      isActive: true 
    }).exec();
  }
}