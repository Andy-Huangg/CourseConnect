import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  PointerSensor,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, type ReactNode } from "react";
import { ListItem, ListItemButton, Box, Typography } from "@mui/material";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";

interface DraggableItem<T = unknown> {
  id: number;
  data: T;
}

interface DraggableListProps<T = unknown> {
  items: DraggableItem<T>[];
  onReorder: (newOrder: number[]) => void;
  onItemClick?: (item: T) => void;
  renderItem: (item: T, isDragging?: boolean) => ReactNode;
  isSelected?: (item: T) => boolean;
  showReorderHint?: boolean;
}

function SortableItem<T>({
  item,
  renderItem,
  onItemClick,
  isSelected,
}: {
  item: DraggableItem<T>;
  renderItem: (item: T) => ReactNode;
  onItemClick?: (item: T) => void;
  isSelected?: (item: T) => boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1000 : "auto",
  };

  const handleClick = (event: React.MouseEvent) => {
    // Prevent click during drag operations
    if (isDragging) {
      event.preventDefault();
      return;
    }

    if (onItemClick) {
      onItemClick(item.data);
    }
  };

  const handleDragHandleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  return (
    <ListItem
      ref={setNodeRef}
      style={style}
      sx={{
        touchAction: "none",
        position: "relative",
      }}
      disablePadding
    >
      <ListItemButton
        onClick={handleClick}
        selected={isSelected ? isSelected(item.data) : false}
        sx={{
          borderRadius: 1.5,
          mx: 1.5,
          mb: 0.5,
          transition: "all 0.2s ease",
          cursor: "pointer",
          pl: 1,
          display: "flex",
          alignItems: "center",
          "&:hover": {
            backgroundColor: "rgba(114, 137, 218, 0.05)",
            "& .drag-handle": {
              opacity: 1,
            },
          },
          "&.Mui-selected": {
            backgroundColor: "rgba(102, 51, 153, 0.1)",
            color: "#663399",
          },
        }}
      >
        {/* Drag Handle */}
        <Box
          className="drag-handle"
          onClick={handleDragHandleClick}
          sx={{
            opacity: 0,
            transition: "opacity 0.2s ease",
            cursor: "grab",
            display: "flex",
            alignItems: "center",
            mr: 1,
            p: 0.5,
            borderRadius: 0.5,
            color: "text.secondary",
            "&:hover": {
              backgroundColor: "rgba(0, 0, 0, 0.04)",
            },
            "&:active": {
              cursor: "grabbing",
            },
          }}
          {...attributes}
          {...listeners}
        >
          <DragIndicatorIcon fontSize="small" />
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, display: "flex", alignItems: "center" }}>
          {renderItem(item.data)}
        </Box>
      </ListItemButton>
    </ListItem>
  );
}

export default function DraggableList<T>({
  items,
  onReorder,
  onItemClick,
  renderItem,
  isSelected,
  showReorderHint = true,
}: DraggableListProps<T>) {
  const [activeId, setActiveId] = useState<number | null>(null);

  // Improved sensor configuration for better mobile support
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before activating
      },
    }),
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150, // Shorter delay for better responsiveness
        tolerance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && over) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newItems = arrayMove(items, oldIndex, newIndex);
        const newOrder = newItems.map((item) => item.id);
        onReorder(newOrder);
      }
    }

    setActiveId(null);
  };

  const activeItem = items.find((item) => item.id === activeId);

  return (
    <>
      {showReorderHint && items.length > 1 && (
        <Box sx={{ px: 2.5, pb: 1 }}>
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              fontSize: "0.6875rem",
              display: "flex",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            <DragIndicatorIcon sx={{ fontSize: "0.875rem" }} />
            Drag to reorder
          </Typography>
        </Box>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          {items.map((item) => (
            <SortableItem
              key={item.id}
              item={item}
              renderItem={renderItem}
              onItemClick={onItemClick}
              isSelected={isSelected}
            />
          ))}
        </SortableContext>
        <DragOverlay dropAnimation={null}>
          {activeId && activeItem ? (
            <ListItem
              sx={{
                backgroundColor: "background.paper",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                borderRadius: 1.5,
                border: "1px solid",
                borderColor: "divider",
                transform: "scale(1.02)",
              }}
              disablePadding
            >
              <ListItemButton
                sx={{
                  borderRadius: 1.5,
                  pl: 1,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {/* Drag Handle in overlay */}
                <Box
                  sx={{
                    opacity: 1,
                    display: "flex",
                    alignItems: "center",
                    mr: 1,
                    p: 0.5,
                    borderRadius: 0.5,
                    color: "text.secondary",
                  }}
                >
                  <DragIndicatorIcon fontSize="small" />
                </Box>

                {/* Content */}
                <Box sx={{ flex: 1, display: "flex", alignItems: "center" }}>
                  {renderItem(activeItem.data, true)}
                </Box>
              </ListItemButton>
            </ListItem>
          ) : null}
        </DragOverlay>
      </DndContext>
    </>
  );
}
