import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import {
  IUser,
  UserRole,
  CreateUserDto,
  UpdateUserDto,
} from '../shared/interfaces/user.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private configService: ConfigService,
  ) {}

  private toIUser(doc: any): IUser {
    try {
      const obj = doc.toObject ? doc.toObject() : doc;
      const result = { ...obj } as any;
      
      // Preserve both _id and id fields for compatibility
      if (obj._id) {
        const idString = obj._id.toString();
        result._id = idString;
        result.id = idString;
      }
      
      // Clean up unwanted fields
      delete result.__v;
      
      // Only remove password if it exists (don't break Mongoose select('+password'))
      if ('password' in result) {
        delete result.password;
      }
      
      return result as IUser;
    } catch (error) {
      console.error('Error converting to IUser:', error, doc);
      throw new InternalServerErrorException('Error processing user data');
    }
  }

  private canManage(actor: IUser, target: UserDocument): boolean {
    if (actor.role === UserRole.SUPER_ADMIN) return true;

    if (actor.role === UserRole.USER_ADMIN) {
      if (target.role === UserRole.SUPER_ADMIN) return false;
      if (target.role === UserRole.USER_ADMIN && target._id.toString() !== actor._id?.toString()) return false;
      if (target.role === UserRole.STAFF && target.adminId?.toString() !== actor._id?.toString()) return false;
      return true;
    }

    return target._id.toString() === actor._id?.toString();
  }

  private validateRoleAssignment(targetRole: UserRole, currentUser?: IUser): void {
    if (!currentUser) {
      if (targetRole !== UserRole.STAFF) {
        throw new ForbiddenException('Only staff role allowed during registration');
      }
      return;
    }

    if (currentUser.role === UserRole.STAFF) {
      throw new ForbiddenException('Staff cannot create users');
    }

    if (currentUser.role === UserRole.USER_ADMIN && targetRole !== UserRole.STAFF) {
      throw new ForbiddenException('User admin can only create staff');
    }
  }

  async create(dto: CreateUserDto, currentUser?: IUser): Promise<IUser> {
    try {
      console.log('Creating user with email:', dto.email);
      console.log('Current user:', currentUser ? currentUser.email : 'none');

      const existing = await this.userModel.findOne({ email: dto.email.toLowerCase() });
      if (existing) {
        console.log('Email already exists:', dto.email);
        throw new ConflictException('Email already exists');
      }

      if (dto.role) {
        console.log('Validating role assignment:', dto.role);
        this.validateRoleAssignment(dto.role, currentUser);
      }

      if (dto.role === UserRole.STAFF && currentUser) {
        dto.adminId = currentUser._id as any;
      }

      console.log('Creating user in database...');
      const user = await this.userModel.create(dto);
      console.log('User created successfully:', user.email);

      return this.toIUser(user);
    } catch (error) {
      console.error('User creation error:', error);
      if (error instanceof ConflictException || 
          error instanceof ForbiddenException ||
          error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('User creation failed');
    }
  }

  async findAll(currentUser?: IUser): Promise<IUser[]> {
    try {
      let filter: any = {};

      if (currentUser) {
        if (currentUser.role === UserRole.USER_ADMIN) {
          filter = {
            $or: [
              { _id: currentUser._id },
              { adminId: currentUser._id },
              { role: UserRole.STAFF, adminId: null },
            ],
          };
        } else if (currentUser.role === UserRole.STAFF) {
          filter = { _id: currentUser._id };
        }
      }

      const users = await this.userModel.find(filter);
      return users.map(u => this.toIUser(u));
    } catch (error) {
      console.error('Find all users error:', error);
      throw new InternalServerErrorException('Failed to fetch users');
    }
  }

  async findOne(id: string): Promise<IUser> {
    try {
      if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid ID');
      
      const user = await this.userModel.findById(id);
      if (!user) throw new NotFoundException('User not found');
      
      return this.toIUser(user);
    } catch (error) {
      console.error('Find one user error:', error);
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch user');
    }
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    try {
      return this.userModel.findOne({ email: email.toLowerCase().trim() }).select('+password');
    } catch (error) {
      console.error('Find by email error:', error);
      throw new InternalServerErrorException('Failed to find user by email');
    }
  }

  async update(id: string, dto: UpdateUserDto, currentUser: IUser): Promise<IUser> {
    try {
      if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid ID');

      const user = await this.userModel.findById(id);
      if (!user) throw new NotFoundException('User not found');
      if (!this.canManage(currentUser, user)) throw new ForbiddenException('Forbidden');

      if (dto.role && currentUser.role !== UserRole.SUPER_ADMIN) delete dto.role;

      if (dto.newPassword) {
        if (!dto.currentPassword) throw new BadRequestException('Current password required');
        const valid = await user.validatePassword(dto.currentPassword);
        if (!valid) throw new BadRequestException('Wrong current password');
        await user.updatePassword(dto.newPassword);
        delete dto.currentPassword;
        delete dto.newPassword;
      }

      Object.assign(user, dto);
      await user.save();
      return this.toIUser(user);
    } catch (error) {
      console.error('Update user error:', error);
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException ||
          error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update user');
    }
  }

  async remove(id: string, currentUser: IUser) {
    try {
      if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid ID');
      
      const user = await this.userModel.findById(id);
      if (!user) throw new NotFoundException('User not found');

      if (user._id.toString() === currentUser._id?.toString()) {
        throw new BadRequestException('Cannot delete own account');
      }
      
      if (!this.canManage(currentUser, user)) throw new ForbiddenException('Forbidden');

      await user.deleteOne();
      return { message: 'User deleted successfully' };
    } catch (error) {
      console.error('Delete user error:', error);
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException ||
          error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete user');
    }
  }

  async createSuperAdmin(): Promise<void> {
    try {
      const email = this.configService.get<string>('SUPER_ADMIN_EMAIL');
      const password = this.configService.get<string>('SUPER_ADMIN_PASSWORD');
      
      if (!email || !password) {
        console.log('Super admin credentials not configured');
        return;
      }

      const exists = await this.userModel.findOne({ email, role: UserRole.SUPER_ADMIN });
      if (!exists) {
        await this.userModel.create({
          email,
          password,
          role: UserRole.SUPER_ADMIN,
          designation: 'Founder',
          username: 'superadmin',
        });
        console.log('Super Admin created:', email);
      } else {
        console.log('Super Admin already exists:', email);
      }
    } catch (err) {
      console.error('Super admin creation failed:', err);
    }
  }

  async count(): Promise<number> {
    try {
      return this.userModel.countDocuments();
    } catch (error) {
      console.error('Count users error:', error);
      throw new InternalServerErrorException('Failed to count users');
    }
  }

  async findByRole(role: UserRole): Promise<IUser[]> {
    try {
      const users = await this.userModel.find({ role });
      return users.map(u => this.toIUser(u));
    } catch (error) {
      console.error('Find by role error:', error);
      throw new InternalServerErrorException('Failed to fetch users by role');
    }
  }

  async findStaffByAdmin(adminId: string): Promise<IUser[]> {
    try {
      if (!Types.ObjectId.isValid(adminId)) throw new BadRequestException('Invalid admin ID');
      
      const users = await this.userModel.find({ 
        role: UserRole.STAFF, 
        adminId: new Types.ObjectId(adminId) 
      });
      return users.map(u => this.toIUser(u));
    } catch (error) {
      console.error('Find staff by admin error:', error);
      throw new InternalServerErrorException('Failed to fetch staff by admin');
    }
  }
}