import { Injectable } from '@nestjs/common';
import type { User } from './users.service.js';

@Injectable()
export class AdminPolicy {
  async authorize(user: User | null): Promise<boolean> {
    return user?.role === 'ADMIN';
  }
}
