import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ConflictException 
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Group, GroupDocument } from './group.schema';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupService {
  constructor(@InjectModel(Group.name) private groupModel: Model<GroupDocument>) {}

  async create(dto: CreateGroupDto, userId: string) {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }

      // Check for duplicate group name (case-insensitive)
      const existingGroup = await this.groupModel
        .findOne({ groupName: { $regex: new RegExp(`^${dto.groupName}$`, 'i') } })
        .exec();

      if (existingGroup) {
        throw new ConflictException('Group with this name already exists');
      }

      const userObjectId = new Types.ObjectId(userId);
      const newGroup = new this.groupModel({
        ...dto,
        createdBy: userObjectId
      });
      
      const savedGroup = await newGroup.save();
      
      // Populate createdBy field
      await savedGroup.populate('createdBy', 'email username role');
      
      return savedGroup;
    } catch (err) {
      if (err instanceof ConflictException || err instanceof BadRequestException) {
        throw err;
      }
      if (err?.code === 11000) {
        throw new ConflictException('Group with this name already exists');
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
      filter.groupName = { $regex: search, $options: 'i' };
    }
    
    if (isActive !== undefined) {
      filter.isActive = isActive === true;
    }
    
    const skip = (page - 1) * limit;
    const docs = await this.groupModel
      .find(filter)
      .populate('createdBy', 'email username role')
      .populate('updatedBy', 'email username role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
    const total = await this.groupModel.countDocuments(filter).exec();
    
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
      throw new BadRequestException('Invalid group ID');
    }

    const result = await this.groupModel
      .findById(id)
      .populate('createdBy', 'email username role')
      .populate('updatedBy', 'email username role')
      .exec();
    
    if (!result) throw new NotFoundException('Group not found');
    return result;
  }

  async update(id: string, dto: UpdateGroupDto, userId?: string) {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid group ID');
      }

      // Check for duplicate group name if updating groupName
      if (dto.groupName) {
        const existingGroup = await this.groupModel
          .findOne({ 
            groupName: { $regex: new RegExp(`^${dto.groupName}$`, 'i') },
            _id: { $ne: id }
          })
          .exec();

        if (existingGroup) {
          throw new ConflictException('Group with this name already exists');
        }
      }

      const updateData: any = { ...dto };
      if (userId) {
        if (!Types.ObjectId.isValid(userId)) {
          throw new BadRequestException('Invalid user ID');
        }
        updateData.updatedBy = new Types.ObjectId(userId);
      }

      const updated = await this.groupModel
        .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
        .populate('createdBy', 'email username role')
        .populate('updatedBy', 'email username role')
        .exec();
        
      if (!updated) throw new NotFoundException('Group not found');
      
      return updated;
    } catch (err) {
      if (err instanceof NotFoundException || 
          err instanceof ConflictException || 
          err instanceof BadRequestException) {
        throw err;
      }
      if (err?.code === 11000) {
        throw new ConflictException('Group with this name already exists');
      }
      throw err;
    }
  }

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid group ID');
    }

    const deleted = await this.groupModel
      .findByIdAndDelete(id)
      .populate('createdBy', 'email username role')
      .exec();
    
    if (!deleted) throw new NotFoundException('Group not found');
    
    return { 
      message: 'Group deleted successfully',
      deletedGroup: deleted
    };
  }

  async findByName(name: string) {
    return this.groupModel
      .findOne({ groupName: name })
      .collation({ locale: 'en', strength: 2 })
      .populate('createdBy', 'email username role')
      .exec();
  }

  async findActive() {
    return this.groupModel
      .find({ isActive: true })
      .populate('createdBy', 'email username role')
      .populate('updatedBy', 'email username role')
      .sort({ groupName: 1 })
      .exec();
  }

  async toggleActive(id: string, userId: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid group ID');
    }

    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const group = await this.groupModel.findById(id).exec();
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    group.isActive = !group.isActive;
    group.updatedBy = new Types.ObjectId(userId);
    await group.save();
    
    await group.populate([
      { path: 'createdBy', select: 'email username role' },
      { path: 'updatedBy', select: 'email username role' }
    ]);

    return {
      _id: group._id,
      groupName: group.groupName,
      description: group.description,
      isActive: group.isActive,
      createdBy: group.createdBy,
      updatedBy: group.updatedBy,
      message: 'Group status updated successfully',
    };
  }

  async getGroupStatus(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid group ID');
    }

    const group = await this.groupModel
      .findById(id)
      .populate('createdBy', 'email username role')
      .populate('updatedBy', 'email username role')
      .exec();
    
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return {
      group: {
        _id: group._id,
        groupName: group.groupName,
        description: group.description,
        isActive: group.isActive,
        createdBy: group.createdBy,
        updatedBy: group.updatedBy,
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
      filter.groupName = { $regex: search, $options: 'i' };
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
      this.groupModel
        .find(filter)
        .populate('createdBy', 'email username role')
        .populate('updatedBy', 'email username role')
        .sort(sort)
        .skip(skip)
        .limit(pageSize)
        .exec(),
      this.groupModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page: currentPage,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async countGroupsByUser(userId: string): Promise<number> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    
    return this.groupModel.countDocuments({ 
      createdBy: new Types.ObjectId(userId) 
    }).exec();
  }

  async countActiveGroupsByUser(userId: string): Promise<number> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    
    return this.groupModel.countDocuments({ 
      createdBy: new Types.ObjectId(userId),
      isActive: true 
    }).exec();
  }
}