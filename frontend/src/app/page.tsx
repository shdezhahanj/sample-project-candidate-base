'use client';

import React, { useState, useCallback } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { DetailsPanel } from '@/components/layout/DetailsPanel';
import { NodeData } from '@/types';
import styles from './page.module.css';

export default function HomePage() {
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);

  const handleNavigate = useCallback((node: NodeData) => {
    setSelectedNode(node);
  }, []);

  return (
    <main className={styles.container}>
      <Sidebar 
        selectedNodeId={selectedNode?.id || null} 
        onSelectNode={setSelectedNode} 
      />
      <div className={styles.mainContent}>
        <DetailsPanel 
          node={selectedNode} 
          onNavigate={handleNavigate} 
          onSelectNode={setSelectedNode}
        />
      </div>
    </main>
  );
}
