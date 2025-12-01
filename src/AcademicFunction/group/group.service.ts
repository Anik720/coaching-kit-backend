import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Group, GroupDocument } from './group.schema';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';


@Injectable()
export class GroupService {
  constructor(@InjectModel(Group.name) private groupModel: Model<GroupDocument>) {}

  async create(dto: CreateGroupDto) {
    try {
      const created = new this.groupModel(dto);
      return await created.save();
    } catch (err) {
      if (err?.code === 11000) {
        throw new BadRequestException('Group with this name already exists');
      }
      throw err;
    }
  }

  async findAll({ page = 1, limit = 20 }: { page?: number; limit?: number } = {}) {
    const skip = (page - 1) * limit;
    const docs = await this.groupModel
      .find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
    const total = await this.groupModel.countDocuments().exec();
    return { data: docs, meta: { total, page, limit } };
  }

  async findOne(id: string) {
    const result = await this.groupModel.findById(id).exec();
    if (!result) throw new NotFoundException('Group not found');
    return result;
  }

  async update(id: string, dto: UpdateGroupDto) {
    try {
      const updated = await this.groupModel
        .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
        .exec();
      if (!updated) throw new NotFoundException('Group not found');
      return updated;
    } catch (err) {
      if (err?.code === 11000) {
        throw new BadRequestException('Group with this name already exists');
      }
      throw err;
    }
  }

  async remove(id: string) {
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
}
