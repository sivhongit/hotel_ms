import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

export interface User {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  role: 'ADMIN' | 'STAFF';
}

export interface LoginActivity {
  id: number;
  userId: number;
  username: string;
  email: string;
  ipAddress: string;
  userAgent: string;
  loggedAt: Date;
}

@Injectable()
export class UsersService {
  constructor(private dataSource: DataSource) {}

  async findByEmail(email: string): Promise<User | null> {
    const [user] = await this.dataSource.query(
      `SELECT id, username, email, password_hash AS "passwordHash", role FROM users WHERE email = $1`,
      [email],
    );
    return user ?? null;
  }

  async findById(id: number): Promise<User | null> {
    const [user] = await this.dataSource.query(
      `SELECT id, username, email, password_hash AS "passwordHash", role FROM users WHERE id = $1`,
      [id],
    );
    return user ?? null;
  }

  async updatePasswordHash(userId: number, passwordHash: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE users SET password_hash = $1 WHERE id = $2`,
      [passwordHash, userId],
    );
  }

  async create(username: string, email: string, password: string, role: 'ADMIN' | 'STAFF' = 'STAFF'): Promise<User> {
    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await this.dataSource.query(
      `INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, password_hash AS "passwordHash", role`,
      [username, email, passwordHash, role],
    );
    return user;
  }

  async logLoginActivity(
    userId: number,
    ipAddress: string,
    userAgent: string,
  ): Promise<void> {
    await this.dataSource.query(
      `INSERT INTO user_login_activities (user_id, ip_address, user_agent) VALUES ($1, $2, $3)`,
      [userId, ipAddress, userAgent],
    );
  }

  async getLoginActivities(limit = 100, offset = 0): Promise<LoginActivity[]> {
    const rows = await this.dataSource.query(
      `SELECT
         ula.id,
         ula.user_id AS "userId",
         u.username,
         u.email,
         ula.ip_address AS "ipAddress",
         ula.user_agent AS "userAgent",
         ula.logged_at AS "loggedAt"
       FROM user_login_activities ula
       JOIN users u ON ula.user_id = u.id
       ORDER BY ula.logged_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    return rows;
  }

  async getAllUsers(): Promise<User[]> {
    const users = await this.dataSource.query(
      `SELECT id, username, email, password_hash AS "passwordHash", role FROM users ORDER BY created_at DESC`,
    );
    return users;
  }

  async getUserCount(): Promise<number> {
    const [result] = await this.dataSource.query(`SELECT COUNT(*)::int AS count FROM users`);
    return result.count;
  }

  async getLoginActivityCount(): Promise<number> {
    const [result] = await this.dataSource.query(`SELECT COUNT(*)::int AS count FROM user_login_activities`);
    return result.count;
  }
}