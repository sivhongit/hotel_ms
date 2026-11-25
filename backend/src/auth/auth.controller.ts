import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  HttpException,
  Req,
  Query,
} from '@nestjs/common';
import { TokenService, CurrentUser, Public } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import { CredentialsService } from './credentials.service.js';
import { UsersService, type User, type LoginActivity } from './users.service.js';
import { AdminPolicy } from './admin.policy.js';


@Controller('auth')
export class AuthController {
  constructor(
    private readonly credentials: CredentialsService,
    private readonly tokens: TokenService,
    private readonly users: UsersService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Req() req: { headers: Record<string, string | undefined> },
    @Body() body: { email: string; password: string },
  ): Promise<{ accessToken: string; refreshToken: string; user: Omit<User, 'passwordHash'> }> {
    const user = await this.credentials.verify(body.email, body.password);
    if (!user) {
      throw new HttpException('Invalid email or password', HttpStatus.UNAUTHORIZED);
    }

    const { accessToken, refreshToken } = await this.tokens.issue(String(user.id), {
      method: 'password',
    });

    // Log login activity
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
      || req.headers['x-real-ip']
      || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    await this.users.logLoginActivity(user.id, ipAddress, userAgent);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() body: { username: string; email: string; password: string; role?: 'ADMIN' | 'STAFF' },
  ): Promise<{ accessToken: string; refreshToken: string; user: Omit<User, 'passwordHash'> }> {
    const existing = await this.users.findByEmail(body.email);
    if (existing) {
      throw new HttpException('Email already registered', HttpStatus.CONFLICT);
    }

    const user = await this.users.create(body.username, body.email, body.password, body.role ?? 'STAFF');

    const { accessToken, refreshToken } = await this.tokens.issue(String(user.id), {
      method: 'password',
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body('refreshToken') refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.tokens.refresh(refreshToken);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Body('refreshToken') refreshToken: string,
  ): Promise<void> {
    await this.tokens.revoke(refreshToken);
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  me(@CurrentUser() user: User): Omit<User, 'passwordHash'> {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };
  }

  // Admin endpoints
  @Can(AdminPolicy, 'authorize')
  @Get('admin/users')
  @HttpCode(HttpStatus.OK)
  async getUsers(
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
  ): Promise<User[]> {
    return this.users.getAllUsers();
  }

  @Can(AdminPolicy, 'authorize')
  @Get('admin/login-activities')
  @HttpCode(HttpStatus.OK)
  async getLoginActivities(
    @Query('limit') limit = 100,
    @Query('offset') offset = 0,
  ): Promise<LoginActivity[]> {
    return this.users.getLoginActivities(Number(limit), Number(offset));
  }

  @Can(AdminPolicy, 'authorize')
  @Get('admin/stats')
  @HttpCode(HttpStatus.OK)
  async getStats(): Promise<{
    userCount: number;
    loginActivityCount: number;
  }> {
    const [userCount, loginActivityCount] = await Promise.all([
      this.users.getUserCount(),
      this.users.getLoginActivityCount(),
    ]);
    return { userCount, loginActivityCount };
  }
}