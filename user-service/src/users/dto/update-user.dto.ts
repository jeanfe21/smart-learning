import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsEnum, 
  IsUUID, 
  IsOptional,
  MaxLength 
} from 'class-validator';

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

export class UpdateUserDto {
  @ApiProperty({ description: 'First name', example: 'John', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  first_name?: string;

  @ApiProperty({ description: 'Last name', example: 'Doe', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  last_name?: string;

  @ApiProperty({ 
    description: 'User role', 
    enum: UserRole,
    example: UserRole.INSTRUCTOR,
    required: false 
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ 
    description: 'User status', 
    enum: UserStatus,
    example: UserStatus.ACTIVE,
    required: false 
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiProperty({ 
    description: 'Organization ID', 
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: false 
  })
  @IsOptional()
  @IsUUID()
  organization_id?: string;
}

