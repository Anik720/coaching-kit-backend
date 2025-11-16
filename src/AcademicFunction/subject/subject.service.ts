import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
      const created = new this.subjectModel(dto);
      return await created.save();
    } catch (err) {
      // handle unique index errors gracefully
      if (err?.code === 11000) {
        throw new BadRequestException('Subject with this name already exists');
      }
      throw err;
    }
  }

  async findAll({ page = 1, limit = 20 }: { page?: number; limit?: number } = {}) {
    const skip = (page - 1) * limit;
    const docs = await this.subjectModel
      .find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
    const total = await this.subjectModel.countDocuments().exec();
    return { data: docs, meta: { total, page, limit } };
  }

  async findOne(id: string) {
    const result = await this.subjectModel.findById(id).exec();
    if (!result) throw new NotFoundException('Subject not found');
    return result;
  }

  async update(id: string, dto: UpdateSubjectDto) {
    try {
      const updated = await this.subjectModel
        .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
        .exec();
      if (!updated) throw new NotFoundException('Subject not found');
      return updated;
    } catch (err) {
      if (err?.code === 11000) {
        throw new BadRequestException('Subject with this name already exists');
      }
      throw err;
    }
  }

  async remove(id: string) {
    const deleted = await this.subjectModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('Subject not found');
    return { message: 'Subject deleted successfully' };
  }

  // optional helper: find by name
  async findByName(name: string) {
    return this.subjectModel.findOne({ subjectName: name }).collation({ locale: 'en', strength: 2 }).exec();
  }
}
