import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { QuickFilters, applyQuickFilters } from './QuickFilters';
import type { KanbanBoard, KanbanTicket } from '@opendock/shared/types';

// Mock data
const mockBoard: KanbanBoard = {
  id: 'board-1',
  name: 'Test Board',
  projectKey: 'TEST',
  columns: [],
  tickets: [],
  members: [],
  labels: [],
  sprints: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const createMockTicket = (overrides: Partial<KanbanTicket> = {}): KanbanTicket => ({
  id: 'ticket-1',
  title: 'Test Ticket',
  description: '',
  columnId: 'col-1',
  boardId: 'board-1',
  assigneeIds: [],
  tags: [],
  priority: 'medium',
  estimate: 0,
  position: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  issueType: 'task',
  ...overrides,
});

describe('QuickFilters', () => {
  describe('Rendering', () => {
    it('renders quick filters header', () => {
      const onFiltersChange = vi.fn();

      render(
        <QuickFilters
          board={mockBoard}
          onFiltersChange={onFiltersChange}
        />
      );

      expect(screen.getByText('Quick Filters')).toBeInTheDocument();
    });

    it('renders default filter buttons', () => {
      const onFiltersChange = vi.fn();

      render(
        <QuickFilters
          board={mockBoard}
          onFiltersChange={onFiltersChange}
        />
      );

      expect(screen.getByRole('button', { name: /my issues/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /recently updated/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /unassigned/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /due soon/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /overdue/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /high priority/i })).toBeInTheDocument();
    });

    it('shows "Show Less" button when all filters are expanded', async () => {
      const onFiltersChange = vi.fn();
      const user = userEvent.setup();

      render(
        <QuickFilters
          board={mockBoard}
          onFiltersChange={onFiltersChange}
        />
      );

      const expandButton = screen.getByRole('button', { name: /\+\d+ More/i });
      await user.click(expandButton);

      expect(screen.getByRole('button', { name: /show less/i })).toBeInTheDocument();
    });
  });

  describe('Filter Activation', () => {
    it('activates filter when clicked', async () => {
      const onFiltersChange = vi.fn();
      const user = userEvent.setup();

      render(
        <QuickFilters
          board={mockBoard}
          onFiltersChange={onFiltersChange}
        />
      );

      const unassignedButton = screen.getByRole('button', { name: /unassigned/i });
      await user.click(unassignedButton);

      expect(onFiltersChange).toHaveBeenCalled();
      const filterUpdate = onFiltersChange.mock.calls[0][0];
      const unassignedFilter = filterUpdate.find((f: any) => f.id === 'unassigned');
      expect(unassignedFilter.isActive).toBe(true);
    });

    it('deactivates filter when clicked again', async () => {
      const onFiltersChange = vi.fn();
      const user = userEvent.setup();

      render(
        <QuickFilters
          board={mockBoard}
          onFiltersChange={onFiltersChange}
        />
      );

      const unassignedButton = screen.getByRole('button', { name: /unassigned/i });

      // Click once to activate
      await user.click(unassignedButton);
      // Click again to deactivate
      await user.click(unassignedButton);

      const filterUpdate = onFiltersChange.mock.calls[1][0];
      const unassignedFilter = filterUpdate.find((f: any) => f.id === 'unassigned');
      expect(unassignedFilter.isActive).toBe(false);
    });

    it('shows active filters summary', async () => {
      const onFiltersChange = vi.fn();
      const user = userEvent.setup();

      render(
        <QuickFilters
          board={mockBoard}
          onFiltersChange={onFiltersChange}
        />
      );

      const unassignedButton = screen.getByRole('button', { name: /unassigned/i });
      await user.click(unassignedButton);

      expect(screen.getByText('Active:')).toBeInTheDocument();
      // Check that the active summary contains the filter name
      const allUnassignedText = screen.getAllByText('Unassigned');
      expect(allUnassignedText.length).toBeGreaterThan(0);
    });
  });

  describe('Clear All Functionality', () => {
    it('shows clear all button when filters are active', async () => {
      const onFiltersChange = vi.fn();
      const user = userEvent.setup();

      render(
        <QuickFilters
          board={mockBoard}
          onFiltersChange={onFiltersChange}
        />
      );

      const unassignedButton = screen.getByRole('button', { name: /unassigned/i });
      await user.click(unassignedButton);

      expect(screen.getByRole('button', { name: /clear all \(1\)/i })).toBeInTheDocument();
    });

    it('clears all filters when clear all is clicked', async () => {
      const onFiltersChange = vi.fn();
      const user = userEvent.setup();

      render(
        <QuickFilters
          board={mockBoard}
          onFiltersChange={onFiltersChange}
        />
      );

      // Activate a filter
      const unassignedButton = screen.getByRole('button', { name: /unassigned/i });
      await user.click(unassignedButton);

      // Clear all
      const clearButton = screen.getByRole('button', { name: /clear all/i });
      await user.click(clearButton);

      const filterUpdate = onFiltersChange.mock.calls[onFiltersChange.mock.calls.length - 1][0];
      const activeFilters = filterUpdate.filter((f: any) => f.isActive);
      expect(activeFilters.length).toBe(0);
    });
  });

  describe('Filter Logic', () => {
    it('filters unassigned tickets', () => {
      const tickets = [
        createMockTicket({ id: '1', assigneeIds: [] }),
        createMockTicket({ id: '2', assigneeIds: ['user-1'] }),
        createMockTicket({ id: '3', assigneeIds: [] }),
      ];

      const filters = [
        {
          id: 'unassigned',
          name: 'Unassigned',
          icon: () => null,
          description: 'No assignee',
          isActive: true,
          apply: (ticket: KanbanTicket) => ticket.assigneeIds.length === 0,
        },
      ];

      const filtered = applyQuickFilters(tickets, filters, mockBoard);
      expect(filtered.length).toBe(2);
      expect(filtered.map(t => t.id)).toEqual(['1', '3']);
    });

    it('filters high priority tickets', () => {
      const tickets = [
        createMockTicket({ id: '1', priority: 'high' }),
        createMockTicket({ id: '2', priority: 'low' }),
        createMockTicket({ id: '3', priority: 'high' }),
      ];

      const filters = [
        {
          id: 'high-priority',
          name: 'High Priority',
          icon: () => null,
          description: 'High priority items',
          isActive: true,
          apply: (ticket: KanbanTicket) => ticket.priority === 'high',
        },
      ];

      const filtered = applyQuickFilters(tickets, filters, mockBoard);
      expect(filtered.length).toBe(2);
      expect(filtered.map(t => t.id)).toEqual(['1', '3']);
    });

    it('filters recently updated tickets', () => {
      const now = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

      const tickets = [
        createMockTicket({ id: '1', updatedAt: now.toISOString() }),
        createMockTicket({ id: '2', updatedAt: tenDaysAgo.toISOString() }),
        createMockTicket({ id: '3', updatedAt: sevenDaysAgo.toISOString() }),
      ];

      const filters = [
        {
          id: 'recently-updated',
          name: 'Recently Updated',
          icon: () => null,
          description: 'Updated in the last 7 days',
          isActive: true,
          apply: (ticket: KanbanTicket) => {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const updatedDate = new Date(ticket.updatedAt);
            return updatedDate >= sevenDaysAgo;
          },
        },
      ];

      const filtered = applyQuickFilters(tickets, filters, mockBoard);
      expect(filtered.length).toBe(2);
      expect(filtered.map(t => t.id)).toEqual(['1', '3']);
    });

    it('filters tickets with labels', () => {
      const tickets = [
        createMockTicket({ id: '1', labelIds: ['label-1'] }),
        createMockTicket({ id: '2', labelIds: [] }),
        createMockTicket({ id: '3', labelIds: ['label-2', 'label-3'] }),
      ];

      const filters = [
        {
          id: 'has-labels',
          name: 'Has Labels',
          icon: () => null,
          description: 'Items with labels',
          isActive: true,
          apply: (ticket: KanbanTicket) => ticket.labelIds && ticket.labelIds.length > 0,
        },
      ];

      const filtered = applyQuickFilters(tickets, filters, mockBoard);
      expect(filtered.length).toBe(2);
      expect(filtered.map(t => t.id)).toEqual(['1', '3']);
    });

    it('filters by issue type', () => {
      const tickets = [
        createMockTicket({ id: '1', issueType: 'bug' }),
        createMockTicket({ id: '2', issueType: 'task' }),
        createMockTicket({ id: '3', issueType: 'bug' }),
      ];

      const filters = [
        {
          id: 'bugs',
          name: 'Bugs',
          icon: () => null,
          description: 'Bug type issues',
          isActive: true,
          apply: (ticket: KanbanTicket) => ticket.issueType === 'bug',
        },
      ];

      const filtered = applyQuickFilters(tickets, filters, mockBoard);
      expect(filtered.length).toBe(2);
      expect(filtered.map(t => t.id)).toEqual(['1', '3']);
    });

    it('applies multiple filters with AND logic', () => {
      const tickets = [
        createMockTicket({ id: '1', priority: 'high', assigneeIds: [] }),
        createMockTicket({ id: '2', priority: 'high', assigneeIds: ['user-1'] }),
        createMockTicket({ id: '3', priority: 'low', assigneeIds: [] }),
      ];

      const filters = [
        {
          id: 'high-priority',
          name: 'High Priority',
          icon: () => null,
          description: 'High priority items',
          isActive: true,
          apply: (ticket: KanbanTicket) => ticket.priority === 'high',
        },
        {
          id: 'unassigned',
          name: 'Unassigned',
          icon: () => null,
          description: 'No assignee',
          isActive: true,
          apply: (ticket: KanbanTicket) => ticket.assigneeIds.length === 0,
        },
      ];

      const filtered = applyQuickFilters(tickets, filters, mockBoard);
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('1');
    });

    it('returns all tickets when no filters are active', () => {
      const tickets = [
        createMockTicket({ id: '1' }),
        createMockTicket({ id: '2' }),
        createMockTicket({ id: '3' }),
      ];

      const filters = [
        {
          id: 'unassigned',
          name: 'Unassigned',
          icon: () => null,
          description: 'No assignee',
          isActive: false,
          apply: (ticket: KanbanTicket) => ticket.assigneeIds.length === 0,
        },
      ];

      const filtered = applyQuickFilters(tickets, filters, mockBoard);
      expect(filtered.length).toBe(3);
    });
  });

  describe('Due Date Filters', () => {
    it('filters due soon tickets', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 10);

      const tickets = [
        createMockTicket({ id: '1', dueDate: tomorrow.toISOString() }),
        createMockTicket({ id: '2', dueDate: nextWeek.toISOString() }),
        createMockTicket({ id: '3' }), // No due date
      ];

      const filters = [
        {
          id: 'due-soon',
          name: 'Due Soon',
          icon: () => null,
          description: 'Due in the next 7 days',
          isActive: true,
          apply: (ticket: KanbanTicket) => {
            if (!ticket.dueDate) return false;
            const dueDate = new Date(ticket.dueDate);
            const now = new Date();
            const sevenDaysFromNow = new Date();
            sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
            return dueDate >= now && dueDate <= sevenDaysFromNow;
          },
        },
      ];

      const filtered = applyQuickFilters(tickets, filters, mockBoard);
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('1');
    });

    it('filters overdue tickets', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const tickets = [
        createMockTicket({ id: '1', dueDate: yesterday.toISOString() }),
        createMockTicket({ id: '2', dueDate: tomorrow.toISOString() }),
        createMockTicket({ id: '3' }), // No due date
      ];

      const filters = [
        {
          id: 'overdue',
          name: 'Overdue',
          icon: () => null,
          description: 'Past due date',
          isActive: true,
          apply: (ticket: KanbanTicket) => {
            if (!ticket.dueDate) return false;
            const dueDate = new Date(ticket.dueDate);
            return dueDate < new Date();
          },
        },
      ];

      const filtered = applyQuickFilters(tickets, filters, mockBoard);
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('1');
    });
  });
});
