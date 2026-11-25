import { Controller, Get, Post, Put, Delete, Param, Body, HttpCode } from '@nestjs/common';
import { GuestsService } from './guests.service.js';

@Controller('guests')
export class GuestsController {
  constructor(private readonly guestsService: GuestsService) {}

  @Get()
  async findAll() {
    return this.guestsService.findAll();
  }

  @Post()
  @HttpCode(201)
  async create(@Body() dto: {
    firstName: string;
    lastName: string;
    email?: string;
    phone: string;
    idNumber: string;
    emergencyContact?: string;
  }) {
    return this.guestsService.create(dto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.guestsService.findOne(Number(id));
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<{
      firstName: string;
      lastName: string;
      email?: string;
      phone: string;
      idNumber: string;
      emergencyContact?: string;
    }>,
  ) {
    return this.guestsService.update(Number(id), dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    return this.guestsService.remove(Number(id));
  }
}