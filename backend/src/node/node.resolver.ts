import { Args, ID, Mutation, Query, Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { Node, NodeType } from './node.model';
import { NodeService, NodeWithDetails, NodeWithOwners } from './node.service';

interface NodeParent {
  id: string;
  type: NodeType;
  _count?: {
    children?: number;
  };
}

@Resolver(() => Node)
export class NodeResolver {
  constructor(private readonly nodeService: NodeService) {}

  @ResolveField(() => Boolean)
  async hasChildren(@Parent() node: NodeParent): Promise<boolean> {
    if (node.type !== NodeType.FOLDER) return false;
    if (node._count && node._count.children !== undefined) {
      return node._count.children > 0;
    }
    const count = await this.nodeService.getChildrenCount(node.id);
    return count > 0;
  }

  @Query(() => [Node])
  async rootNodes(
    @Args('first', { type: () => Number, nullable: true }) first?: number,
    @Args('after', { type: () => String, nullable: true }) after?: string,
  ): Promise<NodeWithDetails[]> {
    return this.nodeService.getRootNodes(first, after);
  }

  @Query(() => [Node])
  async children(
    @Args('parentId') parentId: string,
    @Args('first', { type: () => Number, nullable: true }) first?: number,
    @Args('after', { type: () => String, nullable: true }) after?: string,
  ): Promise<NodeWithDetails[]> {
    return this.nodeService.getChildren(parentId, first, after);
  }

  @Query(() => [Node])
  async folders(
    @Args('search', { nullable: true }) search?: string,
    @Args('limit', { type: () => Number, nullable: true }) limit?: number,
    @Args('excludeDescendantsOf', { nullable: true }) excludeDescendantsOf?: string,
  ): Promise<NodeWithDetails[]> {
    return this.nodeService.getAllFolders(search, limit, excludeDescendantsOf);
  }

  @Query(() => [Node])
  async ancestors(@Args('nodeId') nodeId: string): Promise<NodeWithDetails[]> {
    return this.nodeService.getAncestors(nodeId);
  }

  @Mutation(() => Node)
  async createNode(
    @Args('name') name: string,
    @Args('type', { type: () => NodeType }) type: NodeType,
    @Args('parentId', { nullable: true }) parentId?: string,
    @Args('ownerIds', { type: () => [String], nullable: true }) ownerIds?: string[],
  ): Promise<NodeWithOwners> {
    return this.nodeService.createNode(name, type, parentId, ownerIds);
  }

  @Mutation(() => Node)
  async updateNode(
    @Args('id', { type: () => ID }) id: string,
    @Args('name', { nullable: true }) name?: string,
    @Args('parentId', { type: () => String, nullable: true }) parentId?: string | null,
    @Args('ownerIds', { type: () => [String], nullable: true }) ownerIds?: string[],
  ): Promise<NodeWithOwners> {
    return this.nodeService.updateNode(id, name, parentId, ownerIds);
  }

  @Mutation(() => Boolean)
  async deleteNode(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    return this.nodeService.deleteNode(id);
  }
}
