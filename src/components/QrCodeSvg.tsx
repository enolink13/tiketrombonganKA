import React from 'react';

interface QrCodeSvgProps {
  value: string;
  size?: number;
  onClick?: () => void;
}

export const QrCodeSvg: React.FC<QrCodeSvgProps> = ({ value, size = 92, onClick }) => {
  const gridSize = 21;
  const cells: boolean[][] = Array.from({ length: gridSize }, () =>
    Array(gridSize).fill(false)
  );

  const drawFinder = (startR: number, startC: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        cells[startR + r][startC + c] = isBorder || isInner;
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, gridSize - 7);
  drawFinder(gridSize - 7, 0);

  for (let i = 8; i < gridSize - 8; i++) {
    cells[6][i] = i % 2 === 0;
    cells[i][6] = i % 2 === 0;
  }

  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= gridSize - 8;
      const inBottomLeft = r >= gridSize - 8 && c < 8;
      const isTiming = r === 6 || c === 6;
      if (inTopLeft || inTopRight || inBottomLeft || isTiming) continue;

      const seed = Math.imul(hash ^ (r * 31 + c * 17), 1597334677);
      cells[r][c] = (Math.abs(seed) + r + c) % 3 !== 0;
    }
  }

  return (
    <div
      onClick={onClick}
      title={onClick ? `Klik untuk membuka halaman verifikasi: ${value}` : value}
      className={`inline-flex flex-col items-center p-1.5 bg-white border border-slate-300 rounded ${
        onClick ? 'cursor-pointer hover:border-blue-600 transition-colors' : ''
      }`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${gridSize} ${gridSize}`}
        shapeRendering="crispEdges"
        aria-label={`QR Verifikasi ${value}`}
      >
        <rect width={gridSize} height={gridSize} fill="#ffffff" />
        {cells.map((row, rIdx) =>
          row.map((filled, cIdx) =>
            filled ? (
              <rect
                key={`${rIdx}-${cIdx}`}
                x={cIdx}
                y={rIdx}
                width={1}
                height={1}
                fill="#0f172a"
              />
            ) : null
          )
        )}
      </svg>
    </div>
  );
};
