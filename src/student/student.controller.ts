// student/student.controller.ts
import { 
  Controller, Get, Post, Body, Patch, Param, Delete, 
  Query, UsePipes, ValidationPipe, HttpCode, HttpStatus 
} from '@nestjs/common';
import { StudentService } from './student.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentResponseDto } from './dto/student-response.dto';

@Controller('students')
@UsePipes(new ValidationPipe({ transform: true }))
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
  async create(@Body() createStudentDto: CreateStudentDto): Promise<StudentResponseDto> {
    return this.studentService.create(createStudentDto);
  }

  @Get()
  async findAll(@Query() query: any): Promise<StudentResponseDto[]> {
    return this.studentService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<StudentResponseDto> {
    return this.studentService.findOne(id);
  }

  @Get('registration/:registrationId')
  async findByRegistrationId(
    @Param('registrationId') registrationId: string
  ): Promise<StudentResponseDto> {
    return this.studentService.findByRegistrationId(registrationId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto
  ): Promise<StudentResponseDto> {
    return this.studentService.update(id, updateStudentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.studentService.remove(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; isActive: boolean }
  ): Promise<StudentResponseDto> {
    return this.studentService.updateStatus(id, body.status, body.isActive);
  }

  @Post(':id/payment')
  async makePayment(
    @Param('id') id: string,
    @Body() body: { amount: number }
  ): Promise<StudentResponseDto> {
    return this.studentService.makePayment(id, body.amount);
  }

  @Get('statistics/overview')
  async getStatistics(): Promise<any> {
    return this.studentService.getStatistics();
  }
}