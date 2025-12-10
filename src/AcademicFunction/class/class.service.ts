import { 
  Injectable, 
  NotFoundException, 
  ConflictException, 
  BadRequestException,
  UnauthorizedException
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

  async create(dto: CreateClassDto, userId: string) {
    console.log('=== Class Creation Debug ===');
    console.log('Received userId:', userId);
    console.log('Is valid ObjectId?', Types.ObjectId.isValid(userId));
    
    if (!Types.ObjectId.isValid(userId)) {
      console.log('ERROR: Invalid user ID format');
      throw new BadRequestException('Invalid user ID');
    }

    // Check for duplicate class name
    const existingClass = await this.classModel.findOne({ 
      classname: dto.classname 
    }).exec();

    if (existingClass) {
      console.log('ERROR: Duplicate class name');
      throw new ConflictException('Class with this name already exists');
    }

    const userObjectId = new Types.ObjectId(userId);
    console.log('Converted to ObjectId:', userObjectId);

    const newClass = new this.classModel({
      ...dto,
      createdBy: userObjectId
    });
    
    console.log('New class data:', {
      classname: newClass.classname,
      createdBy: newClass.createdBy,
      isActive: newClass.isActive,
      description: newClass.description
    });
    
    const savedClass = await newClass.save();
    console.log('Saved class ID:', savedClass._id);
    
    // Populate createdBy field
    try {
      await savedClass.populate('createdBy', 'email username role');
      console.log('Populated createdBy:', savedClass.createdBy);
    } catch (populateError) {
      console.error('Error populating createdBy:', populateError);
      // Continue even if populate fails - the ID is still saved
    }
    
    console.log('=== End Debug ===');
    return savedClass;
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
        .populate('createdBy', 'email username role')
        .populate('updatedBy', 'email username role')
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

    const result = await this.classModel
      .findById(id)
      .populate('createdBy', 'email username role')
      .populate('updatedBy', 'email username role')
      .exec();
    
    if (!result) throw new NotFoundException('Class not found');
    return result;
  }

  async update(id: string, dto: UpdateClassDto, userId?: string) {
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

    const updateData: any = { ...dto };
    if (userId) {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }
      updateData.updatedBy = new Types.ObjectId(userId);
    }

    const updated = await this.classModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('createdBy', 'email username role')
      .populate('updatedBy', 'email username role')
      .exec();

    if (!updated) throw new NotFoundException('Class not found');

    return updated;
  }

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid class ID');
    }

    const deleted = await this.classModel
      .findByIdAndDelete(id)
      .populate('createdBy', 'email username role')
      .exec();
    
    if (!deleted) throw new NotFoundException('Class not found');

    return { 
      message: 'Class deleted successfully',
      deletedClass: deleted 
    };
  }

  async getClassStatus(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid class ID');
    }

    const classDoc = await this.classModel
      .findById(id)
      .populate('createdBy', 'email username role')
      .populate('updatedBy', 'email username role')
      .exec();
    
    if (!classDoc) {
      throw new NotFoundException('Class not found');
    }

    return {
      class: {
        _id: classDoc._id,
        classname: classDoc.classname,
        isActive: classDoc.isActive,
        description: classDoc.description,
        createdBy: classDoc.createdBy,
        updatedBy: classDoc.updatedBy,
        // createdAt: classDoc.createdAt,
        // updatedAt: classDoc.updatedAt,
      },
      totalBatches: 0,
      activeBatches: 0,
      totalStudents: 0,
      averageStudentsPerBatch: 0,
    };
  }

  async toggleActive(id: string, userId: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid class ID');
    }

    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const classDoc = await this.classModel.findById(id).exec();
    if (!classDoc) {
      throw new NotFoundException('Class not found');
    }

    // Toggle active status
    classDoc.isActive = !classDoc.isActive;
    
    // Set the user who updated
    classDoc.updatedBy = new Types.ObjectId(userId);
    
    // Save the changes
    await classDoc.save();
    
    // Populate the user fields with details
    await classDoc.populate([
      { path: 'createdBy', select: 'email username role' },
      { path: 'updatedBy', select: 'email username role' }
    ]);

    return {
      _id: classDoc._id,
      classname: classDoc.classname,
      description: classDoc.description,
      isActive: classDoc.isActive,
      createdBy: classDoc.createdBy,
      updatedBy: classDoc.updatedBy,
      // createdAt: classDoc.createdAt,
      // updatedAt: classDoc.updatedAt,
      message: 'Class status updated successfully',
    };
  }

  // Find classes created by a specific user
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
        .populate('createdBy', 'email username role')
        .populate('updatedBy', 'email username role')
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

  // Additional helper methods
  async countClassesByUser(userId: string): Promise<number> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    
    return this.classModel.countDocuments({ 
      createdBy: new Types.ObjectId(userId) 
    }).exec();
  }

  async countActiveClassesByUser(userId: string): Promise<number> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    
    return this.classModel.countDocuments({ 
      createdBy: new Types.ObjectId(userId),
      isActive: true 
    }).exec();
  }
}