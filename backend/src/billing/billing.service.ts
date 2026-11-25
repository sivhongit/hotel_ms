import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class BillingService {
  constructor(private dataSource: DataSource) {}

  async findAll() {
    return this.dataSource.query(`
      SELECT
        i.id,
        i.booking_id AS "bookingId",
        i.room_charges AS "roomCharges",
        i.service_charges AS "serviceCharges",
        i.total_amount AS "totalAmount",
        i.paid_amount AS "paidAmount",
        i.payment_method AS "paymentMethod",
        i.payment_status AS "paymentStatus",
        i.created_at AS "createdAt",
        CONCAT(g.first_name, ' ', g.last_name) AS "guestName",
        r.room_number AS "roomNumber",
        b.bed_label AS "bedLabel"
      FROM invoices i
      JOIN bookings bk ON bk.id = i.booking_id
      JOIN guests g ON g.id = bk.guest_id
      JOIN beds b ON b.id = bk.bed_id
      JOIN rooms r ON r.id = b.room_id
      ORDER BY i.id DESC
    `);
  }

  async recordPayment(
    invoiceId: number,
    dto: { amount: number; paymentMethod: string },
  ) {
    if (dto.amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    return this.dataSource.transaction(async (manager) => {
      const [invoice] = await manager.query(
        `SELECT id, total_amount, paid_amount, payment_status
         FROM invoices WHERE id = $1 FOR UPDATE`,
        [invoiceId],
      );

      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }

      const totalAmount = Number(invoice.total_amount);
      const paidAmount = Number(invoice.paid_amount);
      const newPaidAmount = paidAmount + dto.amount;

      if (newPaidAmount > totalAmount) {
        throw new BadRequestException(
          `Payment amount exceeds remaining balance. Remaining: ${(totalAmount - paidAmount).toFixed(2)}`,
        );
      }

      let paymentStatus = invoice.payment_status;
      if (newPaidAmount >= totalAmount) {
        paymentStatus = 'COMPLETED';
      } else if (newPaidAmount > 0) {
        paymentStatus = 'PARTIAL';
      }

      const [updated] = await manager.query(
        `UPDATE invoices
         SET paid_amount = $1, payment_status = $2, payment_method = $3
         WHERE id = $4
         RETURNING id, booking_id AS "bookingId", room_charges AS "roomCharges",
                   service_charges AS "serviceCharges", total_amount AS "totalAmount",
                   paid_amount AS "paidAmount", payment_method AS "paymentMethod",
                   payment_status AS "paymentStatus", created_at AS "createdAt"`,
        [newPaidAmount.toFixed(2), paymentStatus, dto.paymentMethod, invoiceId],
      );

      return updated;
    });
  }
}