// src/suggestion-complaint/services/feedback.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Feedback, FeedbackDocument } from '../schemas/feedback.schema';

import { FeedbackType } from '../enums/feedback-type.enum';
import { FeedbackStatus } from '../enums/feedback-status.enum';
import { CreateFeedbackDto } from '../dto/create-feedback.dto';
import { AdminUpdateFeedbackDto, UpdateFeedbackDto } from '../dto/update-feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectModel(Feedback.name) private readonly feedbackModel: Model<FeedbackDocument>
  ) {}

  // create feedback (userId optional)
  async create(createDto: CreateFeedbackDto, userId?: string | Types.ObjectId) {
    const doc: Partial<Feedback> = {
      type: createDto.type,
      subject: createDto.subject,
      message: createDto.message,
      isAnonymous: !!createDto.isAnonymous,
    };

    if (userId && !createDto.isAnonymous) {
      doc.user = new Types.ObjectId(userId as string);
      doc.userName = createDto.userName || undefined;
      doc.userEmail = createDto.userEmail || undefined;
      doc.isAnonymous = false;
    } else {
      // anonymous or no user
      doc.user = undefined;
      doc.userName = createDto.userName || 'Anonymous';
      doc.userEmail = createDto.userEmail || undefined;
      doc.isAnonymous = true;
    }

    const created = new this.feedbackModel(doc);
    return created.save();
  }

  // find all with pagination + filters
  async findAll(query: any = {}, requesterRole?: string, requesterId?: string) {
    const {
      page = 1,
      limit = 10,
      search,
      type,
      status,
      my = false, // if true, filter to only requester's feedback
    } = query;

    const filter: any = { isActive: true };

    if (search) {
      filter.$text = { $search: String(search) };
    }
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (my === 'true' || my === true) {
      if (!requesterId) throw new ForbiddenException('User ID required for my feedback');
      filter.user = new Types.ObjectId(requesterId);
    }

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    const [items, total] = await Promise.all([
      this.feedbackModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean()
        .exec(),
      this.feedbackModel.countDocuments(filter)
    ]);

    return {
      items,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    };
  }

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Invalid ID');
    const doc = await this.feedbackModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Feedback not found');
    return doc;
  }

  async update(id: string, updateDto: UpdateFeedbackDto, requesterId?: string) {
    const doc = await this.findOne(id);
    // only owner (or admin in admin endpoint) can update — here we assume caller ensures permission
    if (doc.user && requesterId && doc.user.toString() !== requesterId) {
      throw new ForbiddenException('You cannot update this feedback');
    }
    Object.assign(doc, updateDto);
    return doc.save();
  }

  async adminUpdate(id: string, adminDto: AdminUpdateFeedbackDto) {
    const doc = await this.findOne(id);
    if (adminDto.status) doc.status = adminDto.status;
    if (adminDto.subject !== undefined) doc.subject = adminDto.subject;
    if (adminDto.message !== undefined) doc.message = adminDto.message;
    return doc.save();
  }

  async remove(id: string, requesterId?: string, requesterRole?: string) {
    const doc = await this.findOne(id);
    // allow admin to delete; owner can soft-delete too
    const isOwner = doc.user && requesterId && doc.user.toString() === requesterId;
    const isAdmin = requesterRole === 'admin' || requesterRole === 'superadmin';
    if (!isOwner && !isAdmin) throw new ForbiddenException('Not allowed to delete');
    doc.isActive = false; // soft delete
    await doc.save();
    return;
  }

  async replyToFeedback(id: string, message: string, authorId?: string, authorName?: string) {
    const doc = await this.findOne(id);
    const entry = {
      authorId: authorId ? new Types.ObjectId(authorId) : undefined,
      authorName: authorName || 'Admin',
      message,
      createdAt: new Date()
    } as any;
    doc.reply = doc.reply || [];
    doc.reply.push(entry);
    // mark in_review/resolved automatically? keep status as-is; admin can change separately
    await doc.save();
    return doc;
  }

  async changeStatus(id: string, status: string, authorId?: string) {
    const doc = await this.findOne(id);
    doc.status = status as any;
    await doc.save();
    return doc;
  }

  async getStatistics() {
    const total = await this.feedbackModel.countDocuments({ isActive: true });
    const byType = await this.feedbackModel.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    const byStatus = await this.feedbackModel.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    return {
      total,
      byType,
      byStatus
    };
  }
}
