import { useState } from "react";

export default function AdGridCanvas({
  noOfColumnsPerPage,
  maxColHeight,
}: {
  noOfColumnsPerPage: number;
  maxColHeight: number;
}) {
  // Track selected cells: a 2D array of booleans [row][col]
  const [selectedCells, setSelectedCells] = useState(
    Array.from({ length: maxColHeight }, () =>
      Array.from({ length: noOfColumnsPerPage }, () => false)
    )
  );

  const toggleCell = (row: number, col: number) => {
    const newGrid = selectedCells.map((r, i) =>
      r.map((c, j) => (i === row && j === col ? !c : c))
    );
    setSelectedCells(newGrid);
  };

  return (
    <div className="inline-block border border-gray-300 p-2 rounded-md">
      {selectedCells.map((row, rowIndex) => (
        <div key={rowIndex} className="flex">
          {row.map((cellSelected, colIndex) => (
            <div
              key={colIndex}
              onClick={() => toggleCell(rowIndex, colIndex)}
              className={`h-2 w-8 m-0.2 border rounded-sm cursor-pointer transition ${
                cellSelected
                  ? "bg-[var(--color-primary)] border-[var(--color-primary)]"
                  : "bg-white border-gray-300 hover:border-[var(--color-primary)]"
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
