import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { ConflictException } from '@nestjs/common';
import { BookingsService } from './bookings.service.js';


describe('BookingsService', () => {
    let service: BookingsService;

    const mockManager = {
        query: vi.fn(),
    };

    const mockDataSource = {
        transaction: vi.fn(async (cb: (manager: typeof mockManager) => Promise<unknown>) =>
            cb(mockManager),
        ),
    };

    beforeEach(async () => {
        vi.clearAllMocks();
        const moduleRef = await Test.createTestingModule({
            providers: [
                BookingsService,
                { provide: DataSource, useValue: mockDataSource },
            ],
        }).compile();

        service = moduleRef.get(BookingsService);
    });

    it('rejects overlapping dates on the same locked bed', async () => {
        mockManager.query
            .mockResolvedValueOnce([{ id: 1, status: 'AVAILABLE' }])
            .mockResolvedValueOnce([{ id: 99 }]);

        await expect(
            service.createBooking(
                { guestId: 1, bedId: 1, checkIn: '2026-12-01', checkOut: '2026-12-05' },
                1,
            ),
        ).rejects.toThrow(ConflictException);
    });
});
