import { Injectable, type ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthenticationError, AuthenticationProvider, AuthenticationRegistry } from '@nestjs/authentication';
import { UsersService, User } from './users.service.js';

@Injectable()
export class JwtAuth extends AuthenticationProvider<User> {
  constructor(
    private readonly jwt: JwtService,
    private readonly users: UsersService,
    registry: AuthenticationRegistry,
  ) {
    super();
    registry.registerProvider(this, { order: 1 });
  }

  async authenticate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) return null;
    let sub: number;
    try {
      ({ sub } = await this.jwt.verifyAsync<{ sub: number }>(header.slice(7)));
    } catch {
      throw new AuthenticationError('Invalid or expired token');
    }
    const user = await this.users.findById(sub);
    if (!user) throw new AuthenticationError('Invalid or expired token');
    return { user };
  }

  challenge() {
    return 'Bearer';
  }
}