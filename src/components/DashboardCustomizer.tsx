import { useState } from 'react';
import { Settings2, Eye, EyeOff, GripVertical, X, Pencil, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { DashboardBlock, useDashboardLayout } from '@/hooks/useDashboardLayout';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useToast } from '@/hooks/use-toast';

function SortableBlock({ block, onToggle, onRename }: { block: DashboardBlock; onToggle: () => void; onRename: (title: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: block.id });
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(block.title);

  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 border border-border/50">
      <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground">
        <GripVertical className="h-4 w-4" />
      </button>
      {editing ? (
        <div className="flex-1 flex gap-1">
          <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="h-7 text-sm bg-background" autoFocus />
          <button onClick={() => { onRename(editTitle); setEditing(false); }} className="text-success"><Check className="h-4 w-4" /></button>
          <button onClick={() => setEditing(false)} className="text-muted-foreground"><X className="h-4 w-4" /></button>
        </div>
      ) : (
        <>
          <span className={`flex-1 text-sm ${block.visible ? 'text-foreground' : 'text-muted-foreground line-through'}`}>{block.title}</span>
          <button onClick={() => setEditing(true)} className="text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
        </>
      )}
      <button onClick={onToggle} className="text-muted-foreground hover:text-foreground">
        {block.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function DashboardCustomizer() {
  const { blocks, saveLayout } = useDashboardLayout();
  const [localBlocks, setLocalBlocks] = useState<DashboardBlock[]>(blocks);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) setLocalBlocks(blocks);
    setOpen(isOpen);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLocalBlocks(prev => {
        const oldIdx = prev.findIndex(b => b.id === active.id);
        const newIdx = prev.findIndex(b => b.id === over.id);
        return arrayMove(prev, oldIdx, newIdx).map((b, i) => ({ ...b, order: i }));
      });
    }
  };

  const handleSave = () => {
    saveLayout.mutateAsync(localBlocks);
    setOpen(false);
    toast({ title: 'Layout salvo!' });
  };

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Settings2 className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-card border-border w-80">
        <SheetHeader>
          <SheetTitle className="font-display">Personalizar Dashboard</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-2">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={localBlocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
              {localBlocks.map(block => (
                <SortableBlock
                  key={block.id}
                  block={block}
                  onToggle={() => setLocalBlocks(prev => prev.map(b => b.id === block.id ? { ...b, visible: !b.visible } : b))}
                  onRename={(title) => setLocalBlocks(prev => prev.map(b => b.id === block.id ? { ...b, title } : b))}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
        <Button onClick={handleSave} className="w-full mt-4 gradient-silver text-primary-foreground">
          Salvar Layout
        </Button>
      </SheetContent>
    </Sheet>
  );
}
