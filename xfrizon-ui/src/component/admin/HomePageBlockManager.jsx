import React, { useEffect, useState } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import SortableBlock from "./SortableBlock";

const DEFAULT_BLOCKS = [
  { id: "centeredBanner", label: "Centered Banner" },
  { id: "heroSection", label: "Hero Section" },
  { id: "blogsSection", label: "Blogs Section" },
  { id: "partnersSection", label: "Partners Section" },
  { id: "eventSection", label: "Event Section" },
];

export default function HomePageBlockManager({
  blocks = DEFAULT_BLOCKS,
  onChange,
}) {
  const [items, setItems] = useState(blocks);

  useEffect(() => {
    setItems(blocks);
  }, [blocks]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);
      if (onChange) onChange(newItems);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-bold mb-2">HomePage Block Order</h3>
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          {items.map((block) => (
            <SortableBlock key={block.id} id={block.id} label={block.label} />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}
