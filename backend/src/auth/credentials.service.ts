import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService, User } from './users.service.js';

@Injectable()
export class CredentialsService {
  constructor(private readonly users: UsersService) {}

  async verify(email: string, password: string): Promise<User | null> {
    console.log('DEBUG: Attempting login for email:', email);
    const found = await this.users.findByEmail(email);
    console.log('DEBUG: Found user:', found);
    if (!found) {
        return null;
    }
    const valid = await bcrypt.compare(password, found.passwordHash);
    console.log('DEBUG: Password valid:', valid);
    return valid ? found : null;
  }
}