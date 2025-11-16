import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Class, ClassDocument } from './class.schema';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

@Injectable()
export class ClassService {
  constructor(
    @InjectModel(Class.name) private classModel: Model<ClassDocument>,
  ) {}

  async create(dto: CreateClassDto) {
    const newClass = new this.classModel(dto);
    return newClass.save();
  }

  async findAll() {
    return this.classModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string) {
    const result = await this.classModel.findById(id).exec();
    if (!result) throw new NotFoundException('Class not found');
    return result;
  }

  async update(id: string, dto: UpdateClassDto) {
    const updated = await this.classModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();

    if (!updated) throw new NotFoundException('Class not found');

    return updated;
  }

  async remove(id: string) {
    const deleted = await this.classModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('Class not found');

    return { message: 'Class deleted successfully' };
  }
}
