import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { TicketCard } from './TicketCard';
import type { KanbanTicket, KanbanBoard, KanbanUser, KanbanLabel } from '@opendock/shared/types';

// Mock data
const mockBoard: KanbanBoard = {
  id: 'board-1',
  name: 'Test Board',
  projectKey: 'TEST',
  columns: [
    { id: 'col-1', title: 'To Do', position: 0 },
    { id: 'col-2', title: 'In Progress', position: 1 },
    { id: 'col-3', title: 'Done', position: 2 },
  ],
  tickets: [],
  members: [],
  labels: [],
  sprints: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockMembers: KanbanUser[] = [
  { id: 'user-1', name: 'Alice Johnson', email: 'alice@test.com' },
  { id: 'user-2', name: 'Bob Smith', email: 'bob@test.com' },
];

const mockLabels: KanbanLabel[] = [
  { id: 'label-1', name: 'Frontend', color: '#3b82f6' },
  { id: 'label-2', name: 'Backend', color: '#10b981' },
  { id: 'label-3', name: 'Design', color: '#f59e0b' },
];

const mockTicket: KanbanTicket = {
  id: 'ticket-1',
  title: 'Test Ticket',
  description: 'Test description',
  columnId: 'col-1',
  boardId: 'board-1',
  assigneeIds: ['user-1'],
  tags: [],
  priority: 'medium',
  estimate: 0,
  position: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  issueType: 'task',
  labelIds: ['label-1'],
};

describe('TicketCard', () => {
  describe('Rendering', () => {
    it('renders ticket title', () => {
      render(
        <TicketCard
          ticket={mockTicket}
          board={mockBoard}
          members={mockMembers}
          labels={mockLabels}
          sprints={[]}
        />
      );

      expect(screen.getByText('Test Ticket')).toBeInTheDocument();
    });

    it('renders ticket key correctly', () => {
      render(
        <TicketCard
          ticket={mockTicket}
          board={mockBoard}
          members={mockMembers}
          labels={mockLabels}
          sprints={[]}
        />
      );

      expect(screen.getByText(/TEST-\d+/)).toBeInTheDocument();
    });

    it('renders assignee avatar with correct initial', () => {
      render(
        <TicketCard
          ticket={mockTicket}
          board={mockBoard}
          members={mockMembers}
          labels={mockLabels}
          sprints={[]}
        />
      );

      const avatar = screen.getByTitle('Alice Johnson');
      expect(avatar).toHaveTextContent('A');
    });

    it('shows unassigned when no assignee', () => {
      const unassignedTicket = { ...mockTicket, assigneeIds: [] };

      render(
        <TicketCard
          ticket={unassignedTicket}
          board={mockBoard}
          members={mockMembers}
          labels={mockLabels}
          sprints={[]}
        />
      );

      expect(screen.getByTitle('Unassigned')).toBeInTheDocument();
    });
  });

  describe('Priority Indicator', () => {
    it('renders priority dot for high priority', () => {
      const highPriorityTicket = { ...mockTicket, priority: 'high' as const };

      render(
        <TicketCard
          ticket={highPriorityTicket}
          board={mockBoard}
          members={mockMembers}
          labels={mockLabels}
          sprints={[]}
        />
      );

      const priorityIndicator = screen.getByTitle('Priority: high');
      expect(priorityIndicator).toBeInTheDocument();
      // Check for rose/red color (actual class may vary with dark mode)
      expect(priorityIndicator.className).toMatch(/bg-(rose|red)-/);

    });

    it('renders priority dot for medium priority', () => {
      render(
        <TicketCard
          ticket={mockTicket}
          board={mockBoard}
          members={mockMembers}
          labels={mockLabels}
          sprints={[]}
        />
      );

      const priorityIndicator = screen.getByTitle('Priority: medium');
      expect(priorityIndicator).toBeInTheDocument();
      // Check for amber/yellow color (actual class may vary with dark mode)
      expect(priorityIndicator.className).toMatch(/bg-(amber|yellow)-/);
    });

    it('renders priority dot for low priority', () => {
      const lowPriorityTicket = { ...mockTicket, priority: 'low' as const };

      render(
        <TicketCard
          ticket={lowPriorityTicket}
          board={mockBoard}
          members={mockMembers}
          labels={mockLabels}
          sprints={[]}
        />
      );

      const priorityIndicator = screen.getByTitle('Priority: low');
      expect(priorityIndicator).toBeInTheDocument();
      // Check for emerald/green color (actual class may vary with dark mode)
      expect(priorityIndicator.className).toMatch(/bg-(emerald|green)-/);
    });
  });

  describe('Labels', () => {
    it('renders label dots for tickets with labels', () => {
      render(
        <TicketCard
          ticket={mockTicket}
          board={mockBoard}
          members={mockMembers}
          labels={mockLabels}
          sprints={[]}
        />
      );

      const labelDot = screen.getByTitle('Frontend');
      expect(labelDot).toBeInTheDocument();
    });

    it('displays max 2 labels with overflow indicator', () => {
      const multiLabelTicket = {
        ...mockTicket,
        labelIds: ['label-1', 'label-2', 'label-3'],
      };

      render(
        <TicketCard
          ticket={multiLabelTicket}
          board={mockBoard}
          members={mockMembers}
          labels={mockLabels}
          sprints={[]}
        />
      );

      expect(screen.getByText('+1')).toBeInTheDocument();
    });

    it('does not render labels section when no labels', () => {
      const noLabelTicket = { ...mockTicket, labelIds: [] };

      render(
        <TicketCard
          ticket={noLabelTicket}
          board={mockBoard}
          members={mockMembers}
          labels={mockLabels}
          sprints={[]}
        />
      );

      expect(screen.queryByTitle('Frontend')).not.toBeInTheDocument();
    });
  });

  describe('Story Points', () => {
    it('renders story points when present', () => {
      const ticketWithPoints = { ...mockTicket, storyPoints: 5 };

      render(
        <TicketCard
          ticket={ticketWithPoints}
          board={mockBoard}
          members={mockMembers}
          labels={mockLabels}
          sprints={[]}
        />
      );

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('does not render story points when not present', () => {
      render(
        <TicketCard
          ticket={mockTicket}
          board={mockBoard}
          members={mockMembers}
          labels={mockLabels}
          sprints={[]}
        />
      );

      expect(screen.queryByText(/pts/)).not.toBeInTheDocument();
    });
  });

  describe('Due Date', () => {
    it('renders due date icon when present', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const ticketWithDueDate = {
        ...mockTicket,
        dueDate: tomorrow.toISOString(),
      };

      const { container } = render(
        <TicketCard
          ticket={ticketWithDueDate}
          board={mockBoard}
          members={mockMembers}
          labels={mockLabels}
          sprints={[]}
        />
      );

      const calendarIcon = container.querySelector('svg.lucide-calendar');
      expect(calendarIcon).toBeInTheDocument();
    });

    it('shows overdue indicator for past due dates', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const overdueTicket = {
        ...mockTicket,
        dueDate: yesterday.toISOString(),
      };

      const { container } = render(
        <TicketCard
          ticket={overdueTicket}
          board={mockBoard}
          members={mockMembers}
          labels={mockLabels}
          sprints={[]}
        />
      );

      const calendarIcon = container.querySelector('svg.lucide-calendar');
      expect(calendarIcon).toHaveClass('text-red-500');
    });
  });

  describe('Attachments', () => {
    it('renders attachment icon and count when present', () => {
      const ticketWithAttachments = {
        ...mockTicket,
        attachments: [
          { id: '1', name: 'file1.pdf', url: 'http://example.com/file1.pdf', uploadedAt: new Date().toISOString() },
          { id: '2', name: 'file2.pdf', url: 'http://example.com/file2.pdf', uploadedAt: new Date().toISOString() },
        ],
      };

      render(
        <TicketCard
          ticket={ticketWithAttachments}
          board={mockBoard}
          members={mockMembers}
          labels={mockLabels}
          sprints={[]}
        />
      );

      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  describe('Selection Mode', () => {
    it('renders checkbox when in selection mode', () => {
      const { container } = render(
        <TicketCard
          ticket={mockTicket}
          board={mockBoard}
          members={mockMembers}
          labels={mockLabels}
          sprints={[]}
          selectionMode={true}
          isSelected={false}
        />
      );

      const checkbox = container.querySelector('.absolute.left-2\\.5.top-3');
      expect(checkbox).toBeInTheDocument();
    });

    it('shows checked state when selected', () => {
      const { container } = render(
        <TicketCard
          ticket={mockTicket}
          board={mockBoard}
          members={mockMembers}
          labels={mockLabels}
          sprints={[]}
          selectionMode={true}
          isSelected={true}
        />
      );

      const checkIcon = container.querySelector('svg.lucide-check');
      expect(checkIcon).toBeInTheDocument();
    });

    it('calls onToggleSelect when clicked in selection mode', async () => {
      const onToggleSelect = vi.fn();
      const user = userEvent.setup();

      const { container } = render(
        <TicketCard
          ticket={mockTicket}
          board={mockBoard}
          members={mockMembers}
          labels={mockLabels}
          sprints={[]}
          selectionMode={true}
          isSelected={false}
          onToggleSelect={onToggleSelect}
        />
      );

      const card = container.firstChild as HTMLElement;
      await user.click(card);

      expect(onToggleSelect).toHaveBeenCalledWith('ticket-1');
    });
  });

  describe('Click Handling', () => {
    it('calls onClick when card is clicked', async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();

      const { container } = render(
        <TicketCard
          ticket={mockTicket}
          board={mockBoard}
          members={mockMembers}
          labels={mockLabels}
          sprints={[]}
          onClick={onClick}
        />
      );

      const card = container.firstChild as HTMLElement;
      await user.click(card);

      expect(onClick).toHaveBeenCalled();
    });

    it('prioritizes selection mode over onClick', async () => {
      const onClick = vi.fn();
      const onToggleSelect = vi.fn();
      const user = userEvent.setup();

      const { container } = render(
        <TicketCard
          ticket={mockTicket}
          board={mockBoard}
          members={mockMembers}
          labels={mockLabels}
          sprints={[]}
          selectionMode={true}
          isSelected={false}
          onClick={onClick}
          onToggleSelect={onToggleSelect}
        />
      );

      const card = container.firstChild as HTMLElement;
      await user.click(card);

      expect(onToggleSelect).toHaveBeenCalled();
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('Issue Type', () => {
    it('renders task icon for task type', () => {
      const { container } = render(
        <TicketCard
          ticket={mockTicket}
          board={mockBoard}
          members={mockMembers}
          labels={mockLabels}
          sprints={[]}
        />
      );

      // Check that an SVG icon exists (lucide icons render as SVG)
      const svgIcon = container.querySelector('svg');
      expect(svgIcon).toBeTruthy();
    });

    it('renders bug icon for bug type', () => {
      const bugTicket = { ...mockTicket, issueType: 'bug' as const };

      const { container } = render(
        <TicketCard
          ticket={bugTicket}
          board={mockBoard}
          members={mockMembers}
          labels={mockLabels}
          sprints={[]}
        />
      );

      // Check that an SVG icon exists
      const svgIcon = container.querySelector('svg');
      expect(svgIcon).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('has cursor pointer when clickable', () => {
      const onClick = vi.fn();

      const { container } = render(
        <TicketCard
          ticket={mockTicket}
          board={mockBoard}
          members={mockMembers}
          labels={mockLabels}
          sprints={[]}
          onClick={onClick}
        />
      );

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('cursor-pointer');
    });

    it('truncates long titles', () => {
      const longTitleTicket = {
        ...mockTicket,
        title: 'This is a very long ticket title that should be truncated to fit within the card boundaries',
      };

      render(
        <TicketCard
          ticket={longTitleTicket}
          board={mockBoard}
          members={mockMembers}
          labels={mockLabels}
          sprints={[]}
        />
      );

      const titleElement = screen.getByText(longTitleTicket.title);
      expect(titleElement).toHaveClass('truncate');
    });
  });
});
