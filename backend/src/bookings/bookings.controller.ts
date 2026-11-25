import { Controller, Get, Post, Patch, Param, Body, HttpCode } from '@nestjs/common';
import { BookingsService } from './bookings.service.js';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  async findAll() {
    return this.bookingsService.findAll();
  }

  @Post()
  @HttpCode(201)
  async createBooking(@Body() dto: { guestId: number; bedId: number; checkIn: string; checkOut: string }) {
    // For now using a dummy userId of 1 - in real app, get from current user
    return this.bookingsService.createBooking(dto, 1);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() dto: { status: string }) {
    const bookingId = Number(id);
    const { status } = dto;

    switch (status) {
      case 'CHECKED_IN':
        return this.bookingsService.checkIn(bookingId);
      case 'CHECKED_OUT':
        return this.bookingsService.checkOut(bookingId);
      case 'CANCELED':
        return this.bookingsService.cancelBooking(bookingId);
      default:
        throw new Error('Invalid status');
    }
  }
}