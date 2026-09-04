import { Module } from '@nestjs/common';
import { FloorsService } from './services/floors.service';
import { TablesService } from './services/tables.service';
import { TablesController } from './tables.controller';

@Module({
  controllers: [TablesController],
  providers: [FloorsService, TablesService],
  exports: [FloorsService, TablesService],
})
export class TablesModule {}
