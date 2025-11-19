import React from "react"

export const Divider = ({ className }: { className?: string }) => (
  <hr className={`my-2 border-gray-200 ${className}`} />
)

export const Spacer = ({ x, y }: { x?: number; y?: number }) => (
  <div style={{ width: x ? `${x * 4}px` : undefined, height: y ? `${y * 4}px` : undefined }} />
)

export const Chip = ({ children, className, color }: { children: React.ReactNode; className?: string; color?: string }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className} bg-${color || "gray"}-100 text-${color || "gray"}-800`}>
    {children}
  </span>
)

export const Badge = ({ content, children, className }: { content?: React.ReactNode; children: React.ReactNode; className?: string }) => (
  <div className={`relative inline-flex ${className}`}>
    {children}
    {content && (
      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
        {content}
      </span>
    )}
  </div>
)

export const Progress = ({ value, className, label }: { value: number; className?: string; label?: string }) => (
  <div className={`w-full ${className}`}>
    {label && <div className="mb-1 text-sm font-medium">{label}</div>}
    <div className="h-2.5 w-full rounded-full bg-gray-200">
      <div className="h-2.5 rounded-full bg-blue-600" style={{ width: `${value}%` }}></div>
    </div>
  </div>
)
