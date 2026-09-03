import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { TablesModule } from './modules/tables/tables.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ShiftsModule } from './modules/shifts/shifts.module';
import { PrintersModule } from './modules/printers/printers.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    TablesModule,
    ProductsModule,
    OrdersModule,
    PaymentsModule,
    ShiftsModule,
    PrintersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
