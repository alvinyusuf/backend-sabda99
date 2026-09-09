import { Module } from '@nestjs/common';
import { FloorsService } from './services/floors.service';
import { TablesService } from './services/tables.service';
import { TablesController } from './tables.controller';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [TablesController],
  providers: [FloorsService, TablesService],
  exports: [FloorsService, TablesService],
})
export class TablesModule {}
