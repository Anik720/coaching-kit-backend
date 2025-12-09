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

  async create(dto: CreateGroupDto) {
    try {
      // Check for duplicate group name (case-insensitive)
      const existingGroup = await this.groupModel
        .findOne({ groupName: { $regex: new RegExp(`^${dto.groupName}$`, 'i') } })
        .exec();

      if (existingGroup) {
        throw new ConflictException('Group with this name already exists');
      }

      const created = new this.groupModel(dto);
      return await created.save();
    } catch (err) {
      if (err instanceof ConflictException) {
        throw err;
      }
      if (err?.code === 11000) {
        throw new BadRequestException('Group with this name already exists');
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
    
    // if (isActive !== undefined) {
    //   filter.isActive = isActive === true || isActive === 'true';
    // }
    
    const skip = (page - 1) * limit;
    const docs = await this.groupModel
      .find(filter)
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

    const result = await this.groupModel.findById(id).exec();
    if (!result) throw new NotFoundException('Group not found');
    return result;
  }

  async update(id: string, dto: UpdateGroupDto) {
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

      const updated = await this.groupModel
        .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
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
        throw new BadRequestException('Group with this name already exists');
      }
      throw err;
    }
  }

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid group ID');
    }

    const deleted = await this.groupModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('Group not found');
    
    return { message: 'Group deleted successfully' };
  }

  async findByName(name: string) {
    return this.groupModel
      .findOne({ groupName: name })
      .collation({ locale: 'en', strength: 2 })
      .exec();
  }

  async findActive() {
    return this.groupModel
      .find({ isActive: true })
      .sort({ groupName: 1 })
      .exec();
  }

  async toggleActive(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid group ID');
    }

    const group = await this.groupModel.findById(id).exec();
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // group.isActive = !group.isActive;
    await group.save();

    return {
      _id: group._id,
      groupName: group.groupName,
      // isActive: group.isActive,
      message: 'Group status updated successfully',
    };
  }

  async getGroupStatus(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid group ID');
    }

    const group = await this.groupModel.findById(id).exec();
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return {
      group: {
        _id: group._id,
        groupName: group.groupName,
        // isActive: group.isActive,
      },
      totalBatches: 0,
      activeBatches: 0,
      totalStudents: 0,
      averageStudentsPerBatch: 0,
    };
  }
}