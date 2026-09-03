import { Module } from '@nestjs/common';
import { FloorsService } from './services/floors.service';
import { TablesService } from './services/tables.service';
import { TableSessionsService } from './services/table-sessions.service';
import { TablesController } from './tables.controller';

@Module({
  controllers: [TablesController],
  providers: [FloorsService, TablesService, TableSessionsService],
  exports: [FloorsService, TablesService, TableSessionsService],
})
export class TablesModule {}
