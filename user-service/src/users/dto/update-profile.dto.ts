import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsOptional, 
  IsEmail, 
  IsEnum, 
  IsArray, 
  IsNumber, 
  Min, 
  Max,
  IsBoolean,
  IsDateString,
  MaxLength 
} from 'class-validator';

enum DifficultyLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT',
}

enum PacePreference {
  SLOW = 'SLOW',
  MODERATE = 'MODERATE',
  FAST = 'FAST',
  SELF_PACED = 'SELF_PACED',
}

enum ProfileVisibility {
  PUBLIC = 'PUBLIC',
  ORGANIZATION = 'ORGANIZATION',
  PRIVATE = 'PRIVATE',
}

class LearningStyleDto {
  @ApiProperty({ description: 'Visual learning score (0.0 to 1.0)', example: 0.8 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  visual?: number;

  @ApiProperty({ description: 'Auditory learning score (0.0 to 1.0)', example: 0.6 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  auditory?: number;

  @ApiProperty({ description: 'Reading learning score (0.0 to 1.0)', example: 0.7 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  reading?: number;

  @ApiProperty({ description: 'Kinesthetic learning score (0.0 to 1.0)', example: 0.4 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  kinesthetic?: number;
}

class LearningPreferencesDto {
  @ApiProperty({ description: 'Learning style scores', type: LearningStyleDto })
  @IsOptional()
  learning_style?: LearningStyleDto;

  @ApiProperty({ 
    description: 'Preferred content types', 
    example: ['video', 'interactive'],
    isArray: true 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferred_content_types?: string[];

  @ApiProperty({ 
    description: 'Difficulty preference', 
    enum: DifficultyLevel,
    example: DifficultyLevel.INTERMEDIATE 
  })
  @IsOptional()
  @IsEnum(DifficultyLevel)
  difficulty_preference?: DifficultyLevel;

  @ApiProperty({ 
    description: 'Pace preference', 
    enum: PacePreference,
    example: PacePreference.MODERATE 
  })
  @IsOptional()
  @IsEnum(PacePreference)
  pace_preference?: PacePreference;
}

class ProfileDataDto {
  @ApiProperty({ description: 'User timezone', example: 'America/New_York' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({ description: 'User language', example: 'en' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiProperty({ description: 'User bio', example: 'Passionate learner interested in technology' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiProperty({ description: 'Phone number', example: '+1234567890' })
  @IsOptional()
  @IsString()
  phone_number?: string;

  @ApiProperty({ description: 'Date of birth', example: '1990-01-01' })
  @IsOptional()
  @IsDateString()
  date_of_birth?: string;

  @ApiProperty({ description: 'Address line 1', example: '123 Main St' })
  @IsOptional()
  @IsString()
  address_line1?: string;

  @ApiProperty({ description: 'City', example: 'New York' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ description: 'Country', example: 'United States' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ 
    description: 'Profile visibility', 
    enum: ProfileVisibility,
    example: ProfileVisibility.ORGANIZATION 
  })
  @IsOptional()
  @IsEnum(ProfileVisibility)
  profile_visibility?: ProfileVisibility;

  @ApiProperty({ description: 'Show email in profile', example: false })
  @IsOptional()
  @IsBoolean()
  show_email?: boolean;
}

export class UpdateProfileDto {
  @ApiProperty({ description: 'First name', example: 'John' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  first_name?: string;

  @ApiProperty({ description: 'Last name', example: 'Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  last_name?: string;

  @ApiProperty({ description: 'Username', example: 'johndoe' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  username?: string;

  @ApiProperty({ description: 'Profile data', type: ProfileDataDto })
  @IsOptional()
  profile_data?: ProfileDataDto;

  @ApiProperty({ description: 'Learning preferences', type: LearningPreferencesDto })
  @IsOptional()
  learning_preferences?: LearningPreferencesDto;
}

