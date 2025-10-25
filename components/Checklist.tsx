import React from 'react';
import { ChecklistItemData } from '../types';
import ChecklistItem from './ChecklistItem';

interface ChecklistProps {
  items: ChecklistItemData[];
  onUpdateItem: (id: string, update: Partial<ChecklistItemData>) => void;
  onTakePhoto: (id: string) => void;
}

const Checklist: React.FC<ChecklistProps> = ({ items, onUpdateItem, onTakePhoto }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {items.map(item => (
        <ChecklistItem key={item.id} item={item} onUpdate={onUpdateItem} onTakePhoto={onTakePhoto}/>
      ))}
    </div>
  );
};

export default Checklist;
