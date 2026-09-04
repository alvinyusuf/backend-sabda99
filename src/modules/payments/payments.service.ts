import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreatePaymentMethodDto,
  ProcessPaymentDto,
  ConfirmCashPaymentDto,
  RefundPaymentDto,
} from './dto/payment.dto';
import { OrderStatus, PaymentMethodType, PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async createMethod(dto: CreatePaymentMethodDto) {
    return this.prisma.paymentMethod.create({
      data: dto,
    });
  }

  async findMethodsByOutlet(outletId: string) {
    return this.prisma.paymentMethod.findMany({
      where: { outletId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async processPayment(dto: ProcessPaymentDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { payments: true },
    });

    if (!order) {
      throw new NotFoundException(`Order ID ${dto.orderId} not found`);
    }

    const paymentMethod = await this.prisma.paymentMethod.findUnique({
      where: { id: dto.paymentMethodId },
    });

    if (!paymentMethod || !paymentMethod.isActive) {
      throw new NotFoundException('Payment method not found or inactive');
    }

    const isCash = paymentMethod.type === PaymentMethodType.CASH;
    const initialStatus = isCash ? PaymentStatus.PENDING : PaymentStatus.PAID;

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          orderId: dto.orderId,
          paymentMethodId: dto.paymentMethodId,
          amount: dto.amount,
          status: initialStatus,
          reference: dto.reference,
          paidAt: isCash ? null : new Date(),
        },
        include: {
          paymentMethod: true,
        },
      });

      // If online/non-cash payment succeeds immediately, evaluate total paid
      if (!isCash) {
        const allPayments = await tx.payment.findMany({
          where: { orderId: dto.orderId, status: PaymentStatus.PAID },
        });

        const totalPaid = allPayments.reduce(
          (sum, p) => sum + Number(p.amount),
          0,
        );

        if (totalPaid >= Number(order.totalAmount)) {
          await tx.order.update({
            where: { id: dto.orderId },
            data: {
              status: OrderStatus.CONFIRMED,
              confirmedAt: new Date(),
            },
          });

          await tx.fulfillment.update({
            where: { orderId: dto.orderId },
            data: { status: 'QUEUED', queuedAt: new Date() },
          });
        }
      }

      return payment;
    });
  }

  async confirmCashPayment(paymentId: string, confirmedByUserId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true, paymentMethod: true },
    });

    if (!payment) {
      throw new NotFoundException(`Payment ID ${paymentId} not found`);
    }

    if (payment.status === PaymentStatus.PAID) {
      throw new BadRequestException('Payment is already confirmed and paid');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.PAID,
          paidAt: new Date(),
          confirmedAt: new Date(),
          confirmedById: confirmedByUserId,
        },
        include: {
          paymentMethod: true,
          confirmedBy: { select: { id: true, name: true, email: true } },
        },
      });

      // Calculate total paid for this order
      const allPaid = await tx.payment.findMany({
        where: { orderId: payment.orderId, status: PaymentStatus.PAID },
      });

      const totalPaid = allPaid.reduce((sum, p) => sum + Number(p.amount), 0);

      if (totalPaid >= Number(payment.order.totalAmount)) {
        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            status: OrderStatus.CONFIRMED,
            confirmedAt: new Date(),
          },
        });

        await tx.fulfillment.update({
          where: { orderId: payment.orderId },
          data: { status: 'QUEUED', queuedAt: new Date() },
        });
      }

      return updatedPayment;
    });
  }

  async refundPayment(paymentId: string, dto: RefundPaymentDto, userId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true, paymentMethod: true },
    });

    if (!payment) {
      throw new NotFoundException(`Payment ID ${paymentId} not found`);
    }

    if (payment.status !== PaymentStatus.PAID) {
      throw new BadRequestException('Can only refund payments with PAID status');
    }

    // Find current open shift for the outlet
    const order = await this.prisma.order.findUnique({
      where: { id: payment.orderId },
      select: { outletId: true },
    });

    const currentShift = await this.prisma.shift.findFirst({
      where: {
        outletId: order!.outletId,
        status: 'OPEN',
      },
    });

    if (!currentShift) {
      throw new BadRequestException('No open shift found for this outlet');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.REFUNDED,
        },
        include: {
          paymentMethod: true,
        },
      });

      // Record cash movement for refund
      await tx.cashMovement.create({
        data: {
          shiftId: currentShift.id,
          type: 'REFUND',
          amount: -Number(payment.amount),
          reason: dto.reason,
          referenceType: 'PAYMENT',
          referenceId: paymentId,
          createdById: userId,
        },
      });

      return updatedPayment;
    });
  }
}
