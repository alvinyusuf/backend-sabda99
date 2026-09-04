import { Module } from '@nestjs/common';
import { PurchasingService } from './purchasing.service';
import { PurchaseRequestService } from './services/purchase-request.service';
import { PurchasingController } from './purchasing.controller';

@Module({
  controllers: [PurchasingController],
  providers: [PurchasingService, PurchaseRequestService],
  exports: [PurchasingService],
})
export class PurchasingModule {}
