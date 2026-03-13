import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BoardColumn } from '@/components/home/activation-table/components/BoardColumn';
import type { TaskCardData } from '@/components/home/activation-table/components/TaskCard';

const tasks: TaskCardData[] = [
  {
    id: 'task-1',
    title: 'Complete 2 selected modules',
    subtitle: 'Continue through these selected theory modules in your track.',
    statusLabel: '2 linked items'
  },
  {
    id: 'task-2',
    title: 'Complete Module 8: Complex Data Types',
    subtitle: 'Continue through this theory module in your track.',
    statusLabel: '1 linked item'
  }
];

describe('BoardColumn', () => {
  it('forwards same-column reorder preview and drop placement', () => {
    const previewSpy = vi.fn();
    const dropSpy = vi.fn();

    render(
      <BoardColumn
        title="To Do"
        state="todo"
        tasks={tasks}
        draggedTaskId="task-2"
        onTaskReorderPreview={previewSpy}
        onTaskReorderDrop={dropSpy}
      />
    );

    const targetTaskDropTarget = screen
      .getByText('Complete 2 selected modules')
      .closest('article')
      ?.parentElement;

    expect(targetTaskDropTarget).not.toBeNull();
    vi.spyOn(targetTaskDropTarget!, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 10,
      top: 10,
      right: 320,
      bottom: 90,
      left: 0,
      width: 320,
      height: 80,
      toJSON: () => ({})
    } as DOMRect);

    const dataTransfer = {
      effectAllowed: 'move',
      dropEffect: 'move',
      setData: vi.fn(),
      getData: vi.fn()
    } as unknown as DataTransfer;

    fireEvent.dragOver(targetTaskDropTarget!, { dataTransfer, clientY: 20 });
    fireEvent.drop(targetTaskDropTarget!, { dataTransfer, clientY: 20 });

    expect(previewSpy).toHaveBeenCalledWith('todo', 'task-1', 'after');
    expect(dropSpy).toHaveBeenCalledWith('todo', 'task-1', 'after');
  });
});
