'use client';

import React, { useCallback } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_ROOT_NODES } from '@/lib/graphql';
import { TreeNode } from './TreeNode';
import { NodeData } from '@/types';
import { SelectionProvider } from './SelectionContext';
import styles from './tree.module.css';

interface TreeViewProps {
  selectedNodeId: string | null;
  onSelectNode: (node: NodeData | null) => void;
  onContextMenu: (e: React.MouseEvent, node: NodeData | null) => void;
}

export function TreeView({ selectedNodeId, onSelectNode, onContextMenu }: TreeViewProps) {
  const { data, loading, error, fetchMore } = useQuery<{ rootNodes: NodeData[] }, { first?: number; after?: string }>(GET_ROOT_NODES, {
    variables: { first: 50 },
    fetchPolicy: 'cache-and-network',
  });

  const handleRootContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu(e, null); // null node means root level
  }, [onContextMenu]);

  const loadMore = useCallback(() => {
    if (!data?.rootNodes?.length) return;
    const lastNode = data.rootNodes[data.rootNodes.length - 1];
    fetchMore({
      variables: {
        first: 50,
        after: lastNode.id,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return {
          rootNodes: [...prev.rootNodes, ...fetchMoreResult.rootNodes]
        };
      }
    });
  }, [data, fetchMore]);

  if (loading && !data) return <div className={styles.treeContainer}>Loading tree...</div>;
  if (error) return <div className={styles.treeContainer}>Error loading tree.</div>;

  return (
    <SelectionProvider selectedNodeId={selectedNodeId}>
      <div className={styles.treeContainer} onContextMenu={handleRootContextMenu} onClick={() => onSelectNode(null)}>
        {data?.rootNodes.map((node: NodeData) => (
          <TreeNode
            key={node.id}
            node={node}
            level={0}
            onSelectNode={onSelectNode}
            onContextMenu={onContextMenu}
          />
        ))}
        {data?.rootNodes && data.rootNodes.length > 0 && data.rootNodes.length % 50 === 0 && (
          <div className={styles.loadMore} onClick={(e) => { e.stopPropagation(); loadMore(); }}>
            Load more...
          </div>
        )}
      </div>
    </SelectionProvider>
  );
}
