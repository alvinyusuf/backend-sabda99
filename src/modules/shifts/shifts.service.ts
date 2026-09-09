import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  OpenShiftDto,
  CreateCashMovementDto,
  CloseShiftDto,
} from './dto/shift.dto';
import { ShiftStatus } from '@prisma/client';

@Injectable()
export class ShiftsService {
  constructor(private prisma: PrismaService) {}

  async openShift(userId: string, dto: OpenShiftDto) {
    const activeShift = await this.prisma.shift.findFirst({
      where: {
        userId,
        status: ShiftStatus.OPEN,
      },
    });

    if (activeShift) {
      throw new ConflictException('User already has an open shift');
    }

    return this.prisma.shift.create({
      data: {
        outletId: dto.outletId,
        userId,
        openingCash: dto.openingCash,
        status: ShiftStatus.OPEN,
        openedAt: new Date(),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async getCurrentShift(userId: string) {
    const shift = await this.prisma.shift.findFirst({
      where: {
        userId,
        status: ShiftStatus.OPEN,
      },
      include: {
        cashMovements: true,
      },
    });

    if (!shift) {
      throw new NotFoundException('No active open shift found for this user');
    }

    // Calculate cash totals
    const cashInTotal = shift.cashMovements
      .filter((m) => m.type === 'CASH_IN')
      .reduce((sum, m) => sum + Number(m.amount), 0);

    const cashOutTotal = shift.cashMovements
      .filter((m) => m.type === 'CASH_OUT')
      .reduce((sum, m) => sum + Number(m.amount), 0);

    // Fetch all confirmed payments during this shift time window with payment method details
    const shiftPayments = await this.prisma.payment.findMany({
      where: {
        confirmedById: shift.userId,
        confirmedAt: {
          gte: shift.openedAt,
        },
        status: 'PAID',
      },
      include: {
        paymentMethod: true,
      },
    });

    const cashSalesTotal = shiftPayments
      .filter((p) => p.paymentMethod?.type === 'CASH')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    // Aggregate payments by payment method
    const paymentMethodMap = new Map<
      string,
      {
        paymentMethodId: string;
        methodName: string;
        type: string;
        totalAmount: number;
        count: number;
      }
    >();

    for (const payment of shiftPayments) {
      const methodId = payment.paymentMethodId;
      const methodName = payment.paymentMethod?.name || 'Unknown';
      const methodType = payment.paymentMethod?.type || 'OTHER';
      const amount = Number(payment.amount);

      const existing = paymentMethodMap.get(methodId) || {
        paymentMethodId: methodId,
        methodName,
        type: methodType,
        totalAmount: 0,
        count: 0,
      };

      existing.totalAmount += amount;
      existing.count += 1;
      paymentMethodMap.set(methodId, existing);
    }

    const paymentsByMethod = Array.from(paymentMethodMap.values());

    return {
      ...shift,
      cashInTotal,
      cashOutTotal,
      cashSalesTotal,
      paymentsByMethod,
    };
  }

  async recordCashMovement(userId: string, dto: CreateCashMovementDto) {
    const shift = await this.prisma.shift.findUnique({
      where: { id: dto.shiftId },
    });

    if (!shift || shift.status !== ShiftStatus.OPEN) {
      throw new BadRequestException('Shift is not open or does not exist');
    }

    if (shift.userId !== userId) {
      throw new BadRequestException(
        'You can only record cash movements on your own shift',
      );
    }

    return this.prisma.cashMovement.create({
      data: {
        shiftId: dto.shiftId,
        type: dto.type,
        amount: dto.amount,
        reason: dto.reason,
        createdById: userId,
      },
    });
  }

  async closeShift(userId: string, shiftId: string, dto: CloseShiftDto) {
    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        cashMovements: true,
      },
    });

    if (!shift || shift.status !== ShiftStatus.OPEN) {
      throw new BadRequestException('Shift is already closed or invalid');
    }

    if (shift.userId !== userId) {
      throw new BadRequestException('You can only close your own shift');
    }

    // Calculate total Cash In / Cash Out
    const openingCash = Number(shift.openingCash);

    // Sum cash movements
    const cashInTotal = shift.cashMovements
      .filter((m) => m.type === 'CASH_IN')
      .reduce((sum, m) => sum + Number(m.amount), 0);

    const cashOutTotal = shift.cashMovements
      .filter((m) => m.type === 'CASH_OUT')
      .reduce((sum, m) => sum + Number(m.amount), 0);

    // Fetch all confirmed payments during this shift time window with payment method details
    const shiftPayments = await this.prisma.payment.findMany({
      where: {
        confirmedById: shift.userId,
        confirmedAt: {
          gte: shift.openedAt,
        },
        status: 'PAID',
      },
      include: {
        paymentMethod: true,
      },
    });

    const cashSalesTotal = shiftPayments
      .filter((p) => p.paymentMethod?.type === 'CASH')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    // Aggregate payments by payment method
    const paymentMethodMap = new Map<
      string,
      {
        paymentMethodId: string;
        methodName: string;
        type: string;
        totalAmount: number;
        count: number;
      }
    >();

    for (const payment of shiftPayments) {
      const methodId = payment.paymentMethodId;
      const methodName = payment.paymentMethod?.name || 'Unknown';
      const methodType = payment.paymentMethod?.type || 'OTHER';
      const amount = Number(payment.amount);

      const existing = paymentMethodMap.get(methodId) || {
        paymentMethodId: methodId,
        methodName,
        type: methodType,
        totalAmount: 0,
        count: 0,
      };

      existing.totalAmount += amount;
      existing.count += 1;
      paymentMethodMap.set(methodId, existing);
    }

    const paymentsByMethod = Array.from(paymentMethodMap.values());

    const expectedCash =
      openingCash + cashSalesTotal + cashInTotal - cashOutTotal;
    const actualCash = dto.actualCash;
    const variance = actualCash - expectedCash;

    return this.prisma.shift.update({
      where: { id: shiftId },
      data: {
        status: ShiftStatus.CLOSED,
        closedAt: new Date(),
        expectedCash,
        actualCash,
        variance,
      },
      include: {
        cashMovements: true,
      },
    });
  }
}
