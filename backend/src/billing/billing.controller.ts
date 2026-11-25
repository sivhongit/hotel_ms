import { Controller, Get, Patch, Param, Body, HttpCode } from '@nestjs/common';
import { BillingService } from './billing.service.js';

@Controller('invoices')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get()
  async findAll() {
    return this.billingService.findAll();
  }

  @Patch(':id/pay')
  @HttpCode(200)
  async recordPayment(
    @Param('id') id: string,
    @Body() dto: { amount: number; paymentMethod: string },
  ) {
    return this.billingService.recordPayment(Number(id), dto);
  }
}