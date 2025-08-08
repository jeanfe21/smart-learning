import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { PrismaService } from '../prisma/prisma.service';
import { 
  UpdateProfileDto, 
  CreateUserDto, 
  UpdateUserDto,
  GetUsersQueryDto 
} from './dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        learning_preferences: true,
        learning_stats: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      success: true,
      data: {
        user_id: user.id,
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        organization_id: user.organization_id,
        subscription_id: user.subscription_id,
        profile_data: user.profile ? {
          avatar_url: user.profile.avatar_url,
          timezone: user.profile.timezone,
          language: user.profile.language,
          bio: user.profile.bio,
          phone_number: user.profile.phone_number,
          date_of_birth: user.profile.date_of_birth,
          address_line1: user.profile.address_line1,
          city: user.profile.city,
          country: user.profile.country,
          profile_visibility: user.profile.profile_visibility,
          show_email: user.profile.show_email,
        } : null,
        learning_preferences: user.learning_preferences ? {
          learning_style: {
            visual: user.learning_preferences.visual_score,
            auditory: user.learning_preferences.auditory_score,
            reading: user.learning_preferences.reading_score,
            kinesthetic: user.learning_preferences.kinesthetic_score,
          },
          preferred_content_types: user.learning_preferences.preferred_content_types,
          difficulty_preference: user.learning_preferences.difficulty_preference,
          pace_preference: user.learning_preferences.pace_preference,
        } : null,
        learning_stats: user.learning_stats ? {
          total_courses_enrolled: user.learning_stats.total_courses_enrolled,
          courses_completed: user.learning_stats.courses_completed,
          total_learning_time: user.learning_stats.total_learning_time,
          average_score: user.learning_stats.average_score,
          last_activity: user.learning_stats.last_activity,
        } : null,
        created_at: user.created_at,
        last_login: user.last_login,
        status: user.status,
      },
    };
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if username is already taken (if provided)
    if (updateProfileDto.username) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          username: updateProfileDto.username,
          id: { not: userId },
        },
      });

      if (existingUser) {
        throw new ConflictException('Username already taken');
      }
    }

    // Update user basic info
    const updateUserData: any = {};
    if (updateProfileDto.first_name) updateUserData.first_name = updateProfileDto.first_name;
    if (updateProfileDto.last_name) updateUserData.last_name = updateProfileDto.last_name;
    if (updateProfileDto.username) updateUserData.username = updateProfileDto.username;

    // Update profile data
    const updateProfileData: any = {};
    if (updateProfileDto.profile_data) {
      const pd = updateProfileDto.profile_data;
      if (pd.timezone) updateProfileData.timezone = pd.timezone;
      if (pd.language) updateProfileData.language = pd.language;
      if (pd.bio !== undefined) updateProfileData.bio = pd.bio;
      if (pd.phone_number !== undefined) updateProfileData.phone_number = pd.phone_number;
      if (pd.date_of_birth) updateProfileData.date_of_birth = new Date(pd.date_of_birth);
      if (pd.address_line1 !== undefined) updateProfileData.address_line1 = pd.address_line1;
      if (pd.city !== undefined) updateProfileData.city = pd.city;
      if (pd.country !== undefined) updateProfileData.country = pd.country;
      if (pd.profile_visibility) updateProfileData.profile_visibility = pd.profile_visibility;
      if (pd.show_email !== undefined) updateProfileData.show_email = pd.show_email;
    }

    // Update learning preferences
    const updateLearningPrefsData: any = {};
    if (updateProfileDto.learning_preferences) {
      const lp = updateProfileDto.learning_preferences;
      if (lp.learning_style) {
        if (lp.learning_style.visual !== undefined) updateLearningPrefsData.visual_score = lp.learning_style.visual;
        if (lp.learning_style.auditory !== undefined) updateLearningPrefsData.auditory_score = lp.learning_style.auditory;
        if (lp.learning_style.reading !== undefined) updateLearningPrefsData.reading_score = lp.learning_style.reading;
        if (lp.learning_style.kinesthetic !== undefined) updateLearningPrefsData.kinesthetic_score = lp.learning_style.kinesthetic;
      }
      if (lp.preferred_content_types) updateLearningPrefsData.preferred_content_types = lp.preferred_content_types;
      if (lp.difficulty_preference) updateLearningPrefsData.difficulty_preference = lp.difficulty_preference;
      if (lp.pace_preference) updateLearningPrefsData.pace_preference = lp.pace_preference;
    }

    // Perform updates in transaction
    await this.prisma.$transaction(async (tx) => {
      // Update user
      if (Object.keys(updateUserData).length > 0) {
        await tx.user.update({
          where: { id: userId },
          data: updateUserData,
        });
      }

      // Update or create profile
      if (Object.keys(updateProfileData).length > 0) {
        await tx.userProfile.upsert({
          where: { user_id: userId },
          update: updateProfileData,
          create: {
            user_id: userId,
            ...updateProfileData,
          },
        });
      }

      // Update or create learning preferences
      if (Object.keys(updateLearningPrefsData).length > 0) {
        await tx.learningPreferences.upsert({
          where: { user_id: userId },
          update: updateLearningPrefsData,
          create: {
            user_id: userId,
            ...updateLearningPrefsData,
          },
        });
      }
    });

    return {
      success: true,
      data: {
        user_id: userId,
        message: 'Profile updated successfully',
      },
    };
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only JPEG, PNG, and GIF are allowed.');
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size too large. Maximum size is 5MB.');
    }

    // TODO: Upload to cloud storage (S3, CloudFront, etc.)
    // For now, we'll simulate the upload
    const avatarUrl = `https://cdn.smartlearning.com/avatars/${userId}_${Date.now()}.${file.originalname.split('.').pop()}`;

    // Update user profile with avatar URL
    await this.prisma.userProfile.upsert({
      where: { user_id: userId },
      update: { avatar_url: avatarUrl },
      create: {
        user_id: userId,
        avatar_url: avatarUrl,
      },
    });

    return {
      success: true,
      data: {
        avatar_url: avatarUrl,
      },
      message: 'Avatar uploaded successfully',
    };
  }

  async getUsers(query: GetUsersQueryDto) {
    const { page = 1, per_page = 20, search, role, status, organization_id } = query;
    const skip = (page - 1) * per_page;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (role) where.role = role;
    if (status) where.status = status;
    if (organization_id) where.organization_id = organization_id;

    // Get users and total count
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: per_page,
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          role: true,
          organization_id: true,
          status: true,
          created_at: true,
          last_login: true,
        },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / per_page);

    return {
      success: true,
      data: users.map(user => ({
        user_id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        organization_id: user.organization_id,
        status: user.status,
        created_at: user.created_at,
        last_login: user.last_login,
      })),
      meta: {
        pagination: {
          page,
          per_page,
          total,
          total_pages: totalPages,
        },
      },
    };
  }

  async createUser(createUserDto: CreateUserDto) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        first_name: createUserDto.first_name,
        last_name: createUserDto.last_name,
        role: createUserDto.role,
        organization_id: createUserDto.organization_id,
        status: 'PENDING',
      },
    });

    // Create default learning stats
    await this.prisma.learningStats.create({
      data: {
        user_id: user.id,
      },
    });

    // TODO: Send invitation email if requested
    if (createUserDto.send_invitation) {
      console.log(`📧 Invitation email sent to ${createUserDto.email}`);
    }

    return {
      success: true,
      data: {
        user_id: user.id,
        email: user.email,
        invitation_sent: createUserDto.send_invitation || false,
      },
      message: 'User created successfully',
    };
  }

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        learning_preferences: true,
        learning_stats: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      success: true,
      data: {
        user_id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        organization_id: user.organization_id,
        subscription_id: user.subscription_id,
        profile_data: user.profile || {},
        learning_preferences: user.learning_preferences || {},
        learning_stats: user.learning_stats ? {
          total_courses_enrolled: user.learning_stats.total_courses_enrolled,
          courses_completed: user.learning_stats.courses_completed,
          total_learning_time: user.learning_stats.total_learning_time,
          average_score: user.learning_stats.average_score,
          last_activity: user.learning_stats.last_activity,
        } : {},
        created_at: user.created_at,
        status: user.status,
      },
    };
  }

  async updateUser(userId: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateUserDto,
    });

    return {
      success: true,
      data: {
        user_id: updatedUser.id,
        message: 'User updated successfully',
      },
    };
  }

  async deleteUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Soft delete by setting status to INACTIVE
    await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'INACTIVE' },
    });

    return {
      success: true,
      message: 'User deleted successfully',
    };
  }
}

