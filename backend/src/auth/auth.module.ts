import { Module } from '@nestjs/common';
import { AuthenticationModule } from '@nestjs/authentication';
import { AuthorizationModule } from '@nestjs/authorization';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { CredentialsService } from './credentials.service.js';
import { JwtAuth } from './jwt-auth.provider.js';
import { UsersService } from './users.service.js';
import { AdminPolicy } from './admin.policy.js';

@Module({
  imports: [
    AuthenticationModule.forRoot({
      accessToken: {
        key: process.env.JWT_SECRET ?? 'development-secret-change-in-production-at-least-32-bytes',
        ttl: '15m',
      },
      refreshToken: {
        ttl: '7d',
      },
    }),
    AuthorizationModule.forRoot({}),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'development-secret-change-in-production-at-least-32-bytes-long',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    CredentialsService,
    UsersService,
    JwtAuth,
    AdminPolicy,
  ],
  exports: [UsersService, CredentialsService, AdminPolicy],
})
export class AuthModule {}