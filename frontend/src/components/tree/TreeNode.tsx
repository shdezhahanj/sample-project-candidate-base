'use client';

import React, { useState, useEffect, useCallback, memo } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_CHILDREN } from '@/lib/graphql';
import { FolderIcon } from '../atoms/Icon/FolderIcon';
import { FileIcon } from '../atoms/Icon/FileIcon';
import { ChevronRight } from '../atoms/Icon/ChevronRight';
import { ChevronDown } from '../atoms/Icon/ChevronDown';
import { NodeData } from '@/types';
import { useSelectionStore } from './SelectionContext';
import styles from './tree.module.css';

interface TreeNodeProps {
  node: NodeData;
  level: number;
  onSelectNode: (node: NodeData) => void;
  onContextMenu: (e: React.MouseEvent, node: NodeData) => void;
  forceExpanded?: boolean;
}

export const TreeNode = memo(function TreeNode({
  node,
  level,
  onSelectNode,
  onContextMenu,
  forceExpanded = false,
}: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(forceExpanded);

  // Lazy load children
  const { data, loading, fetchMore } = useQuery<{ children: NodeData[] }, { parentId: string; first?: number; after?: string }>(GET_CHILDREN, {
    variables: { parentId: node.id, first: 50 },
    skip: !isExpanded || node.type === 'FILE',
    fetchPolicy: 'cache-first',
  });

  const store = useSelectionStore();
  const [isSelected, setIsSelected] = useState(() => store.getSelectedId() === node.id);

  useEffect(() => {
    setIsSelected(store.getSelectedId() === node.id);
    return store.subscribe((selectedId) => {
      setIsSelected(selectedId === node.id);
    });
  }, [node.id, store]);

  const loadMore = useCallback(() => {
    if (!data?.children?.length) return;
    const lastNode = data.children[data.children.length - 1];
    fetchMore({
      variables: {
        parentId: node.id,
        first: 50,
        after: lastNode.id,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return {
          children: [...prev.children, ...fetchMoreResult.children]
        };
      }
    });
  }, [data, fetchMore, node.id]);

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.type === 'FOLDER') {
      setIsExpanded(prev => !prev);
    }
  }, [node.type]);

  const handleSelect = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectNode(node);
  }, [node, onSelectNode]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectNode(node); // Auto-select on right click
    onContextMenu(e, node);
  }, [node, onSelectNode, onContextMenu]);

  return (
    <div>
      <div
        className={`${styles.node} ${isSelected ? styles.nodeSelected : ''}`}
        onClick={handleSelect}
        onContextMenu={handleContextMenu}
      >
        {node.type === 'FOLDER' && node.hasChildren ? (
          <div className={styles.arrow} onClick={handleToggle}>
            {isExpanded ? <ChevronDown /> : <ChevronRight />}
          </div>
        ) : (
          <div className={styles.arrowEmpty} />
        )}
        <div className={styles.icon}>{node.type === 'FOLDER' ? <FolderIcon /> : <FileIcon />}</div>
        <span className={styles.label}>{node.name}</span>
      </div>

      {isExpanded && node.type === 'FOLDER' && (
        <div className={styles.children}>
          {loading && !data ? (
            <div className={`${styles.node} ${styles.loading}`}>
              Loading...
            </div>
          ) : (
            <>
              {data?.children.map((child: NodeData) => (
                <TreeNode
                  key={child.id}
                  node={child}
                  level={level + 1}
                  onSelectNode={onSelectNode}
                  onContextMenu={onContextMenu}
                />
              ))}
              {data?.children && data.children.length > 0 && data.children.length % 50 === 0 && (
                <div className={styles.loadMoreNested} onClick={(e) => { e.stopPropagation(); loadMore(); }}>
                  Load more...
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
});
