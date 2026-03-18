import { useEffect, useRef, useState } from 'react';
import { Network, Maximize2, ZoomIn, ZoomOut } from 'lucide-react';
import type { GraphData } from '../../lib/backlinks';

interface NoteGraphProps {
  graphData: GraphData;
  onNodeClick?: (noteId: string) => void;
  currentNoteId?: string;
}

export function NoteGraph({ graphData, currentNoteId }: NoteGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Simple force-directed layout simulation
  const [nodePositions, setNodePositions] = useState<Map<string, { x: number; y: number }>>(
    new Map()
  );

  useEffect(() => {
    // Initialize node positions in a circle
    const positions = new Map<string, { x: number; y: number }>();
    const radius = 150;
    const angleStep = (2 * Math.PI) / graphData.nodes.length;

    graphData.nodes.forEach((node, index) => {
      const angle = index * angleStep;
      positions.set(node.id, {
        x: 300 + radius * Math.cos(angle),
        y: 300 + radius * Math.sin(angle),
      });
    });

    setNodePositions(positions);

    // Simple physics simulation
    let animationFrame: number;
    let iterations = 0;
    const maxIterations = 100;

    function simulate() {
      if (iterations++ > maxIterations) return;

      const newPositions = new Map(positions);
      const repulsionForce = 100;
      const attractionForce = 0.01;
      const damping = 0.8;

      // Apply forces
      graphData.nodes.forEach((node1) => {
        let fx = 0;
        let fy = 0;
        const pos1 = newPositions.get(node1.id)!;

        // Repulsion between all nodes
        graphData.nodes.forEach((node2) => {
          if (node1.id === node2.id) return;
          const pos2 = newPositions.get(node2.id)!;
          const dx = pos1.x - pos2.x;
          const dy = pos1.y - pos2.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;

          if (distance < 200) {
            const force = repulsionForce / (distance * distance);
            fx += (dx / distance) * force;
            fy += (dy / distance) * force;
          }
        });

        // Attraction along links
        graphData.links.forEach((link) => {
          if (link.source === node1.id) {
            const pos2 = newPositions.get(link.target)!;
            const dx = pos2.x - pos1.x;
            const dy = pos2.y - pos1.y;
            fx += dx * attractionForce;
            fy += dy * attractionForce;
          } else if (link.target === node1.id) {
            const pos2 = newPositions.get(link.source)!;
            const dx = pos2.x - pos1.x;
            const dy = pos2.y - pos1.y;
            fx += dx * attractionForce;
            fy += dy * attractionForce;
          }
        });

        // Center gravity
        const centerX = 300;
        const centerY = 300;
        fx += (centerX - pos1.x) * 0.001;
        fy += (centerY - pos1.y) * 0.001;

        // Update position
        newPositions.set(node1.id, {
          x: pos1.x + fx * damping,
          y: pos1.y + fy * damping,
        });
      });

      setNodePositions(newPositions);
      animationFrame = requestAnimationFrame(simulate);
    }

    animationFrame = requestAnimationFrame(simulate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [graphData]);

  // Render graph on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    // Apply zoom and pan
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw links
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    graphData.links.forEach((link) => {
      const source = nodePositions.get(link.source);
      const target = nodePositions.get(link.target);
      if (source && target) {
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();
      }
    });

    // Draw nodes
    graphData.nodes.forEach((node) => {
      const pos = nodePositions.get(node.id);
      if (!pos) return;

      const isCurrentNode = node.id === currentNoteId;
      const radius = isCurrentNode ? 8 : 6;

      // Node circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = isCurrentNode ? '#6366f1' : '#94a3b8';
      ctx.fill();

      // Node label
      ctx.fillStyle = '#1e293b';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        node.title.length > 15 ? node.title.substring(0, 15) + '...' : node.title,
        pos.x,
        pos.y + radius + 12
      );
    });

    ctx.restore();
  }, [graphData, nodePositions, zoom, pan, currentNoteId]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z * 1.2, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z / 1.2, 0.3));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  if (graphData.nodes.length === 0) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/50">
        <Network className="mb-3 h-12 w-12 text-neutral-300 dark:text-neutral-700" />
        <h3 className="mb-1 font-semibold text-neutral-700 dark:text-neutral-300">No Note Graph</h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Create links between notes to see the graph visualization.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={600}
        height={600}
        className="w-full cursor-move rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      {/* Controls */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        <button
          onClick={handleZoomIn}
          className="rounded-lg bg-white p-2 shadow-lg transition-colors hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700"
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
        </button>
        <button
          onClick={handleZoomOut}
          className="rounded-lg bg-white p-2 shadow-lg transition-colors hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700"
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
        </button>
        <button
          onClick={handleReset}
          className="rounded-lg bg-white p-2 shadow-lg transition-colors hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700"
          title="Reset View"
        >
          <Maximize2 className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
        </button>
      </div>

      {/* Stats */}
      <div className="mt-4 flex items-center justify-between text-xs text-neutral-500">
        <span>{graphData.nodes.length} notes</span>
        <span>{graphData.links.length} connections</span>
      </div>
    </div>
  );
}
