import React, { useState, useEffect } from 'react';
import styles from './modal.module.css';

interface User {
  id: string;
  name: string;
}

interface NodeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, ownerIds: string[]) => void;
  title: string;
  initialName?: string;
  initialOwnerIds?: string[];
  availableUsers: User[];
}

export function NodeDialog({
  isOpen,
  onClose,
  onSubmit,
  title,
  initialName = '',
  initialOwnerIds = [],
  availableUsers,
}: NodeDialogProps) {
  const [name, setName] = useState(initialName);
  const [ownerIds, setOwnerIds] = useState<string[]>(initialOwnerIds);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setOwnerIds(initialOwnerIds);
    }
  }, [isOpen, initialName, initialOwnerIds]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim(), ownerIds);
    }
  };

  const handleOwnerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const selected: string[] = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    setOwnerIds(selected);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>{title}</h2>
        <form onSubmit={handleSubmit} className={styles.field}>
          <label className={styles.label}>Name</label>
          <input
            autoFocus
            className={styles.input}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter name..."
          />

          <label className={styles.labelWithOwnerSpacing}>
            Owners
          </label>
          <select
            multiple
            className={styles.select}
            value={ownerIds}
            onChange={handleOwnerChange}
            size={4}
          >
            {availableUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>

          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={`${styles.btn} ${styles.btnCancel}`}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || ownerIds.length === 0}
              className={`${styles.btn} ${styles.btnSubmit}`}
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
