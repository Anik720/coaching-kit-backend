// src/result-management/exam/exam.service.ts
import { 
  Injectable, 
  NotFoundException, 
  ConflictException, 
  BadRequestException,
  InternalServerErrorException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { Exam, ExamDocument } from './exam.schema';


@Injectable()
export class ExamService {
  constructor(
    @InjectModel(Exam.name) private examModel: Model<ExamDocument>,
  ) {}

  async create(dto: CreateExamDto, userId: string) {
    console.log('=== Exam Creation Debug ===');
    console.log('Received userId:', userId);
    
    if (!Types.ObjectId.isValid(userId)) {
      console.log('ERROR: Invalid user ID format');
      throw new BadRequestException('Invalid user ID');
    }

    // Check for duplicate exam name within same class and subject
    const existingExam = await this.examModel.findOne({ 
      examName: dto.examName.trim(),
      className: dto.className.trim(),
      subjectName: dto.subjectName.trim()
    }).exec();

    if (existingExam) {
      console.log('ERROR: Duplicate exam name');
      throw new ConflictException('Exam with this name already exists for this class and subject');
    }

    // Validate total pass marks don't exceed total marks
    if (dto.totalPassMarks !== undefined && dto.totalPassMarks > dto.totalMarks) {
      throw new BadRequestException('Total pass marks cannot exceed total marks');
    }

    // Validate marks fields
    if (dto.marksFields && dto.marksFields.length > 0) {
      let calculatedTotal = 0;
      for (const field of dto.marksFields) {
        // Validate pass marks for each field
        if (field.enablePassMarks && field.passMarks !== undefined) {
          if (field.passMarks > field.totalMarks) {
            throw new BadRequestException(`Pass marks for ${field.type} cannot exceed its total marks`);
          }
        }
        calculatedTotal += field.totalMarks;
      }
      
      // Validate that sum of marks fields equals total marks
      if (calculatedTotal !== dto.totalMarks) {
        throw new BadRequestException(`Sum of marks fields (${calculatedTotal}) must equal total marks (${dto.totalMarks})`);
      }
    }

    // Validate grading options
    if (dto.enableGrading && dto.totalPassMarks === undefined) {
      throw new BadRequestException('Total pass marks are required when grading is enabled');
    }

    // Validate grading display options
    if (dto.enableGrading) {
      if (!dto.showPercentageInResult && !dto.showGPAInResult) {
        throw new BadRequestException('At least one grading display option must be selected when grading is enabled');
      }
    }

    const userObjectId = new Types.ObjectId(userId);
    console.log('Converted to ObjectId:', userObjectId);

    const newExam = new this.examModel({
      examName: dto.examName.trim(),
      topicName: dto.topicName?.trim() || '',
      className: dto.className.trim(),
      batchName: dto.batchName.trim(),
      subjectName: dto.subjectName.trim(),
      examCategory: dto.examCategory.trim(),
      examDate: dto.examDate,
      showMarksTitle: dto.showMarksTitle || false,
      marksFields: dto.marksFields || [],
      totalMarks: dto.totalMarks,
      enableGrading: dto.enableGrading || false,
      totalPassMarks: dto.totalPassMarks,
      showPercentageInResult: dto.showPercentageInResult || false,
      showGPAInResult: dto.showGPAInResult || false,
      useGPASystem: dto.useGPASystem || false,
      isActive: true,
      createdBy: userObjectId
    });
    
    console.log('New exam data:', newExam);
    
    const savedExam = await newExam.save();
    console.log('Saved exam ID:', savedExam._id);
    
    console.log('=== End Debug ===');
    return savedExam;
  }

  async findAll(query?: any) {
    const { 
      search, 
      isActive, 
      className,
      subjectName,
      examCategory,
      batchName,
      fromDate,
      toDate,
      page = 1, 
      limit = 10, 
      sortBy = 'examDate', 
      sortOrder = 'desc' 
    } = query || {};
    
    const filter: any = {};
    
    if (search) {
      filter.$or = [
        { examName: { $regex: search, $options: 'i' } },
        { topicName: { $regex: search, $options: 'i' } },
        { className: { $regex: search, $options: 'i' } },
        { subjectName: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true' || isActive === true;
    }

    if (className) {
      filter.className = { $regex: className, $options: 'i' };
    }

    if (subjectName) {
      filter.subjectName = { $regex: subjectName, $options: 'i' };
    }

    if (examCategory) {
      filter.examCategory = { $regex: examCategory, $options: 'i' };
    }

    if (batchName) {
      filter.batchName = { $regex: batchName, $options: 'i' };
    }

    if (fromDate || toDate) {
      filter.examDate = {};
      if (fromDate) {
        filter.examDate.$gte = new Date(fromDate);
      }
      if (toDate) {
        filter.examDate.$lte = new Date(toDate);
      }
    }
    
    const currentPage = Math.max(1, Number(page));
    const pageSize = Math.max(1, Math.min(100, Number(limit)));
    const skip = (currentPage - 1) * pageSize;
    
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const [data, total] = await Promise.all([
      this.examModel
        .find(filter)
        .populate('createdBy', 'email username role')
        .populate('updatedBy', 'email username role')
        .sort(sort)
        .skip(skip)
        .limit(pageSize)
        .exec(),
      this.examModel.countDocuments(filter).exec(),
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
      throw new BadRequestException('Invalid exam ID');
    }

    const result = await this.examModel
      .findById(id)
      .populate('createdBy', 'email username role')
      .populate('updatedBy', 'email username role')
      .exec();
    
    if (!result) throw new NotFoundException('Exam not found');
    return result;
  }

  async update(id: string, dto: UpdateExamDto, userId?: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid exam ID');
    }

    // Check if exam exists
    const existingExam = await this.examModel.findById(id).exec();
    if (!existingExam) {
      throw new NotFoundException('Exam not found');
    }

    // Check for duplicate exam name if updating
    if (dto.examName) {
      const duplicateExam = await this.examModel.findOne({ 
        examName: dto.examName.trim(),
        className: dto.className ? dto.className.trim() : existingExam.className,
        subjectName: dto.subjectName ? dto.subjectName.trim() : existingExam.subjectName,
        _id: { $ne: id }
      }).exec();

      if (duplicateExam) {
        throw new ConflictException('Exam with this name already exists for this class and subject');
      }
    }

    // Validate total pass marks don't exceed total marks
    const totalMarks = dto.totalMarks || existingExam.totalMarks;
    if (dto.totalPassMarks !== undefined && dto.totalPassMarks > totalMarks) {
      throw new BadRequestException('Total pass marks cannot exceed total marks');
    }

    // Validate marks fields
    if (dto.marksFields && dto.marksFields.length > 0) {
      let calculatedTotal = 0;
      for (const field of dto.marksFields) {
        if (field.enablePassMarks && field.passMarks !== undefined) {
          if (field.passMarks > field.totalMarks) {
            throw new BadRequestException(`Pass marks for ${field.type} cannot exceed its total marks`);
          }
        }
        calculatedTotal += field.totalMarks;
      }
      
      // Validate that sum of marks fields equals total marks
      if (calculatedTotal !== (dto.totalMarks || existingExam.totalMarks)) {
        throw new BadRequestException(`Sum of marks fields (${calculatedTotal}) must equal total marks (${dto.totalMarks || existingExam.totalMarks})`);
      }
    }

    // Validate grading options
    if (dto.enableGrading !== undefined ? dto.enableGrading : existingExam.enableGrading) {
      const totalPassMarks = dto.totalPassMarks !== undefined ? dto.totalPassMarks : existingExam.totalPassMarks;
      if (totalPassMarks === undefined) {
        throw new BadRequestException('Total pass marks are required when grading is enabled');
      }
    }

    // Validate grading display options
    if (dto.enableGrading !== undefined ? dto.enableGrading : existingExam.enableGrading) {
      const showPercentageInResult = dto.showPercentageInResult !== undefined ? dto.showPercentageInResult : existingExam.showPercentageInResult;
      const showGPAInResult = dto.showGPAInResult !== undefined ? dto.showGPAInResult : existingExam.showGPAInResult;
      
      if (!showPercentageInResult && !showGPAInResult) {
        throw new BadRequestException('At least one grading display option must be selected when grading is enabled');
      }
    }

    const updateData: any = {};
    
    // Update fields if provided
    if (dto.examName !== undefined) updateData.examName = dto.examName.trim();
    if (dto.topicName !== undefined) updateData.topicName = dto.topicName?.trim() || '';
    if (dto.className !== undefined) updateData.className = dto.className.trim();
    if (dto.batchName !== undefined) updateData.batchName = dto.batchName.trim();
    if (dto.subjectName !== undefined) updateData.subjectName = dto.subjectName.trim();
    if (dto.examCategory !== undefined) updateData.examCategory = dto.examCategory.trim();
    if (dto.examDate !== undefined) updateData.examDate = dto.examDate;
    if (dto.showMarksTitle !== undefined) updateData.showMarksTitle = dto.showMarksTitle;
    if (dto.marksFields !== undefined) updateData.marksFields = dto.marksFields;
    if (dto.totalMarks !== undefined) updateData.totalMarks = dto.totalMarks;
    if (dto.enableGrading !== undefined) updateData.enableGrading = dto.enableGrading;
    if (dto.totalPassMarks !== undefined) updateData.totalPassMarks = dto.totalPassMarks;
    if (dto.showPercentageInResult !== undefined) updateData.showPercentageInResult = dto.showPercentageInResult;
    if (dto.showGPAInResult !== undefined) updateData.showGPAInResult = dto.showGPAInResult;
    if (dto.useGPASystem !== undefined) updateData.useGPASystem = dto.useGPASystem;

    if (userId) {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }
      updateData.updatedBy = new Types.ObjectId(userId);
    }

    const updated = await this.examModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('createdBy', 'email username role')
      .populate('updatedBy', 'email username role')
      .exec();

    if (!updated) throw new NotFoundException('Exam not found');

    return updated;
  }

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid exam ID');
    }

    const deleted = await this.examModel
      .findByIdAndDelete(id)
      .populate('createdBy', 'email username role')
      .exec();
    
    if (!deleted) throw new NotFoundException('Exam not found');

    return { 
      message: 'Exam deleted successfully',
      deletedExam: deleted 
    };
  }

  async toggleActive(id: string, userId: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid exam ID');
    }

    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const exam = await this.examModel.findById(id).exec();
    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    // Toggle active status
    exam.isActive = !exam.isActive;
    
    // Set the user who updated
    exam.updatedBy = new Types.ObjectId(userId);
    
    // Save the changes
    await exam.save();
    
    // Populate references
    await exam.populate([
      { path: 'createdBy', select: 'email username role' },
      { path: 'updatedBy', select: 'email username role' }
    ]);

    return {
      _id: exam._id,
      examName: exam.examName,
      isActive: exam.isActive,
      createdBy: exam.createdBy,
      updatedBy: exam.updatedBy,
      message: 'Exam status updated successfully',
    };
  }
}