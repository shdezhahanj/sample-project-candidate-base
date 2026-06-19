import React, { useEffect } from 'react';
import styles from './modal.module.css';

interface ContextMenuProps {
  x: number;
  y: number;
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: 'ADD_FOLDER' | 'ADD_FILE' | 'EDIT' | 'REMOVE') => void;
  nodeType: 'FOLDER' | 'FILE' | 'ROOT';
}

export function ContextMenu({ x, y, isOpen, onClose, onAction, nodeType }: ContextMenuProps) {
  useEffect(() => {
    const handleClickOutside = () => {
      if (isOpen) onClose();
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.contextMenu}
      style={{ top: y, left: x }}
      onClick={(e) => e.stopPropagation()}
    >
      {nodeType !== 'FILE' && (
        <>
          <div className={styles.menuItem} onClick={() => onAction('ADD_FOLDER')}>
            Add Folder
          </div>
          <div className={styles.menuItem} onClick={() => onAction('ADD_FILE')}>
            Add File
          </div>
        </>
      )}
      {nodeType !== 'ROOT' && (
        <div className={styles.menuItem} onClick={() => onAction('EDIT')}>
          Edit
        </div>
      )}
      {nodeType !== 'ROOT' && (
        <div className={`${styles.menuItem} ${styles.menuItemDanger}`} onClick={() => onAction('REMOVE')}>
          Remove
        </div>
      )}
    </div>
  );
}
