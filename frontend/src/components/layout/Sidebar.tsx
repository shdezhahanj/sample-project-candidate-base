'use client';

import React, { useState, useCallback } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { TreeView } from '../tree/TreeView';
import { NodeData, User } from '@/types';
import { ContextMenu } from '../dialogs/ContextMenu';
import { NodeDialog } from '../dialogs/NodeDialog';
import { CREATE_NODE, UPDATE_NODE, DELETE_NODE, GET_ROOT_NODES, GET_USERS, GET_CHILDREN } from '@/lib/graphql';
import { gql } from '@apollo/client';
import styles from './sidebar.module.css';

interface SidebarProps {
  selectedNodeId: string | null;
  onSelectNode: (node: NodeData | null) => void;
}

export function Sidebar({ selectedNodeId, onSelectNode }: SidebarProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: NodeData | null } | null>(null);
  const [dialogState, setDialogState] = useState<{ isOpen: boolean; mode: 'ADD_FOLDER' | 'ADD_FILE' | 'EDIT'; node: NodeData | null }>({
    isOpen: false,
    mode: 'ADD_FOLDER',
    node: null,
  });

  const { data: usersData } = useQuery<{ users: User[] }>(GET_USERS);

  const [createNode] = useMutation<
    { createNode: NodeData },
    { name: string; type: 'FOLDER' | 'FILE'; parentId: string | null; ownerIds: string[] }
  >(CREATE_NODE, {
    update(cache, { data }) {
      const newNode = data?.createNode;
      if (newNode?.parentId) {
        cache.writeFragment({
          id: cache.identify({ __typename: 'Node', id: newNode.parentId }),
          fragment: gql`
            fragment ParentFolder on Node {
              hasChildren
            }
          `,
          data: { hasChildren: true },
        });
      }
    }
  });
  const [updateNode] = useMutation<
    { updateNode: NodeData },
    { id: string; name?: string; parentId?: string | null; ownerIds?: string[] }
  >(UPDATE_NODE);
  const [deleteNode] = useMutation<
    { deleteNode: boolean },
    { id: string }
  >(DELETE_NODE);

  const handleContextMenu = useCallback((e: React.MouseEvent, node: NodeData | null) => {
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  }, []);

  const handleContextAction = useCallback(async (action: 'ADD_FOLDER' | 'ADD_FILE' | 'EDIT' | 'REMOVE') => {
    const node = contextMenu?.node || null;
    setContextMenu(null);

    if (action === 'REMOVE' && node) {
      if (confirm(`Are you sure you want to delete ${node.name}?`)) {
        const parentId = node.parentId;
        await deleteNode({ 
          variables: { id: node.id },
          refetchQueries: [
            parentId 
              ? { query: GET_CHILDREN, variables: { parentId, first: 50 } }
              : { query: GET_ROOT_NODES, variables: { first: 50 } }
          ],
          update(cache) {
            if (parentId) {
              const cacheData = cache.readQuery<{ children: NodeData[] }>({
                query: GET_CHILDREN,
                variables: { parentId, first: 50 }
              });
              if (cacheData?.children) {
                const updatedChildren = cacheData.children.filter((c: NodeData) => c.id !== node.id);
                cache.writeQuery<{ children: NodeData[] }>({
                  query: GET_CHILDREN,
                  variables: { parentId, first: 50 },
                  data: { children: updatedChildren }
                });
                if (updatedChildren.length === 0) {
                  cache.writeFragment({
                    id: cache.identify({ __typename: 'Node', id: parentId }),
                    fragment: gql`
                      fragment EmptyParentFolder on Node {
                        hasChildren
                      }
                    `,
                    data: { hasChildren: false }
                  });
                }
              }
            }
          }
        });
        if (selectedNodeId === node.id) onSelectNode(null);
      }
    } else {
      setDialogState({ isOpen: true, mode: action as 'ADD_FOLDER' | 'ADD_FILE' | 'EDIT', node });
    }
  }, [contextMenu, deleteNode, selectedNodeId, onSelectNode]);

  const handleDialogSubmit = useCallback(async (name: string, ownerIds: string[]) => {
    const { mode, node } = dialogState;
    setDialogState({ ...dialogState, isOpen: false });

    if (mode === 'EDIT' && node) {
      const { data } = await updateNode({ variables: { id: node.id, name, ownerIds } });
      if (data?.updateNode && selectedNodeId === node.id) {
        onSelectNode(data.updateNode);
      }
    } else {
      const type = mode === 'ADD_FOLDER' ? 'FOLDER' : 'FILE';
      const parentId = node ? node.id : null;
      await createNode({ 
        variables: { name, type, parentId, ownerIds },
        refetchQueries: [
          parentId 
            ? { query: GET_CHILDREN, variables: { parentId, first: 50 } }
            : { query: GET_ROOT_NODES, variables: { first: 50 } }
        ]
      });
    }
  }, [dialogState, updateNode, selectedNodeId, onSelectNode, createNode]);

  return (
    <div className={styles.sidebar}>
      <h2 className={styles.header}>Explorer</h2>
      <TreeView 
        selectedNodeId={selectedNodeId} 
        onSelectNode={onSelectNode} 
        onContextMenu={handleContextMenu} 
      />

      <ContextMenu
        isOpen={!!contextMenu}
        x={contextMenu?.x || 0}
        y={contextMenu?.y || 0}
        onClose={() => setContextMenu(null)}
        onAction={handleContextAction}
        nodeType={contextMenu?.node ? contextMenu.node.type : 'ROOT'}
      />

      <NodeDialog
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState({ ...dialogState, isOpen: false })}
        onSubmit={handleDialogSubmit}
        title={dialogState.mode === 'EDIT' ? 'Edit Node' : dialogState.mode === 'ADD_FOLDER' ? 'New Folder' : 'New File'}
        initialName={dialogState.mode === 'EDIT' ? dialogState.node?.name : ''}
        initialOwnerIds={dialogState.mode === 'EDIT' ? dialogState.node?.owners.map(u => u.id) : []}
        availableUsers={usersData?.users || []}
      />
    </div>
  );
}
