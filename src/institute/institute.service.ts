import { 
  Injectable, 
  NotFoundException, 
  ConflictException, 
  BadRequestException,
  InternalServerErrorException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Institute, InstituteDocument } from './schemas/institute.schema';
import { CreateInstituteDto } from './dto/create-institute.dto';
import { UpdateInstituteDto } from './dto/update-institute.dto';
import { 
  IInstitute, 
  IInstituteStats, 
  InstituteQuery 
} from './interfaces/institute.interface';

@Injectable()
export class InstituteService {
  constructor(
    @InjectModel(Institute.name) private instituteModel: Model<InstituteDocument>,
  ) {}

  /**
   * Create a new institute
   */
  async create(createInstituteDto: CreateInstituteDto): Promise<Institute> {
    try {
      // Check for duplicate institute name
      const existingByName = await this.instituteModel.findOne({
        instituteName: createInstituteDto.instituteName,
      }).exec();

      if (existingByName) {
        throw new ConflictException('Institute with this name already exists');
      }

      // Check for duplicate email
      const existingByEmail = await this.instituteModel.findOne({
        email: createInstituteDto.email,
      }).exec();

      if (existingByEmail) {
        throw new ConflictException('Institute with this email already exists');
      }

      // Parse establishment date if provided
      let establishmentDate: Date | null = null; // Explicitly type it
      if (createInstituteDto.establishmentDate) {
        establishmentDate = new Date(createInstituteDto.establishmentDate);
        if (isNaN(establishmentDate.getTime())) {
          throw new BadRequestException('Invalid establishment date');
        }
      }

      const newInstitute = new this.instituteModel({
        ...createInstituteDto,
        establishmentDate,
      });

      const savedInstitute = await newInstitute.save();
      return savedInstitute;
    } catch (error) {
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw new ConflictException(`Institute with this ${field} already exists`);
      }
      throw error;
    }
  }

  /**
   * Find all institutes with filtering and pagination
   */
  async findAll(query?: InstituteQuery): Promise<{
    data: Institute[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { 
      search, 
      isActive, 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = query || {};
    
    const filter: any = {};
    
    // Search filter
    if (search) {
      filter.$or = [
        { instituteName: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { principalName: { $regex: search, $options: 'i' } },
      ];
    }
    
    // Active status filter
    if (isActive !== undefined) {
      filter.isActive = isActive === true;
    }
    
    // Pagination calculations
    const currentPage = Math.max(1, Number(page));
    const pageSize = Math.max(1, Math.min(100, Number(limit)));
    const skip = (currentPage - 1) * pageSize;
    
    // Sorting
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Execute queries in parallel for better performance
    const [data, total] = await Promise.all([
      this.instituteModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(pageSize)
        .exec(),
      this.instituteModel.countDocuments(filter).exec(),
    ]);
    
    return {
      data,
      total,
      page: currentPage,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Find a single institute by ID
   */
  async findOne(id: string): Promise<Institute> {
    if (!this.isValidObjectId(id)) {
      throw new BadRequestException('Invalid institute ID');
    }

    const institute = await this.instituteModel.findById(id).exec();
    
    if (!institute) {
      throw new NotFoundException('Institute not found');
    }
    
    return institute;
  }

  /**
   * Find institute by email
   */
  async findByEmail(email: string): Promise<Institute | null> {
    const institute = await this.instituteModel
      .findOne({ email: email.toLowerCase().trim() })
      .exec();
    
    return institute;
  }

  /**
   * Update an institute
   */
  async update(id: string, updateInstituteDto: UpdateInstituteDto): Promise<Institute> {
    if (!this.isValidObjectId(id)) {
      throw new BadRequestException('Invalid institute ID');
    }

    // Check if institute exists
    const existingInstitute = await this.instituteModel.findById(id).exec();
    if (!existingInstitute) {
      throw new NotFoundException('Institute not found');
    }

    // Check for duplicate institute name if updating
    if (updateInstituteDto.instituteName) {
      const duplicateName = await this.instituteModel.findOne({
        instituteName: updateInstituteDto.instituteName,
        _id: { $ne: id }
      }).exec();

      if (duplicateName) {
        throw new ConflictException('Institute with this name already exists');
      }
    }

    // Check for duplicate email if updating
    if (updateInstituteDto.email) {
      const duplicateEmail = await this.instituteModel.findOne({
        email: updateInstituteDto.email.toLowerCase().trim(),
        _id: { $ne: id }
      }).exec();

      if (duplicateEmail) {
        throw new ConflictException('Institute with this email already exists');
      }
    }

    // Parse establishment date if provided
    const updateData: any = { ...updateInstituteDto };
    if (updateInstituteDto.establishmentDate) {
      const establishmentDate = new Date(updateInstituteDto.establishmentDate);
      if (isNaN(establishmentDate.getTime())) {
        throw new BadRequestException('Invalid establishment date');
      }
      updateData.establishmentDate = establishmentDate;
    }

    // Convert email to lowercase if provided
    if (updateInstituteDto.email) {
      updateData.email = updateInstituteDto.email.toLowerCase().trim();
    }

    const updatedInstitute = await this.instituteModel
      .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .exec();

    if (!updatedInstitute) {
      throw new NotFoundException('Institute not found after update');
    }

    return updatedInstitute;
  }

  /**
   * Delete an institute
   */
  async remove(id: string): Promise<{ message: string; deletedInstitute: Institute }> {
    if (!this.isValidObjectId(id)) {
      throw new BadRequestException('Invalid institute ID');
    }

    const deletedInstitute = await this.instituteModel
      .findByIdAndDelete(id)
      .exec();
    
    if (!deletedInstitute) {
      throw new NotFoundException('Institute not found');
    }

    return { 
      message: 'Institute deleted successfully',
      deletedInstitute 
    };
  }

  /**
   * Toggle institute active status
   */
  async toggleActive(id: string): Promise<Institute> {
    if (!this.isValidObjectId(id)) {
      throw new BadRequestException('Invalid institute ID');
    }

    const institute = await this.instituteModel.findById(id).exec();
    
    if (!institute) {
      throw new NotFoundException('Institute not found');
    }

    // Toggle active status
    institute.isActive = !institute.isActive;
    
    // Save the changes
    await institute.save();
    
    return institute;
  }

  /**
   * Get institute statistics
   */
  async getStats(): Promise<IInstituteStats> {
    const [
      totalInstitutes,
      activeInstitutes,
      institutesWithPhone,
      latestEstablishment,
      oldestEstablishment
    ] = await Promise.all([
      this.instituteModel.countDocuments().exec(),
      this.instituteModel.countDocuments({ isActive: true }).exec(),
      this.instituteModel.find({ phone: { $ne: null } }).select('phone').exec(),
      this.instituteModel
        .findOne({ establishmentDate: { $ne: null } })
        .sort({ establishmentDate: -1 })
        .select('establishmentDate')
        .exec(),
      this.instituteModel
        .findOne({ establishmentDate: { $ne: null } })
        .sort({ establishmentDate: 1 })
        .select('establishmentDate')
        .exec(),
    ]);

    return {
      totalInstitutes,
      activeInstitutes,
      totalPhoneContacts: institutesWithPhone.length,
      latestEstablishment: latestEstablishment?.establishmentDate || undefined,
      oldestEstablishment: oldestEstablishment?.establishmentDate || undefined,
    };
  }

  /**
   * Update profile picture
   */
  async updateProfilePicture(id: string, filename: string, url?: string): Promise<Institute> {
    if (!this.isValidObjectId(id)) {
      throw new BadRequestException('Invalid institute ID');
    }

    const updateData: any = { profilePicture: filename };
    if (url) {
      updateData.profilePictureUrl = url;
    }

    const updatedInstitute = await this.instituteModel
      .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .exec();

    if (!updatedInstitute) {
      throw new NotFoundException('Institute not found');
    }

    return updatedInstitute;
  }

  /**
   * Get active institutes only
   */
  async findActiveInstitutes(): Promise<Institute[]> {
    return this.instituteModel
      .find({ isActive: true })
      .sort({ instituteName: 1 })
      .exec();
  }

  /**
   * Search institutes by various criteria
   */
  async searchInstitutes(criteria: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
  }): Promise<Institute[]> {
    const filter: any = {};
    
    if (criteria.name) {
      filter.instituteName = { $regex: criteria.name, $options: 'i' };
    }
    
    if (criteria.email) {
      filter.email = { $regex: criteria.email, $options: 'i' };
    }
    
    if (criteria.phone) {
      filter.phone = { $regex: criteria.phone, $options: 'i' };
    }
    
    if (criteria.address) {
      filter.address = { $regex: criteria.address, $options: 'i' };
    }
    
    return this.instituteModel
      .find(filter)
      .sort({ instituteName: 1 })
      .limit(50)
      .exec();
  }

  /**
   * Validate ObjectId
   */
  private isValidObjectId(id: string): boolean {
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    return objectIdPattern.test(id);
  }

  /**
   * Get institute count
   */
  async count(): Promise<number> {
    return this.instituteModel.countDocuments().exec();
  }
}