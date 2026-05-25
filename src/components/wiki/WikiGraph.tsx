'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import type { WikiGraph as WikiGraphData } from '@/lib/wiki';

type GraphNodeState = {
  id: string;
  label: string;
  current?: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
};

const WIDTH = 760;
const HEIGHT = 540;
const CENTER_X = WIDTH / 2;
const CENTER_Y = HEIGHT / 2;

function getWikiHref(slug: string) {
  return `/wiki/${slug.split('/').map(encodeURIComponent).join('/')}`;
}

function initialPoint(index: number, total: number, current?: boolean) {
  if (current) return { x: CENTER_X, y: CENTER_Y };
  const radius = total > 16 ? 210 : 170;
  const angle = (Math.PI * 2 * index) / Math.max(total, 1) - Math.PI / 2;
  return {
    x: CENTER_X + Math.cos(angle) * radius,
    y: CENTER_Y + Math.sin(angle) * radius,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function labelFor(node: GraphNodeState) {
  return node.label.length > 24 ? `${node.label.slice(0, 24)}…` : node.label;
}

export function WikiGraph({ graph }: { graph: WikiGraphData }) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const draggingRef = useRef<string | null>(null);
  const [nodes, setNodes] = useState<GraphNodeState[]>([]);

  const linkPairs = useMemo(() => graph.links.map((link) => [link.source, link.target] as const), [graph.links]);

  useEffect(() => {
    const nonCurrentCount = graph.nodes.filter((node) => !node.current).length;
    setNodes(graph.nodes.map((node, index) => {
      const point = initialPoint(index, nonCurrentCount, node.current);
      return { ...node, ...point, vx: 0, vy: 0 };
    }));
  }, [graph]);

  useEffect(() => {
    if (nodes.length === 0) return undefined;

    let frame = 0;
    const tick = () => {
      setNodes((previous) => {
        const next = previous.map((node) => ({ ...node }));
        const byId = new Map(next.map((node) => [node.id, node]));

        for (let i = 0; i < next.length; i += 1) {
          for (let j = i + 1; j < next.length; j += 1) {
            const left = next[i];
            const right = next[j];
            const dx = right.x - left.x || 0.01;
            const dy = right.y - left.y || 0.01;
            const distanceSquared = dx * dx + dy * dy;
            const force = Math.min(2200 / distanceSquared, 1.8);
            const distance = Math.sqrt(distanceSquared);
            const fx = (dx / distance) * force;
            const fy = (dy / distance) * force;
            if (draggingRef.current !== left.id) {
              left.vx -= fx;
              left.vy -= fy;
            }
            if (draggingRef.current !== right.id) {
              right.vx += fx;
              right.vy += fy;
            }
          }
        }

        for (const [sourceId, targetId] of linkPairs) {
          const source = byId.get(sourceId);
          const target = byId.get(targetId);
          if (!source || !target) continue;
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const desired = source.current || target.current ? 150 : 120;
          const force = (distance - desired) * 0.006;
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;
          if (draggingRef.current !== source.id) {
            source.vx += fx;
            source.vy += fy;
          }
          if (draggingRef.current !== target.id) {
            target.vx -= fx;
            target.vy -= fy;
          }
        }

        for (const node of next) {
          if (draggingRef.current === node.id) continue;
          node.vx += (CENTER_X - node.x) * 0.002;
          node.vy += (CENTER_Y - node.y) * 0.002;
          node.vx *= 0.86;
          node.vy *= 0.86;
          node.x = clamp(node.x + node.vx, 36, WIDTH - 36);
          node.y = clamp(node.y + node.vy, 36, HEIGHT - 36);
        }

        return next;
      });
      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [linkPairs, nodes.length]);

  if (graph.nodes.length === 0) return <p className="admin-hint">当前没有可展示的双链关系。</p>;

  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  function getSvgPoint(event: PointerEvent<SVGElement>) {
    const svg = svgRef.current;
    if (!svg) return { x: CENTER_X, y: CENTER_Y };
    const rect = svg.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * HEIGHT,
    };
  }

  function startDrag(event: PointerEvent<SVGCircleElement>, nodeId: string) {
    event.preventDefault();
    draggingRef.current = nodeId;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function drag(event: PointerEvent<SVGCircleElement>) {
    const nodeId = draggingRef.current;
    if (!nodeId) return;
    const point = getSvgPoint(event);
    setNodes((previous) => previous.map((node) => (
      node.id === nodeId ? { ...node, x: clamp(point.x, 36, WIDTH - 36), y: clamp(point.y, 36, HEIGHT - 36), vx: 0, vy: 0 } : node
    )));
  }

  function endDrag() {
    draggingRef.current = null;
  }

  return (
    <div className="wiki-graph-wrap">
      <div className="wiki-graph-toolbar">
        <span>可拖拽节点，点击标签进入笔记</span>
      </div>
      <svg className="wiki-graph" ref={svgRef} role="img" viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        {linkPairs.map(([sourceId, targetId]) => {
          const source = nodeById.get(sourceId);
          const target = nodeById.get(targetId);
          if (!source || !target) return null;
          return <line key={`${sourceId}-${targetId}`} x1={source.x} x2={target.x} y1={source.y} y2={target.y} />;
        })}
        {nodes.map((node) => (
          <g className="wiki-graph-node" key={node.id}>
            <circle
              className={node.current ? 'current' : ''}
              cx={node.x}
              cy={node.y}
              onPointerCancel={endDrag}
              onPointerDown={(event) => startDrag(event, node.id)}
              onPointerMove={drag}
              onPointerUp={endDrag}
              r={node.current ? 24 : 16}
            />
            <a href={getWikiHref(node.id)}>
              <text x={node.x} y={node.y + (node.current ? 42 : 34)}>{labelFor(node)}</text>
            </a>
          </g>
        ))}
      </svg>
    </div>
  );
}
