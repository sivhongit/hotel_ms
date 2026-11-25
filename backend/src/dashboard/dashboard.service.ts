import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DashboardService {
  constructor(private dataSource: DataSource) {}

  async getStats() {
    const [
      totalBedsResult,
      availableBedsResult,
      occupiedBedsResult,
      maintenanceBedsResult,
      activeBookingsResult,
      totalCollectedResult,
    ] = await Promise.all([
      this.dataSource.query(`SELECT COUNT(*)::int AS count FROM beds`),
      this.dataSource.query(`SELECT COUNT(*)::int AS count FROM beds WHERE status = 'AVAILABLE'`),
      this.dataSource.query(`SELECT COUNT(*)::int AS count FROM beds WHERE status = 'OCCUPIED'`),
      this.dataSource.query(`SELECT COUNT(*)::int AS count FROM beds WHERE status = 'MAINTENANCE'`),
      this.dataSource.query(
        `SELECT COUNT(*)::int AS count FROM bookings WHERE status IN ('CONFIRMED', 'CHECKED_IN')`,
      ),
      this.dataSource.query(
        `SELECT COALESCE(SUM(paid_amount)::numeric, 0)::text AS total FROM invoices WHERE payment_status = 'COMPLETED'`,
      ),
    ]);

    return {
      totalBeds: totalBedsResult[0]?.count ?? 0,
      availableBeds: availableBedsResult[0]?.count ?? 0,
      occupiedBeds: occupiedBedsResult[0]?.count ?? 0,
      maintenanceBeds: maintenanceBedsResult[0]?.count ?? 0,
      activeBookings: activeBookingsResult[0]?.count ?? 0,
      totalCollected: totalCollectedResult[0]?.total ?? '0.00',
    };
  }

  async getBeds() {
    const beds = await this.dataSource.query(`
      SELECT
        b.id,
        b.room_id AS "roomId",
        b.bed_label AS "bedLabel",
        b.status,
        r.room_number AS "roomNumber",
        rt.name AS "roomTypeName",
        rt.base_price_per_bed AS "pricePerNight"
      FROM beds b
      JOIN rooms r ON r.id = b.room_id
      JOIN room_types rt ON rt.id = r.room_type_id
      ORDER BY r.room_number, b.bed_label
    `);

    return beds.map((bed: Record<string, unknown>) => ({
      ...bed,
      pricePerNight: bed.pricePerNight?.toString() ?? '0.00',
    }));
  }
}