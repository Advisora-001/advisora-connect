"use client";

import React from "react";

interface Column {
  id: string;
  title: string;
  color: string;
  badge: number;
}

interface KanbanBoardProps {
  columns: Column[];
  columnContent: Record<string, React.ReactNode>;
}

export default function KanbanBoard({
  columns,
  columnContent,
}: KanbanBoardProps) {
  return (
    <div className="flex gap-6 overflow-x-auto pb-4">
      {columns.map((column) => (
        <div key={column.id} className="flex flex-col flex-shrink-0 w-96">
          {/* Column Header */}
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${column.color}`}></div>
              <h3 className="font-semibold text-[#1B2A4A]">{column.title}</h3>
              <span className="ml-auto bg-[#EEF2F7] text-[#667085] text-xs font-bold px-2.5 py-1 rounded-full">
                {column.badge}
              </span>
            </div>
          </div>

          {/* Column Cards Container */}
          <div
            className="flex-1 bg-[#F5F7FA] rounded-lg p-4 space-y-3 min-h-[400px] overflow-y-auto"
            data-column-id={column.id}
          >
            {columnContent[column.id] &&
            Array.isArray(columnContent[column.id]) &&
            (columnContent[column.id] as any[]).length > 0 ? (
              columnContent[column.id]
            ) : (
              <div className="text-center text-[#94A3B8] text-sm py-8">
                No items
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
