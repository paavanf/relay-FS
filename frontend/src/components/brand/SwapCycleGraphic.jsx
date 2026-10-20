// SwapCycleGraphic - the static illustration on the auth brand panel.
//
// It draws what Relay actually does: three shifts in a covering cycle, each
// person taking the next one's shift. Mon -> Wed -> Fri -> Mon. Where the
// nodes and arrows go is worked out in swapCycleGeometry.js.
//
// Colour comes from `currentColor`, set once on the <svg>, which is also what
// lets the marker pick up the theme - marker contents inherit from where they
// sit in the document, not from the line that references them.

import { NODE_RADIUS, nodes, edges } from './swapCycleGeometry.js';

const ARROW_ID = 'relay-swap-arrow';

export function SwapCycleGraphic({ className }) {
  return (
    <svg
      viewBox="0 0 220 200"
      fill="none"
      className={className ?? 'w-full max-w-[260px] text-brand-solid'}
      role="img"
      aria-label="Three shifts covering each other in a cycle: Monday to Wednesday to Friday and back"
    >
      <defs>
        {/* refX sits on the tip, so the point lands exactly on the line end.
            markerUnits="strokeWidth" keeps the head in proportion if the
            stroke ever changes weight. */}
        <marker
          id={ARROW_ID}
          viewBox="0 0 10 10"
          refX="10"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          markerUnits="strokeWidth"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 Z" fill="currentColor" />
        </marker>
      </defs>

      {edges.map((edge) => (
        <line
          key={edge.key}
          x1={edge.x1}
          y1={edge.y1}
          x2={edge.x2}
          y2={edge.y2}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          markerEnd={`url(#${ARROW_ID})`}
        />
      ))}

      {nodes.map((node) => (
        <g key={node.label}>
          <circle cx={node.cx} cy={node.cy} r={NODE_RADIUS} className="fill-brand-subtle" />
          <circle cx={node.cx} cy={node.cy} r={NODE_RADIUS} fill="none" stroke="currentColor" strokeWidth="1.25" />
          <text
            x={node.cx}
            y={node.cy + 4}
            textAnchor="middle"
            className="fill-content-secondary text-[11px] font-medium"
          >
            {node.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
