import { 
  Injectable, 
  NotFoundException, 
  ConflictException, 
  BadRequestException 
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Class, ClassDocument } from './class.schema';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

@Injectable()
export class ClassService {
  constructor(
    @InjectModel(Class.name) private classModel: Model<ClassDocument>,
  ) {}

  async create(dto: CreateClassDto) {
    // Check for duplicate class name
    const existingClass = await this.classModel.findOne({ 
      classname: dto.classname 
    }).exec();

    if (existingClass) {
      throw new ConflictException('Class with this name already exists');
    }

    const newClass = new this.classModel(dto);
    return newClass.save();
  }

  async findAll(query?: any) {
    const { search, isActive, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query || {};
    
    const filter: any = {};
    
    if (search) {
      filter.classname = { $regex: search, $options: 'i' };
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
      this.classModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(pageSize)
        .exec(),
      this.classModel.countDocuments(filter).exec(),
    ]);
    
    return {
      data,
      total,
      page: currentPage,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid class ID');
    }

    const result = await this.classModel.findById(id).exec();
    if (!result) throw new NotFoundException('Class not found');
    return result;
  }

  async update(id: string, dto: UpdateClassDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid class ID');
    }

    // Check for duplicate class name if updating classname
    if (dto.classname) {
      const existingClass = await this.classModel.findOne({ 
        classname: dto.classname,
        _id: { $ne: id }
      }).exec();

      if (existingClass) {
        throw new ConflictException('Class with this name already exists');
      }
    }

    const updated = await this.classModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();

    if (!updated) throw new NotFoundException('Class not found');

    return updated;
  }

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid class ID');
    }

    const deleted = await this.classModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('Class not found');

    return { message: 'Class deleted successfully' };
  }

  async getClassStatus(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid class ID');
    }

    const classDoc = await this.classModel.findById(id).exec();
    if (!classDoc) {
      throw new NotFoundException('Class not found');
    }

    return {
      class: {
        _id: classDoc._id,
        classname: classDoc.classname,
        // isActive: classDoc.isActive,
      },
      totalBatches: 0,
      activeBatches: 0,
      totalStudents: 0,
      averageStudentsPerBatch: 0,
    };
  }

  async toggleActive(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid class ID');
    }

    const classDoc = await this.classModel.findById(id).exec();
    if (!classDoc) {
      throw new NotFoundException('Class not found');
    }

    // classDoc.isActive = !classDoc.isActive;
    await classDoc.save();

    return {
      _id: classDoc._id,
      classname: classDoc.classname,
      // isActive: classDoc.isActive,
      message: 'Class status updated successfully',
    };
  }
}