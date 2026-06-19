import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NodeType } from './node.model';
import { Prisma } from '@prisma/client';

export type NodeWithDetails = Prisma.NodeGetPayload<{
  include: {
    owners: true;
    _count: { select: { children: true } };
  };
}>;

export type NodeWithOwners = Prisma.NodeGetPayload<{
  include: {
    owners: true;
  };
}>;

@Injectable()
export class NodeService {
  constructor(private prisma: PrismaService) {}

  async getChildrenCount(parentId: string): Promise<number> {
    return this.prisma.node.count({
      where: { parentId },
    });
  }

  async getRootNodes(first?: number, after?: string): Promise<NodeWithDetails[]> {
    return this.prisma.node.findMany({
      where: { parentId: null },
      take: first ?? undefined,
      skip: after ? 1 : undefined,
      cursor: after ? { id: after } : undefined,
      include: {
        owners: true,
        _count: {
          select: { children: true },
        },
      },
    });
  }

  async getChildren(parentId: string, first?: number, after?: string): Promise<NodeWithDetails[]> {
    return this.prisma.node.findMany({
      where: { parentId },
      take: first ?? undefined,
      skip: after ? 1 : undefined,
      cursor: after ? { id: after } : undefined,
      include: {
        owners: true,
        _count: {
          select: { children: true },
        },
      },
    });
  }

  async getAllFolders(search?: string, limit?: number, excludeDescendantsOf?: string): Promise<NodeWithDetails[]> {
    if (excludeDescendantsOf) {
      const limitVal = limit || 100;
      const searchStr = search ? `%${search}%` : '%';
      
      const nodesRaw: { id: string }[] = await this.prisma.$queryRaw`
        WITH RECURSIVE descendants AS (
          SELECT id FROM "Node" WHERE id = ${excludeDescendantsOf}
          UNION ALL
          SELECT n.id FROM "Node" n
          INNER JOIN descendants d ON n."parentId" = d.id
        )
        SELECT "Node".id FROM "Node"
        WHERE "Node".type = 'FOLDER'
          AND "Node".id != ${excludeDescendantsOf}
          AND "Node".id NOT IN (SELECT id FROM descendants)
          AND ("Node".name ILIKE ${searchStr})
        LIMIT ${limitVal}
      `;

      const ids = nodesRaw.map(n => n.id);
      
      if (ids.length === 0) return [];
      
      return this.prisma.node.findMany({
        where: { id: { in: ids } },
        include: {
          owners: true,
          _count: { select: { children: true } },
        },
      });
    }

    return this.prisma.node.findMany({
      where: { 
        type: 'FOLDER',
        name: search ? { contains: search, mode: 'insensitive' } : undefined,
      },
      take: limit ?? undefined,
      include: {
        owners: true,
        _count: {
          select: { children: true },
        },
      },
    });
  }

  private async getAncestorIds(nodeId: string): Promise<string[]> {
    const ancestorIdsRaw: { id: string }[] = await this.prisma.$queryRaw`
      WITH RECURSIVE node_tree AS (
        SELECT id, "parentId"
        FROM "Node"
        WHERE id = ${nodeId}
        UNION ALL
        SELECT n.id, n."parentId"
        FROM "Node" n
        INNER JOIN node_tree nt ON nt."parentId" = n.id
      )
      SELECT id FROM node_tree;
    `;
    return ancestorIdsRaw.map((row) => row.id);
  }

  async getAncestors(nodeId: string): Promise<NodeWithDetails[]> {
    const ancestorIds = await this.getAncestorIds(nodeId);

    const nodes = await this.prisma.node.findMany({
      where: { id: { in: ancestorIds } },
      include: {
        owners: true,
        _count: { select: { children: true } },
      },
    });

    const nodeMap = new Map<string, NodeWithDetails>(nodes.map((n: NodeWithDetails) => [n.id, n]));
    return ancestorIds
      .map(id => nodeMap.get(id))
      .filter((n): n is NodeWithDetails => !!n)
      .reverse();
  }

  async createNode(
    name: string,
    type: NodeType,
    parentId?: string,
    ownerIds?: string[],
  ): Promise<NodeWithOwners> {
    const data: Prisma.NodeCreateInput = {
      name,
      type,
    };
    if (parentId) {
      data.parent = { connect: { id: parentId } };
    }
    if (ownerIds && ownerIds.length > 0) {
      data.owners = { connect: ownerIds.map((id) => ({ id })) };
    }

    return this.prisma.node.create({
      data,
      include: { owners: true },
    });
  }

  async updateNode(
    id: string,
    name?: string,
    parentId?: string | null,
    ownerIds?: string[],
  ): Promise<NodeWithOwners> {
    if (parentId !== undefined) {
      if (parentId === id) {
        throw new BadRequestException('Cannot move a folder into itself');
      }
      if (parentId !== null) {
        const ancestorIds = await this.getAncestorIds(parentId);
        const isDescendant = ancestorIds.includes(id);
        if (isDescendant) {
          throw new BadRequestException('Cannot move a folder into its own descendant');
        }
      }
    }

    const data: Prisma.NodeUpdateInput = {};
    if (name !== undefined) data.name = name;
    if (parentId !== undefined) {
      if (parentId === null) {
        data.parent = { disconnect: true };
      } else {
        data.parent = { connect: { id: parentId } };
      }
    }
    if (ownerIds !== undefined) {
      data.owners = { set: ownerIds.map((oId) => ({ id: oId })) };
    }

    return this.prisma.node.update({
      where: { id },
      data,
      include: { owners: true },
    });
  }

  async deleteNode(id: string): Promise<boolean> {
    try {
      await this.prisma.node.delete({ where: { id } });
      return true;
    } catch (e) {
      return false;
    }
  }
}
