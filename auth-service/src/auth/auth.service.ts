import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto';

interface RequestContext {
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto, context: RequestContext) {
    const { email, password } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        password_hash: passwordHash,
        status: 'PENDING_VERIFICATION',
      },
    });

    // Generate email verification token
    const verificationToken = this.generateSecureToken();
    const tokenHash = this.hashToken(verificationToken);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

    await this.prisma.emailVerification.create({
      data: {
        email,
        token_hash: tokenHash,
        expires_at: expiresAt,
        ip_address: context.ip,
        user_agent: context.userAgent,
      },
    });

    // TODO: Send verification email
    console.log(`📧 Email verification token for ${email}: ${verificationToken}`);

    return {
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      data: {
        user_id: user.id,
        email: user.email,
        status: user.status,
      },
    };
  }

  async login(loginDto: LoginDto, context: RequestContext) {
    const { email, password } = loginDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is locked
    if (user.locked_until && user.locked_until > new Date()) {
      throw new ForbiddenException('Account is temporarily locked. Please try again later.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      // Increment failed login attempts
      await this.handleFailedLogin(user.id);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if email is verified
    if (user.status === 'PENDING_VERIFICATION') {
      throw new UnauthorizedException('Please verify your email address before logging in');
    }

    // Check if account is active
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }

    // Reset failed login attempts and update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failed_login_attempts: 0,
        locked_until: null,
        last_login_at: new Date(),
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id);

    // Create session
    const sessionToken = this.generateSecureToken();
    const sessionExpiresAt = new Date();
    sessionExpiresAt.setDate(sessionExpiresAt.getDate() + 7); // 7 days

    await this.prisma.userSession.create({
      data: {
        user_id: user.id,
        session_token: sessionToken,
        ip_address: context.ip,
        user_agent: context.userAgent,
        expires_at: sessionExpiresAt,
      },
    });

    return {
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          status: user.status,
          last_login_at: user.last_login_at,
        },
        tokens,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_SECRET'),
      });

      // Check if refresh token exists in database
      const tokenHash = this.hashToken(refreshToken);
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { token_hash: tokenHash },
        include: { user: true },
      });

      if (!storedToken || storedToken.revoked || storedToken.expires_at < new Date()) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(storedToken.user_id);

      // Revoke old refresh token
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revoked: true, revoked_at: new Date() },
      });

      return {
        success: true,
        message: 'Token refreshed successfully',
        data: { tokens },
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    // Revoke all refresh tokens for user
    await this.prisma.refreshToken.updateMany({
      where: { user_id: userId, revoked: false },
      data: { revoked: true, revoked_at: new Date() },
    });

    // End all active sessions
    await this.prisma.userSession.updateMany({
      where: { user_id: userId, is_active: true },
      data: { is_active: false, ended_at: new Date() },
    });

    return {
      success: true,
      message: 'Logout successful',
    };
  }

  async forgotPassword(email: string, context: RequestContext) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return {
        success: true,
        message: 'If the email exists, a password reset link has been sent.',
      };
    }

    // Generate reset token
    const resetToken = this.generateSecureToken();
    const tokenHash = this.hashToken(resetToken);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour

    await this.prisma.passwordReset.create({
      data: {
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
        ip_address: context.ip,
        user_agent: context.userAgent,
      },
    });

    // TODO: Send password reset email
    console.log(`🔑 Password reset token for ${email}: ${resetToken}`);

    return {
      success: true,
      message: 'If the email exists, a password reset link has been sent.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = this.hashToken(token);
    
    const resetRecord = await this.prisma.passwordReset.findUnique({
      where: { token_hash: tokenHash },
      include: { user: true },
    });

    if (!resetRecord || resetRecord.used || resetRecord.expires_at < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash new password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password and mark token as used
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetRecord.user_id },
        data: { password_hash: passwordHash },
      }),
      this.prisma.passwordReset.update({
        where: { id: resetRecord.id },
        data: { used: true, used_at: new Date() },
      }),
    ]);

    // Revoke all existing refresh tokens
    await this.prisma.refreshToken.updateMany({
      where: { user_id: resetRecord.user_id, revoked: false },
      data: { revoked: true, revoked_at: new Date() },
    });

    return {
      success: true,
      message: 'Password reset successful',
    };
  }

  async verifyEmail(token: string) {
    const tokenHash = this.hashToken(token);
    
    const verificationRecord = await this.prisma.emailVerification.findUnique({
      where: { token_hash: tokenHash },
    });

    if (!verificationRecord || verificationRecord.verified || verificationRecord.expires_at < new Date()) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    // Update user status and mark verification as complete
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { email: verificationRecord.email },
        data: { 
          status: 'ACTIVE',
          email_verified: true,
          email_verified_at: new Date(),
        },
      }),
      this.prisma.emailVerification.update({
        where: { id: verificationRecord.id },
        data: { verified: true, verified_at: new Date() },
      }),
    ]);

    return {
      success: true,
      message: 'Email verified successfully',
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        status: true,
        email_verified: true,
        created_at: true,
        last_login_at: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      success: true,
      data: user,
    };
  }

  private async generateTokens(userId: string) {
    const payload = { sub: userId };

    // Generate access token
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_ACCESS_TOKEN_EXPIRES_IN', '15m'),
    });

    // Generate refresh token
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_REFRESH_TOKEN_EXPIRES_IN', '7d'),
    });

    // Store refresh token in database
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt,
      },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 900, // 15 minutes in seconds
    };
  }

  private async handleFailedLogin(userId: string) {
    const maxAttempts = parseInt(this.configService.get('MAX_FAILED_LOGIN_ATTEMPTS', '5'));
    
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    const newAttempts = user.failed_login_attempts + 1;
    const updateData: any = { failed_login_attempts: newAttempts };

    if (newAttempts >= maxAttempts) {
      const lockDuration = this.configService.get('ACCOUNT_LOCK_DURATION', '30m');
      const lockUntil = new Date();
      
      // Parse lock duration (e.g., "30m", "1h")
      const match = lockDuration.match(/^(\d+)([mh])$/);
      if (match) {
        const value = parseInt(match[1]);
        const unit = match[2];
        if (unit === 'm') {
          lockUntil.setMinutes(lockUntil.getMinutes() + value);
        } else if (unit === 'h') {
          lockUntil.setHours(lockUntil.getHours() + value);
        }
      }
      
      updateData.locked_until = lockUntil;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }

  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

