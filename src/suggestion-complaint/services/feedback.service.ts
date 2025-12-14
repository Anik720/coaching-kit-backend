import { Injectable, NotFoundException, ForbiddenException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Feedback, FeedbackDocument } from '../schemas/feedback.schema';
import { FeedbackType } from '../enums/feedback-type.enum';
import { FeedbackStatus } from '../enums/feedback-status.enum';
import { CreateFeedbackDto } from '../dto/create-feedback.dto';
import { AdminUpdateFeedbackDto, UpdateFeedbackDto } from '../dto/update-feedback.dto';
import { FeedbackResponseDto, ReplyResponseDto, UserInfoDto } from '../dto/feedback-response.dto';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectModel(Feedback.name) private readonly feedbackModel: Model<FeedbackDocument>
  ) {}

private mapToResponseDto(feedback: any): FeedbackResponseDto {
  try {
    console.log('DEBUG mapToResponseDto - feedback object:', {
      id: feedback._id,
      user: feedback.user,
      createdBy: feedback.createdBy,
      updatedBy: feedback.updatedBy
    });

    const response: FeedbackResponseDto = {
      _id: feedback._id.toString(),
      userName: feedback.userName,
      userEmail: feedback.userEmail,
      isAnonymous: feedback.isAnonymous,
      type: feedback.type,
      subject: feedback.subject,
      message: feedback.message,
      status: feedback.status,
      isActive: feedback.isActive,
      createdAt: feedback.createdAt,
      updatedAt: feedback.updatedAt,
    };

    // Check if fields are ObjectIds or populated objects
    const checkAndMapUser = (field: any, fieldName: string) => {
      if (!field) return null;
      
      if (field instanceof Types.ObjectId) {
        // It's just an ObjectId, not populated
        console.log(`${fieldName} is ObjectId:`, field.toString());
        return {
          _id: field.toString(),
          email: undefined,
          username: undefined,
          name: undefined,
          role: undefined
        };
      } else if (typeof field === 'object' && field._id) {
        // It's a populated object
        console.log(`${fieldName} is populated object:`, field);
        return {
          _id: field._id.toString(),
          email: field.email || undefined,
          username: field.username || undefined,
          name: field.name || undefined,
          role: field.role || undefined
        };
      }
      return null;
    };

    // Map user
    const userInfo = checkAndMapUser(feedback.user, 'user');
    if (userInfo) response.user = userInfo;

    // Map createdBy
    const createdByInfo = checkAndMapUser(feedback.createdBy, 'createdBy');
    if (createdByInfo) response.createdBy = createdByInfo;

    // Map updatedBy
    const updatedByInfo = checkAndMapUser(feedback.updatedBy, 'updatedBy');
    if (updatedByInfo) response.updatedBy = updatedByInfo;

    // Map replies
    if (feedback.reply && Array.isArray(feedback.reply)) {
      response.reply = feedback.reply.map((reply: any) => {
        const replyResponse: ReplyResponseDto = {
          message: reply.message,
          createdAt: reply.createdAt,
        };

        const authorInfo = checkAndMapUser(reply.authorId, 'reply.authorId');
        if (authorInfo) {
          replyResponse.authorId = authorInfo._id;
          replyResponse.authorName = authorInfo.name || authorInfo.username || reply.authorName;
          replyResponse.author = authorInfo;
        } else if (reply.authorName) {
          replyResponse.authorName = reply.authorName;
        }

        return replyResponse;
      });
    }

    console.log('DEBUG mapToResponseDto - final response:', JSON.stringify(response, null, 2));
    return response;
  } catch (error) {
    console.error('Error mapping feedback to response DTO:', error);
    throw new InternalServerErrorException('Error processing feedback data');
  }
}

  // create feedback (userId optional)
  async create(createDto: CreateFeedbackDto, userId?: string): Promise<FeedbackResponseDto> {
    try {
      if (userId && !Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }

      const doc: Partial<Feedback> = {
        type: createDto.type,
        subject: createDto.subject || '',
        message: createDto.message,
        isAnonymous: !!createDto.isAnonymous,
        status: FeedbackStatus.PENDING,
        isActive: true,
      };

      // Set createdBy - always required
      if (userId) {
        doc.createdBy = new Types.ObjectId(userId);
      } else {
        // For anonymous feedback, we still need a createdBy
        // You could use a system user ID or the provided email/userName
        doc.createdBy = new Types.ObjectId(); // Default system user or handle differently
      }

      if (userId && !createDto.isAnonymous) {
        doc.user = new Types.ObjectId(userId);
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
      const savedFeedback = await created.save();
      
      // Populate user fields using direct population (no virtuals)
      const populatedFeedback = await this.feedbackModel
        .findById(savedFeedback._id)
        .populate('user', 'email username name role')
        .populate('createdBy', 'email username name role')
        .populate('updatedBy', 'email username name role')
        .exec();

      if (!populatedFeedback) {
        throw new Error('Failed to create feedback');
      }

      return this.mapToResponseDto(populatedFeedback);
    } catch (error: any) {
      console.error('Feedback creation error:', error);
      if (error.name === 'ValidationError') {
        throw new BadRequestException(`Validation failed: ${error.message}`);
      }
      throw new InternalServerErrorException('Feedback creation failed');
    }
  }

  // find all with pagination + filters
async findAll(query: any = {}, requesterRole?: string, requesterId?: string): Promise<{
  items: FeedbackResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      type,
      status,
      my = false,
      createdBy,
      isAnonymous,
    } = query;

    const filter: any = { isActive: true };

    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } },
      ];
    }
    
    if (type) filter.type = type;
    if (status) filter.status = status;
    
    if (isAnonymous !== undefined) {
      filter.isAnonymous = isAnonymous === 'true' || isAnonymous === true;
    }

    if (createdBy && Types.ObjectId.isValid(createdBy)) {
      filter.createdBy = new Types.ObjectId(createdBy);
    }

    if (my === 'true' || my === true) {
      if (!requesterId) {
        throw new ForbiddenException('User ID required for my feedback');
      }
      if (!Types.ObjectId.isValid(requesterId)) {
        throw new BadRequestException('Invalid requester ID');
      }
      filter.$or = [
        { user: new Types.ObjectId(requesterId) },
        { createdBy: new Types.ObjectId(requesterId) }
      ];
    }

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    // DEBUG: First, let's see what the raw query returns
    const items = await this.feedbackModel.find(filter)
      .populate('user', 'email username name role')
      .populate('createdBy', 'email username name role')
      .populate('updatedBy', 'email username name role')
      .populate('reply.authorId', 'email username name role')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .exec();

    const total = await this.feedbackModel.countDocuments(filter);
    
    // DEBUG: Log what we actually get
    console.log('DEBUG - Items found:', items.length);
    items.forEach((item, index) => {
      console.log(`\nDEBUG - Item ${index + 1}:`);
      console.log('ID:', item._id);
      console.log('user field:', item.user);
      console.log('createdBy field:', item.createdBy);
      console.log('updatedBy field:', item.updatedBy);
      console.log('Type of user:', typeof item.user);
      console.log('Is user populated?', item.user && typeof item.user === 'object' && '_id' in item.user);
    });

    const feedbackItems = items.map(item => this.mapToResponseDto(item));

    return {
      items: feedbackItems,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    };
  } catch (error) {
    console.error('Find all feedback error:', error);
    throw new InternalServerErrorException('Failed to fetch feedback');
  }
}

  async findOne(id: string): Promise<FeedbackResponseDto> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid feedback ID');
      }

      const doc = await this.feedbackModel
        .findById(id)
        .populate('user', 'email username name role')
        .populate('createdBy', 'email username name role')
        .populate('updatedBy', 'email username name role')
        .populate('reply.authorId', 'email username name role')
        .exec();
      
      if (!doc) {
        throw new NotFoundException('Feedback not found');
      }

      return this.mapToResponseDto(doc);
    } catch (error) {
      console.error('Find one feedback error:', error);
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch feedback');
    }
  }

  async update(id: string, updateDto: UpdateFeedbackDto, requesterId?: string): Promise<FeedbackResponseDto> {
    try {
      const doc = await this.feedbackModel.findById(id);
      if (!doc) {
        throw new NotFoundException('Feedback not found');
      }

      // Check permissions
      const isOwner = doc.user && requesterId && doc.user.toString() === requesterId;
      const isCreator = doc.createdBy && requesterId && doc.createdBy.toString() === requesterId;
      
      if (!isOwner && !isCreator) {
        throw new ForbiddenException('You cannot update this feedback');
      }

      // Add updatedBy
      if (requesterId) {
        if (!Types.ObjectId.isValid(requesterId)) {
          throw new BadRequestException('Invalid user ID');
        }
        doc.updatedBy = new Types.ObjectId(requesterId);
      }

      // Update fields
      if (updateDto.subject !== undefined) doc.subject = updateDto.subject;
      if (updateDto.message !== undefined) doc.message = updateDto.message;

      await doc.save();

      // Get populated version
      const updatedFeedback = await this.feedbackModel
        .findById(id)
        .populate('user', 'email username name role')
        .populate('createdBy', 'email username name role')
        .populate('updatedBy', 'email username name role')
        .populate('reply.authorId', 'email username name role')
        .exec();

      if (!updatedFeedback) {
        throw new Error('Failed to load updated feedback');
      }

      return this.mapToResponseDto(updatedFeedback);
    } catch (error) {
      console.error('Update feedback error:', error);
      if (error instanceof NotFoundException || 
          error instanceof ForbiddenException || 
          error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update feedback');
    }
  }

  async adminUpdate(id: string, adminDto: AdminUpdateFeedbackDto, userId?: string): Promise<FeedbackResponseDto> {
    try {
      const doc = await this.feedbackModel.findById(id);
      if (!doc) {
        throw new NotFoundException('Feedback not found');
      }

      // Add updatedBy for admin
      if (userId) {
        if (!Types.ObjectId.isValid(userId)) {
          throw new BadRequestException('Invalid user ID');
        }
        doc.updatedBy = new Types.ObjectId(userId);
      }

      // Update fields
      if (adminDto.status !== undefined) doc.status = adminDto.status;
      if (adminDto.subject !== undefined) doc.subject = adminDto.subject;
      if (adminDto.message !== undefined) doc.message = adminDto.message;

      await doc.save();

      // Get populated version
      const updatedFeedback = await this.feedbackModel
        .findById(id)
        .populate('user', 'email username name role')
        .populate('createdBy', 'email username name role')
        .populate('updatedBy', 'email username name role')
        .populate('reply.authorId', 'email username name role')
        .exec();

      if (!updatedFeedback) {
        throw new Error('Failed to load updated feedback');
      }

      return this.mapToResponseDto(updatedFeedback);
    } catch (error) {
      console.error('Admin update feedback error:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update feedback');
    }
  }

  async remove(id: string, requesterId?: string, requesterRole?: string): Promise<void> {
    try {
      const doc = await this.feedbackModel.findById(id);
      if (!doc) {
        throw new NotFoundException('Feedback not found');
      }

      // Check permissions
      const isOwner = doc.user && requesterId && doc.user.toString() === requesterId;
      const isCreator = doc.createdBy && requesterId && doc.createdBy.toString() === requesterId;
      const isAdmin = requesterRole === 'admin' || requesterRole === 'superadmin' || requesterRole === 'user_admin';
      
      if (!isOwner && !isCreator && !isAdmin) {
        throw new ForbiddenException('Not allowed to delete');
      }

      // Add updatedBy for soft delete
      if (requesterId && Types.ObjectId.isValid(requesterId)) {
        doc.updatedBy = new Types.ObjectId(requesterId);
      }

      doc.isActive = false; // soft delete
      await doc.save();
    } catch (error) {
      console.error('Remove feedback error:', error);
      if (error instanceof NotFoundException || 
          error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete feedback');
    }
  }

  async replyToFeedback(id: string, message: string, authorId?: string, authorName?: string): Promise<FeedbackResponseDto> {
    try {
      const doc = await this.feedbackModel.findById(id);
      if (!doc) {
        throw new NotFoundException('Feedback not found');
      }

      if (!authorId) {
        throw new BadRequestException('Author ID is required for replies');
      }

      if (!Types.ObjectId.isValid(authorId)) {
        throw new BadRequestException('Invalid author ID');
      }

      const entry = {
        authorId: new Types.ObjectId(authorId),
        authorName: authorName || 'Admin',
        message,
        createdAt: new Date()
      };

      doc.reply = doc.reply || [];
      doc.reply.push(entry);

      // Add updatedBy
      doc.updatedBy = new Types.ObjectId(authorId);

      await doc.save();

      // Get populated version
      const updatedFeedback = await this.feedbackModel
        .findById(id)
        .populate('user', 'email username name role')
        .populate('createdBy', 'email username name role')
        .populate('updatedBy', 'email username name role')
        .populate('reply.authorId', 'email username name role')
        .exec();

      if (!updatedFeedback) {
        throw new Error('Failed to load feedback after reply');
      }

      return this.mapToResponseDto(updatedFeedback);
    } catch (error) {
      console.error('Reply to feedback error:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to add reply to feedback');
    }
  }

  async changeStatus(id: string, status: string, userId?: string): Promise<FeedbackResponseDto> {
    try {
      const doc = await this.feedbackModel.findById(id);
      if (!doc) {
        throw new NotFoundException('Feedback not found');
      }

      // Validate status
      if (!Object.values(FeedbackStatus).includes(status as FeedbackStatus)) {
        throw new BadRequestException('Invalid status value');
      }

      // Add updatedBy
      if (userId) {
        if (!Types.ObjectId.isValid(userId)) {
          throw new BadRequestException('Invalid user ID');
        }
        doc.updatedBy = new Types.ObjectId(userId);
      }

      doc.status = status as FeedbackStatus;
      await doc.save();

      // Get populated version
      const updatedFeedback = await this.feedbackModel
        .findById(id)
        .populate('user', 'email username name role')
        .populate('createdBy', 'email username name role')
        .populate('updatedBy', 'email username name role')
        .populate('reply.authorId', 'email username name role')
        .exec();

      if (!updatedFeedback) {
        throw new Error('Failed to load feedback after status change');
      }

      return this.mapToResponseDto(updatedFeedback);
    } catch (error) {
      console.error('Change feedback status error:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to change feedback status');
    }
  }

  async getStatistics(userId?: string): Promise<any> {
    try {
      const query: any = { isActive: true };
      
      if (userId && Types.ObjectId.isValid(userId)) {
        query.createdBy = new Types.ObjectId(userId);
      }

      const [total, byType, byStatus] = await Promise.all([
        this.feedbackModel.countDocuments(query),
        this.feedbackModel.aggregate([
          { $match: query },
          { $group: { _id: '$type', count: { $sum: 1 } } }
        ]),
        this.feedbackModel.aggregate([
          { $match: query },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ])
      ]);

      // Get recent feedback count
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentCount = await this.feedbackModel.countDocuments({
        ...query,
        createdAt: { $gte: thirtyDaysAgo }
      });

      // Get pending feedback count
      const pendingCount = await this.feedbackModel.countDocuments({
        ...query,
        status: FeedbackStatus.PENDING
      });

      return {
        total,
        recentCount,
        pendingCount,
        byType,
        byStatus
      };
    } catch (error) {
      console.error('Get statistics error:', error);
      throw new InternalServerErrorException('Failed to get feedback statistics');
    }
  }

  async getMyFeedback(userId: string, query?: any): Promise<{
    items: FeedbackResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }

      const { page = 1, limit = 10, status, type } = query || {};

      const filter: any = { 
        isActive: true,
        $or: [
          { user: new Types.ObjectId(userId) },
          { createdBy: new Types.ObjectId(userId) }
        ]
      };

      if (status) filter.status = status;
      if (type) filter.type = type;

      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 10;

      const [items, total] = await Promise.all([
        this.feedbackModel.find(filter)
          .populate('user', 'email username name role')
          .populate('createdBy', 'email username name role')
          .populate('updatedBy', 'email username name role')
          .populate('reply.authorId', 'email username name role')
          .sort({ createdAt: -1 })
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum)
          .exec(),
        this.feedbackModel.countDocuments(filter)
      ]);

      return {
        items: items.map(item => this.mapToResponseDto(item)),
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      };
    } catch (error) {
      console.error('Get my feedback error:', error);
      throw new InternalServerErrorException('Failed to fetch user feedback');
    }
  }
}