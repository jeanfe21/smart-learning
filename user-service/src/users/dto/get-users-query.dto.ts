import { ApiProperty } from '@nestjs/swagger';
import { 
  IsOptional, 
  IsString, 
  IsEnum, 
  IsUUID,
  IsNumberString,
  Min,
  Max 
} from 'class-validator';
import { Transform } from 'class-transformer';

enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ORG_ADMIN = 'ORG_ADMIN',
  INSTRUCTOR = 'INSTRUCTOR',
  LEARNER = 'LEARNER',
}

enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING',
}

export class GetUsersQueryDto {
  @ApiProperty({ 
    description: 'Page number', 
    example: 1, 
    required: false,
    default: 1 
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @Min(1)
  page?: number = 1;

  @ApiProperty({ 
    description: 'Items per page', 
    example: 20, 
    required: false,
    default: 20,
    maximum: 100 
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @Min(1)
  @Max(100)
  per_page?: number = 20;

  @ApiProperty({ 
    description: 'Search term for name or email', 
    example: 'john',
    required: false 
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ 
    description: 'Filter by user role', 
    enum: UserRole,
    required: false 
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ 
    description: 'Filter by user status', 
    enum: UserStatus,
    required: false 
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiProperty({ 
    description: 'Filter by organization ID', 
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: false 
  })
  @IsOptional()
  @IsUUID()
  organization_id?: string;
}

