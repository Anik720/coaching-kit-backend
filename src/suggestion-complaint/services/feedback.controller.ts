import { 
  Controller, Get, Post, Body, Patch, Param, Delete, Query, 
  UseGuards, HttpCode, HttpStatus, UsePipes, 
  ValidationPipe, Req 
} from '@nestjs/common';
import { FeedbackService } from '../services/feedback.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CreateFeedbackDto } from '../dto/create-feedback.dto';
import { UserRole } from 'src/shared/interfaces/user.interface';
import { AdminUpdateFeedbackDto, UpdateFeedbackDto } from '../dto/update-feedback.dto';
import type { Request } from 'express';

@Controller('feedback')
@UsePipes(new ValidationPipe({ transform: true }))
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  // Public create (works with or without auth)
  @Post()
  async create(@Body() createDto: CreateFeedbackDto, @Req() req: Request) {
    const user = req.user as any;
    const userId = user?._id;
    
    // Use authenticated user info if available
    if (userId) {
      createDto.userName = createDto.userName || user.name || user.username;
      createDto.userEmail = createDto.userEmail || user.email;
      // Cannot be anonymous if logged in (unless specifically allowed)
      if (createDto.isAnonymous && user) {
        createDto.isAnonymous = false;
      }
    }
    return this.feedbackService.create(createDto, userId);
  }

  // Admin: get all with filters
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER_ADMIN, UserRole.SUPER_ADMIN)
  async findAllAdmin(@Query() query: any, @Req() req: Request) {
    const user = req.user as any;
    return this.feedbackService.findAll(query, user?.role, user?._id);
  }

  // Authenticated user's own feedback
  @Get('my-feedback')
  @UseGuards(JwtAuthGuard)
  async findMyFeedback(@Query() query: any, @Req() req: Request) {
    const user = req.user as any;
    if (!user || !user._id) {
      throw new Error('User authentication failed - no user ID found');
    }
    return this.feedbackService.getMyFeedback(user._id, query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string, @Req() req: Request) {
    return this.feedbackService.findOne(id);
  }

  // User update their own feedback
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() dto: UpdateFeedbackDto, @Req() req: Request) {
    const user = req.user as any;
    return this.feedbackService.update(id, dto, user?._id);
  }

  // Admin update
  @Patch(':id/admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER_ADMIN, UserRole.SUPER_ADMIN)
  async adminUpdate(@Param('id') id: string, @Body() dto: AdminUpdateFeedbackDto, @Req() req: Request) {
    const user = req.user as any;
    return this.feedbackService.adminUpdate(id, dto, user?._id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as any;
    return this.feedbackService.remove(id, user?._id, user?.role);
  }

  // Admin replies
  @Post(':id/reply')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER_ADMIN, UserRole.SUPER_ADMIN)
  async reply(@Param('id') id: string, @Body() body: { reply: string }, @Req() req: Request) {
    const user = req.user as any;
    return this.feedbackService.replyToFeedback(id, body.reply, user?._id, user?.name || user?.username);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER_ADMIN, UserRole.SUPER_ADMIN)
  async changeStatus(@Param('id') id: string, @Body() body: { status: string }, @Req() req: Request) {
    const user = req.user as any;
    return this.feedbackService.changeStatus(id, body.status, user?._id);
  }

  @Get('statistics/overview')
  @UseGuards(JwtAuthGuard)
  async getStatistics(@Req() req: Request) {
    const user = req.user as any;
    return this.feedbackService.getStatistics(user?._id);
  }

  @Get('my-stats/summary')
  @UseGuards(JwtAuthGuard)
  async getMyStatsSummary(@Req() req: Request) {
    const user = req.user as any;
    if (!user || !user._id) {
      throw new Error('User authentication failed - no user ID found');
    }
    return this.feedbackService.getStatistics(user._id);
  }

  // Public endpoint for anonymous feedback submission
  @Post('anonymous')
  async createAnonymous(@Body() createDto: CreateFeedbackDto) {
    // Force anonymous for this endpoint
    createDto.isAnonymous = true;
    return this.feedbackService.create(createDto, undefined);
  }

  // Get feedback created by specific user (admin only)
  @Get('user/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER_ADMIN, UserRole.SUPER_ADMIN)
  async getFeedbackByUser(
    @Param('userId') userId: string,
    @Query() query: any,
    @Req() req: Request
  ) {
    const user = req.user as any;
    const filter = {
      ...query,
      createdBy: userId
    };
    return this.feedbackService.findAll(filter, user?.role, user?._id);
  }
}