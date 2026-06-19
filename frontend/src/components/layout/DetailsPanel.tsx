'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { GET_ANCESTORS, GET_FOLDERS, UPDATE_NODE, GET_ROOT_NODES, GET_CHILDREN } from '@/lib/graphql';
import { NodeData, FolderData } from '@/types';
import { useDebounce } from '@/lib/useDebounce';
import styles from './detailsPanel.module.css';

interface DetailsPanelProps {
  node: NodeData | null;
  onNavigate: (node: NodeData) => void;
  onSelectNode: (node: NodeData | null) => void;
}

export function DetailsPanel({ node, onNavigate, onSelectNode }: DetailsPanelProps) {
  const { data: ancestorsData } = useQuery<{ ancestors: NodeData[] }, { nodeId?: string }>(GET_ANCESTORS, {
    variables: { nodeId: node?.id },
    skip: !node,
    fetchPolicy: 'cache-and-network',
  });

  const [parentSearch, setParentSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(parentSearch, 300);

  const { data: foldersData, loading: foldersLoading } = useQuery<
    { folders: FolderData[] },
    { search?: string; limit?: number; excludeDescendantsOf?: string }
  >(GET_FOLDERS, {
    variables: { search: debouncedSearch, limit: 100, excludeDescendantsOf: node?.id },
    fetchPolicy: 'cache-and-network',
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setParentSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setParentSearch('');
      (e.target as HTMLInputElement).blur();
    }
  };

  const [updateNode] = useMutation<{ updateNode: NodeData }, { id: string; parentId: string | null }>(UPDATE_NODE, {
    update(cache, { data }) {
      const updatedNode = data?.updateNode;
      if (updatedNode?.parentId) {
        cache.writeFragment({
          id: cache.identify({ __typename: 'Node', id: updatedNode.parentId }),
          fragment: gql`
            fragment NewParentFolder on Node {
              hasChildren
            }
          `,
          data: { hasChildren: true },
        });
      }
    }
  });

  const handleSelectParent = useCallback(async (newParentId: string | null) => {
    if (!node) return;
    try {
      const { data } = await updateNode({
        variables: { id: node.id, parentId: newParentId },
        refetchQueries: [
          node.parentId 
            ? { query: GET_CHILDREN, variables: { parentId: node.parentId, first: 50 } }
            : { query: GET_ROOT_NODES, variables: { first: 50 } },
          newParentId 
            ? { query: GET_CHILDREN, variables: { parentId: newParentId, first: 50 } }
            : { query: GET_ROOT_NODES, variables: { first: 50 } },
          { query: GET_ANCESTORS, variables: { nodeId: node.id } }
        ],
        update(cache, { data: mutationData }) {
          const updatedNode = mutationData?.updateNode;
          if (newParentId) {
            cache.writeFragment({
              id: cache.identify({ __typename: 'Node', id: newParentId }),
              fragment: gql`
                fragment NewParentFolder on Node {
                  hasChildren
                }
              `,
              data: { hasChildren: true },
            });
          }

          const oldParentId = node.parentId;
          if (oldParentId) {
            const cacheData = cache.readQuery<{ children: NodeData[] }>({
              query: GET_CHILDREN,
              variables: { parentId: oldParentId, first: 50 }
            });
            if (cacheData?.children) {
              const updatedChildren = cacheData.children.filter((c: NodeData) => c.id !== node.id);
              cache.writeQuery<{ children: NodeData[] }>({
                query: GET_CHILDREN,
                variables: { parentId: oldParentId, first: 50 },
                data: { children: updatedChildren }
              });

              if (updatedChildren.length === 0) {
                cache.writeFragment({
                  id: cache.identify({ __typename: 'Node', id: oldParentId }),
                  fragment: gql`
                    fragment EmptyOldParentFolder on Node {
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
      if (data?.updateNode) {
        onSelectNode(data.updateNode);
      }
    } catch (err) {
      console.error('Failed to change parent', err);
      alert('Cannot move folder there.');
    }
  }, [node, updateNode, onSelectNode]);

  const ancestors = ancestorsData?.ancestors || [];

  // Find current parent node from ancestors
  const { parentNode, parentName } = useMemo(() => {
    if (!node) return { parentNode: null, parentName: 'Top Level' };
    const parent = node.parentId && ancestors.find((a: NodeData) => a.id === node.parentId);
    const name = parent ? parent.name : (node.parentId ? 'Unknown Folder' : 'Top Level');
    return { parentNode: parent, parentName: name };
  }, [node, ancestors]);

  // Prepare folders list for dropdown
  const foldersList = useMemo(() => {
    if (!node) return [];
    let list = foldersData?.folders ? [...foldersData.folders] : [];
    
    // Filter out the node itself so it cannot be selected as its own parent
    list = list.filter((f: FolderData) => f.id !== node.id);

    // If there is a current parent, and it's not in the fetched folders list, add it
    if (node.parentId && !list.some((f: FolderData) => f.id === node.parentId)) {
      list.push({
        id: node.parentId,
        name: parentName,
        type: 'FOLDER',
        parentId: parentNode ? parentNode.parentId : null,
      });
    }
    return list;
  }, [foldersData, node, parentName, parentNode]);

  if (!node) {
    return (
      <div className={styles.details}>
        <p className={styles.placeholder}>Select a folder or file to view details.</p>
      </div>
    );
  }

  return (
    <div className={styles.details}>
      <div className={styles.breadcrumb}>
        {ancestors.map((anc: NodeData, index: number) => (
          <React.Fragment key={anc.id}>
            {index > 0 && ' > '}
            <a onClick={() => onNavigate(anc)}>{anc.name}</a>
          </React.Fragment>
        ))}
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Name</span>
        <span className={styles.value}>{node.name}</span>
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Type</span>
        <span className={styles.value}>{node.type}</span>
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Owners</span>
        <span className={styles.value}>
          {node.owners?.map(o => o.name).join(', ') || 'None'}
        </span>
      </div>

      <hr className={styles.divider} />

      <div className={styles.field}>
        <span className={styles.label}>Change parent</span>
        <span className={styles.helpText}>Move this {node.type.toLowerCase()} to a different folder:</span>
        
        <div ref={selectRef} className={styles.dropdownContainer}>
          <div className={styles.dropdownInputWrapper}>
            <input
              type="text"
              placeholder="Search parent folder..."
              value={isOpen ? parentSearch : parentName}
              onChange={(e) => {
                if (!isOpen) setIsOpen(true);
                setParentSearch(e.target.value);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              className={styles.dropdownInput}
            />
            <div className={`${styles.dropdownArrow} ${isOpen ? styles.dropdownArrowOpen : ''}`}>
              <DropdownArrow />
            </div>
          </div>

          {isOpen && (
            <div className={styles.dropdownList}>
              <div 
                className={`${styles.dropdownItem} ${!node.parentId ? styles.dropdownItemActive : ''}`}
                onClick={() => {
                  handleSelectParent(null);
                  setIsOpen(false);
                  setParentSearch('');
                }}
              >
                -- Top Level --
              </div>
              
              {foldersList.map((folder: FolderData) => {
                const isSelected = folder.id === node.parentId;
                return (
                  <div
                    key={folder.id}
                    className={`${styles.dropdownItem} ${isSelected ? styles.dropdownItemActive : ''}`}
                    onClick={() => {
                      handleSelectParent(folder.id);
                      setIsOpen(false);
                      setParentSearch('');
                    }}
                  >
                    {folder.name}
                  </div>
                );
              })}

              {foldersList.length === 0 && !foldersLoading && (
                <div className={styles.dropdownNoResults}>No folders found</div>
              )}
              {foldersLoading && (
                <div className={styles.dropdownNoResults}>Loading...</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const DropdownArrow = () => (
  <svg
    width="10"
    height="6"
    viewBox="0 0 10 6"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M1 1L5 5L9 1"
      stroke="#666"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
