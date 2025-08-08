import { ApiProperty } from '@nestjs/swagger';
import { 
  IsEmail, 
  IsString, 
  IsEnum, 
  IsUUID, 
  IsOptional, 
  IsBoolean,
  MaxLength 
} from 'class-validator';

enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ORG_ADMIN = 'ORG_ADMIN',
  INSTRUCTOR = 'INSTRUCTOR',
  LEARNER = 'LEARNER',
}

export class CreateUserDto {
  @ApiProperty({ description: 'User email address', example: 'newuser@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({ description: 'First name', example: 'Jane' })
  @IsString()
  @MaxLength(50)
  first_name: string;

  @ApiProperty({ description: 'Last name', example: 'Smith' })
  @IsString()
  @MaxLength(50)
  last_name: string;

  @ApiProperty({ 
    description: 'User role', 
    enum: UserRole,
    example: UserRole.LEARNER 
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ 
    description: 'Organization ID', 
    example: '123e4567-e89b-12d3-a456-426614174001' 
  })
  @IsUUID()
  organization_id: string;

  @ApiProperty({ 
    description: 'Send invitation email', 
    example: true,
    required: false 
  })
  @IsOptional()
  @IsBoolean()
  send_invitation?: boolean;

  @ApiProperty({ 
    description: 'Temporary password', 
    example: 'temp123456',
    required: false 
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  temporary_password?: string;
}

