// src/suggestion-complaint/controllers/feedback.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, HttpCode, HttpStatus, UsePipes, ValidationPipe } from '@nestjs/common';
import { FeedbackService } from '../services/feedback.service';


import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';          // adjust paths
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CreateFeedbackDto } from '../dto/create-feedback.dto';
import { UserRole } from 'src/shared/interfaces/user.interface';
import { AdminUpdateFeedbackDto, UpdateFeedbackDto } from '../dto/update-feedback.dto';

@Controller('feedback')
@UsePipes(new ValidationPipe({ transform: true }))
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  // Public create (works with or without auth)
  @Post()
  async create(@Body() createDto: CreateFeedbackDto, @Request() req?: any) {
    const userId = req?.user?.userId;
    // prefer server-side name/email if auth exists
    if (userId) {
      // override incoming name/email with authenticated user info if present
      createDto.userName = createDto.userName || req.user?.name;
      createDto.userEmail = createDto.userEmail || req.user?.email;
      createDto.isAnonymous = createDto.isAnonymous && !req.user; // cannot be anonymous if logged in unless you want to allow
    }
    return this.feedbackService.create(createDto, userId);
  }

  // Admin: get all
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER_ADMIN, UserRole.SUPER_ADMIN)
  async findAllAdmin(@Query() query: any, @Request() req: any) {
    return this.feedbackService.findAll(query, req.user?.role, req.user?.userId);
  }

  // Authenticated user's own list
  @Get('my-feedback')
  @UseGuards(JwtAuthGuard)
  async findMyFeedback(@Query() query: any, @Request() req: any) {
    return this.feedbackService.findAll({ ...query, my: true }, req.user?.role, req.user?.userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.feedbackService.findOne(id);
  }

  // user update their own feedback
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() dto: UpdateFeedbackDto, @Request() req: any) {
    return this.feedbackService.update(id, dto, req.user?.userId);
  }

  // Admin update
  @Patch(':id/admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER_ADMIN, UserRole.SUPER_ADMIN)
  async adminUpdate(@Param('id') id: string, @Body() dto: AdminUpdateFeedbackDto) {
    return this.feedbackService.adminUpdate(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Request() req: any) {
    return this.feedbackService.remove(id, req.user?.userId, req.user?.role);
  }

  // admin replies
  @Post(':id/reply')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER_ADMIN, UserRole.SUPER_ADMIN)
  async reply(@Param('id') id: string, @Body() body: { reply: string }, @Request() req: any) {
    return this.feedbackService.replyToFeedback(id, body.reply, req.user?.userId, req.user?.name);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER_ADMIN, UserRole.SUPER_ADMIN)
  async changeStatus(@Param('id') id: string, @Body() body: { status: string }, @Request() req: any) {
    return this.feedbackService.changeStatus(id, body.status, req.user?.userId);
  }

  @Get('statistics/overview')
  @UseGuards(JwtAuthGuard)
  async getStatistics(@Request() req: any) {
    return this.feedbackService.getStatistics();
  }
}
