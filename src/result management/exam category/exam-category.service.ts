import { 
  Injectable, 
  NotFoundException, 
  ConflictException, 
  BadRequestException 
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ExamCategory, ExamCategoryDocument } from './exam-category.schema';
import { CreateExamCategoryDto } from './dto/create-exam-category.dto';
import { UpdateExamCategoryDto } from './dto/update-exam-category.dto';

@Injectable()
export class ExamCategoryService {
  constructor(
    @InjectModel(ExamCategory.name) private examCategoryModel: Model<ExamCategoryDocument>,
  ) {}

  async create(dto: CreateExamCategoryDto, userId: string) {
    console.log('=== Exam Category Creation Debug ===');
    console.log('Received userId:', userId);
    console.log('Is valid ObjectId?', Types.ObjectId.isValid(userId));
    
    if (!Types.ObjectId.isValid(userId)) {
      console.log('ERROR: Invalid user ID format');
      throw new BadRequestException('Invalid user ID');
    }

    // Check for duplicate category name
    const existingCategory = await this.examCategoryModel.findOne({ 
      categoryName: dto.categoryName 
    }).exec();

    if (existingCategory) {
      console.log('ERROR: Duplicate category name');
      throw new ConflictException('Exam category with this name already exists');
    }

    const userObjectId = new Types.ObjectId(userId);
    console.log('Converted to ObjectId:', userObjectId);

    const newCategory = new this.examCategoryModel({
      ...dto,
      createdBy: userObjectId
    });
    
    console.log('New category data:', {
      categoryName: newCategory.categoryName,
      createdBy: newCategory.createdBy,
      isActive: newCategory.isActive,
      description: newCategory.description
    });
    
    const savedCategory = await newCategory.save();
    console.log('Saved category ID:', savedCategory._id);
    
    // Populate createdBy field
    try {
      await savedCategory.populate('createdBy', 'email username role');
      console.log('Populated createdBy:', savedCategory.createdBy);
    } catch (populateError) {
      console.error('Error populating createdBy:', populateError);
    }
    
    console.log('=== End Debug ===');
    return savedCategory;
  }

  async findAll(query?: any) {
    const { search, isActive, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query || {};
    
    const filter: any = {};
    
    if (search) {
      filter.categoryName = { $regex: search, $options: 'i' };
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
      this.examCategoryModel
        .find(filter)
        .populate('createdBy', 'email username role')
        .populate('updatedBy', 'email username role')
        .sort(sort)
        .skip(skip)
        .limit(pageSize)
        .exec(),
      this.examCategoryModel.countDocuments(filter).exec(),
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
      throw new BadRequestException('Invalid exam category ID');
    }

    const result = await this.examCategoryModel
      .findById(id)
      .populate('createdBy', 'email username role')
      .populate('updatedBy', 'email username role')
      .exec();
    
    if (!result) throw new NotFoundException('Exam category not found');
    return result;
  }

  async update(id: string, dto: UpdateExamCategoryDto, userId?: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid exam category ID');
    }

    // Check for duplicate category name if updating categoryName
    if (dto.categoryName) {
      const existingCategory = await this.examCategoryModel.findOne({ 
        categoryName: dto.categoryName,
        _id: { $ne: id }
      }).exec();

      if (existingCategory) {
        throw new ConflictException('Exam category with this name already exists');
      }
    }

    const updateData: any = { ...dto };
    if (userId) {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }
      updateData.updatedBy = new Types.ObjectId(userId);
    }

    const updated = await this.examCategoryModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('createdBy', 'email username role')
      .populate('updatedBy', 'email username role')
      .exec();

    if (!updated) throw new NotFoundException('Exam category not found');

    return updated;
  }

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid exam category ID');
    }

    const deleted = await this.examCategoryModel
      .findByIdAndDelete(id)
      .populate('createdBy', 'email username role')
      .exec();
    
    if (!deleted) throw new NotFoundException('Exam category not found');

    return { 
      message: 'Exam category deleted successfully',
      deletedCategory: deleted 
    };
  }

  async getCategoryStatus(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid exam category ID');
    }

    const category = await this.examCategoryModel
      .findById(id)
      .populate('createdBy', 'email username role')
      .populate('updatedBy', 'email username role')
      .exec();
    
    if (!category) {
      throw new NotFoundException('Exam category not found');
    }

    return {
      category: {
        _id: category._id,
        categoryName: category.categoryName,
        isActive: category.isActive,
        description: category.description,
        createdBy: category.createdBy,
        updatedBy: category.updatedBy,
      },
      totalExams: 0, // You can add exam counting logic later
      activeExams: 0,
    };
  }

  async toggleActive(id: string, userId: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid exam category ID');
    }

    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const category = await this.examCategoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException('Exam category not found');
    }

    // Toggle active status
    category.isActive = !category.isActive;
    
    // Set the user who updated
    category.updatedBy = new Types.ObjectId(userId);
    
    // Save the changes
    await category.save();
    
    // Populate the user fields with details
    await category.populate([
      { path: 'createdBy', select: 'email username role' },
      { path: 'updatedBy', select: 'email username role' }
    ]);

    return {
      _id: category._id,
      categoryName: category.categoryName,
      description: category.description,
      isActive: category.isActive,
      createdBy: category.createdBy,
      updatedBy: category.updatedBy,
      message: 'Exam category status updated successfully',
    };
  }

  // Find categories created by a specific user
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
      filter.categoryName = { $regex: search, $options: 'i' };
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
      this.examCategoryModel
        .find(filter)
        .populate('createdBy', 'email username role')
        .populate('updatedBy', 'email username role')
        .sort(sort)
        .skip(skip)
        .limit(pageSize)
        .exec(),
      this.examCategoryModel.countDocuments(filter).exec(),
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
  async countCategoriesByUser(userId: string): Promise<number> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    
    return this.examCategoryModel.countDocuments({ 
      createdBy: new Types.ObjectId(userId) 
    }).exec();
  }

  async countActiveCategoriesByUser(userId: string): Promise<number> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    
    return this.examCategoryModel.countDocuments({ 
      createdBy: new Types.ObjectId(userId),
      isActive: true 
    }).exec();
  }
}