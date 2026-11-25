import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class BookingsService {
  constructor(private dataSource: DataSource) { }

  findAll() {
    return this.dataSource.query(`
      SELECT b.id, b.guest_id AS "guestId", b.bed_id AS "bedId",
             b.check_in AS "checkIn", b.check_out AS "checkOut",
             b.status, b.created_at AS "createdAt",
             CONCAT(g.first_name, ' ', g.last_name) AS "guestName",
             bed.bed_label AS "bedLabel", r.room_number AS "roomNumber"
      FROM bookings b
      JOIN guests g ON g.id = b.guest_id
      JOIN beds bed ON bed.id = b.bed_id
      JOIN rooms r ON r.id = bed.room_id
      ORDER BY b.id DESC
    `);
  }

  async createBooking(
    dto: { guestId: number; bedId: number; checkIn: string; checkOut: string },
    userId: number,
  ) {
    if (new Date(dto.checkOut) <= new Date(dto.checkIn)) {
      throw new BadRequestException('checkOut must be after checkIn');
    }

    return this.dataSource.transaction(async (manager) => {
      const [bed] = await manager.query(
        `SELECT id, status FROM beds WHERE id = $1 FOR UPDATE`,
        [dto.bedId],
      );
      if (!bed) throw new NotFoundException('Bed not found');
      if (bed.status === 'MAINTENANCE') {
        throw new ConflictException('Bed is under maintenance');
      }

      const overlaps = await manager.query(
        `SELECT id FROM bookings
         WHERE bed_id = $1 AND status IN ('CONFIRMED', 'CHECKED_IN')
           AND check_in < $3 AND check_out > $2`,
        [dto.bedId, dto.checkIn, dto.checkOut],
      );
      if (overlaps.length > 0) {
        throw new ConflictException('Bed is already booked for the selected dates');
      }

      const [created] = await manager.query(
        `INSERT INTO bookings (guest_id, bed_id, check_in, check_out, status, created_by)
         VALUES ($1, $2, $3, $4, 'CONFIRMED', $5)
         RETURNING id, guest_id AS "guestId", bed_id AS "bedId", check_in AS "checkIn",
                   check_out AS "checkOut", status, created_at AS "createdAt"`,
        [dto.guestId, dto.bedId, dto.checkIn, dto.checkOut, userId],
      );

      const [pricing] = await manager.query(
        `SELECT rt.base_price_per_bed FROM beds b
         JOIN rooms r ON r.id = b.room_id
         JOIN room_types rt ON rt.id = r.room_type_id
         WHERE b.id = $1`,
        [dto.bedId],
      );

      const nights = Math.max(
        1,
        Math.ceil((new Date(dto.checkOut).getTime() - new Date(dto.checkIn).getTime()) / 86400000),
      );
      const roomCharges = (nights * Number(pricing?.base_price_per_bed || 0)).toFixed(2);

      await manager.query(
        `INSERT INTO invoices (booking_id, room_charges, service_charges, total_amount, paid_amount, payment_status)
         VALUES ($1, $2, '0.00', $2, '0.00', 'PENDING')
         ON CONFLICT (booking_id) DO NOTHING`,
        [created.id, roomCharges],
      );

      return created;
    });
  }

  async checkIn(bookingId: number) {
    return this.dataSource.transaction(async (manager) => {
      const [booking] = await manager.query(
        `UPDATE bookings SET status = 'CHECKED_IN' WHERE id = $1 RETURNING *`,
        [bookingId],
      );
      if (!booking) throw new NotFoundException('Booking not found');
      await manager.query(`UPDATE beds SET status = 'OCCUPIED' WHERE id = $1`, [booking.bed_id]);
      return booking;
    });
  }

  async checkOut(bookingId: number) {
    return this.dataSource.transaction(async (manager) => {
      const [booking] = await manager.query(
        `UPDATE bookings SET status = 'CHECKED_OUT' WHERE id = $1 RETURNING *`,
        [bookingId],
      );
      if (!booking) throw new NotFoundException('Booking not found');
      await manager.query(`UPDATE beds SET status = 'AVAILABLE' WHERE id = $1`, [booking.bed_id]);
      return booking;
    });
  }

  async cancelBooking(bookingId: number) {
    return this.dataSource.transaction(async (manager) => {
      const [booking] = await manager.query(
        `UPDATE bookings SET status = 'CANCELED' WHERE id = $1 RETURNING *`,
        [bookingId],
      );
      if (!booking) throw new NotFoundException('Booking not found');
      if (booking.status === 'CHECKED_IN') {
        await manager.query(`UPDATE beds SET status = 'AVAILABLE' WHERE id = $1`, [booking.bed_id]);
      }
      return booking;
    });
  }
}
