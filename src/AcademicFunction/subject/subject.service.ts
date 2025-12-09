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

  async create(dto: CreateSubjectDto) {
    try {
      // Check for duplicate subject name (case-insensitive)
      const existingSubject = await this.subjectModel
        .findOne({ subjectName: { $regex: new RegExp(`^${dto.subjectName}$`, 'i') } })
        .exec();

      if (existingSubject) {
        throw new ConflictException('Subject with this name already exists');
      }

      const created = new this.subjectModel(dto);
      return await created.save();
    } catch (err) {
      if (err instanceof ConflictException) {
        throw err;
      }
      // handle unique index errors gracefully
      if (err?.code === 11000) {
        throw new BadRequestException('Subject with this name already exists');
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
    
    // if (isActive !== undefined) {
    //   filter.isActive = isActive === true || isActive === 'true';
    // }
    
    const skip = (page - 1) * limit;
    const docs = await this.subjectModel
      .find(filter)
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

    const result = await this.subjectModel.findById(id).exec();
    if (!result) throw new NotFoundException('Subject not found');
    return result;
  }

  async update(id: string, dto: UpdateSubjectDto) {
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

      const updated = await this.subjectModel
        .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
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
        throw new BadRequestException('Subject with this name already exists');
      }
      throw err;
    }
  }

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid subject ID');
    }

    const deleted = await this.subjectModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('Subject not found');
    
    return { message: 'Subject deleted successfully' };
  }

  // optional helper: find by name
  async findByName(name: string) {
    return this.subjectModel
      .findOne({ subjectName: name })
      .collation({ locale: 'en', strength: 2 })
      .exec();
  }

  async findActive() {
    return this.subjectModel
      .find({ isActive: true })
      .sort({ subjectName: 1 })
      .exec();
  }

  async toggleActive(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid subject ID');
    }

    const subject = await this.subjectModel.findById(id).exec();
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    // subject.isActive = !subject.isActive;
    await subject.save();

    return {
      _id: subject._id,
      subjectName: subject.subjectName,
      // isActive: subject.isActive,
      message: 'Subject status updated successfully',
    };
  }

  async getSubjectStatus(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid subject ID');
    }

    const subject = await this.subjectModel.findById(id).exec();
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    return {
      subject: {
        _id: subject._id,
        subjectName: subject.subjectName,
        // isActive: subject.isActive,
      },
      totalBatches: 0,
      activeBatches: 0,
      totalStudents: 0,
      averageStudentsPerBatch: 0,
    };
  }
}