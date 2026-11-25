import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class GuestsService {
  constructor(private dataSource: DataSource) {}

  findAll() {
    return this.dataSource.query(`
      SELECT
        id,
        first_name AS "firstName",
        last_name AS "lastName",
        email,
        phone,
        id_number AS "idNumber",
        emergency_contact AS "emergencyContact",
        created_at AS "createdAt"
      FROM guests
      ORDER BY id DESC
    `);
  }

  async create(dto: {
    firstName: string;
    lastName: string;
    email?: string;
    phone: string;
    idNumber: string;
    emergencyContact?: string;
  }) {
    const [created] = await this.dataSource.query(
      `INSERT INTO guests (first_name, last_name, email, phone, id_number, emergency_contact)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, first_name AS "firstName", last_name AS "lastName", email, phone,
                 id_number AS "idNumber", emergency_contact AS "emergencyContact",
                 created_at AS "createdAt"`,
      [dto.firstName, dto.lastName, dto.email ?? null, dto.phone, dto.idNumber, dto.emergencyContact ?? null],
    );
    return created;
  }

  async findOne(id: number) {
    const [guest] = await this.dataSource.query(
      `SELECT id, first_name AS "firstName", last_name AS "lastName", email, phone,
              id_number AS "idNumber", emergency_contact AS "emergencyContact",
              created_at AS "createdAt"
       FROM guests WHERE id = $1`,
      [id],
    );
    if (!guest) throw new NotFoundException('Guest not found');
    return guest;
  }

  async update(id: number, dto: Partial<{
    firstName: string;
    lastName: string;
    email?: string;
    phone: string;
    idNumber: string;
    emergencyContact?: string;
  }>) {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (dto.firstName !== undefined) {
      fields.push(`first_name = $${paramIndex++}`);
      values.push(dto.firstName);
    }
    if (dto.lastName !== undefined) {
      fields.push(`last_name = $${paramIndex++}`);
      values.push(dto.lastName);
    }
    if (dto.email !== undefined) {
      fields.push(`email = $${paramIndex++}`);
      values.push(dto.email);
    }
    if (dto.phone !== undefined) {
      fields.push(`phone = $${paramIndex++}`);
      values.push(dto.phone);
    }
    if (dto.idNumber !== undefined) {
      fields.push(`id_number = $${paramIndex++}`);
      values.push(dto.idNumber);
    }
    if (dto.emergencyContact !== undefined) {
      fields.push(`emergency_contact = $${paramIndex++}`);
      values.push(dto.emergencyContact);
    }

    if (fields.length === 0) return this.findOne(id);

    values.push(id);
    const [updated] = await this.dataSource.query(
      `UPDATE guests SET ${fields.join(', ')} WHERE id = $${paramIndex}
       RETURNING id, first_name AS "firstName", last_name AS "lastName", email, phone,
                 id_number AS "idNumber", emergency_contact AS "emergencyContact",
                 created_at AS "createdAt"`,
      values,
    );
    if (!updated) throw new NotFoundException('Guest not found');
    return updated;
  }

  async remove(id: number) {
    const [deleted] = await this.dataSource.query(
      `DELETE FROM guests WHERE id = $1 RETURNING id`,
      [id],
    );
    if (!deleted) throw new NotFoundException('Guest not found');
    return { success: true };
  }
}