import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { User } from '../user/user.model';

export enum NodeType {
  FOLDER = 'FOLDER',
  FILE = 'FILE',
}

registerEnumType(NodeType, {
  name: 'NodeType',
});

@ObjectType()
export class Node {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field(() => NodeType)
  type: NodeType;

  @Field({ nullable: true })
  parentId?: string;

  @Field(() => [User])
  owners: User[];

  @Field(() => [Node], { nullable: true })
  children?: Node[];

  @Field(() => Boolean)
  hasChildren: boolean;
}
