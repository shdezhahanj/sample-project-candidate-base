import { gql } from '@apollo/client';

export const GET_ROOT_NODES = gql`
  query GetRootNodes($first: Float, $after: String) {
    rootNodes(first: $first, after: $after) {
      id
      name
      type
      parentId
      hasChildren
      owners {
        id
        name
      }
    }
  }
`;

export const GET_CHILDREN = gql`
  query GetChildren($parentId: String!, $first: Float, $after: String) {
    children(parentId: $parentId, first: $first, after: $after) {
      id
      name
      type
      parentId
      hasChildren
      owners {
        id
        name
      }
    }
  }
`;

export const GET_FOLDERS = gql`
  query GetFolders($search: String, $limit: Float, $excludeDescendantsOf: String) {
    folders(search: $search, limit: $limit, excludeDescendantsOf: $excludeDescendantsOf) {
      id
      name
      type
      parentId
    }
  }
`;

export const GET_ANCESTORS = gql`
  query GetAncestors($nodeId: String!) {
    ancestors(nodeId: $nodeId) {
      id
      name
      type
      parentId
      owners {
        id
        name
      }
    }
  }
`;

export const GET_USERS = gql`
  query GetUsers {
    users {
      id
      name
      email
    }
  }
`;

export const CREATE_NODE = gql`
  mutation CreateNode($name: String!, $type: NodeType!, $parentId: String, $ownerIds: [String!]) {
    createNode(name: $name, type: $type, parentId: $parentId, ownerIds: $ownerIds) {
      id
      name
      type
      parentId
      owners {
        id
        name
      }
    }
  }
`;

export const UPDATE_NODE = gql`
  mutation UpdateNode($id: ID!, $name: String, $parentId: String, $ownerIds: [String!]) {
    updateNode(id: $id, name: $name, parentId: $parentId, ownerIds: $ownerIds) {
      id
      name
      type
      parentId
      owners {
        id
        name
      }
    }
  }
`;

export const DELETE_NODE = gql`
  mutation DeleteNode($id: ID!) {
    deleteNode(id: $id)
  }
`;
