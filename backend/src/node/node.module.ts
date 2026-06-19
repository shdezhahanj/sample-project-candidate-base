import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NodeResolver } from './node.resolver';
import { NodeService } from './node.service';

@Module({
  imports: [PrismaModule],
  providers: [NodeResolver, NodeService],
  exports: [NodeService],
})
export class NodeModule {}
