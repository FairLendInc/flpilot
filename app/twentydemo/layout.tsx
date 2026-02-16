import { type ReactNode } from 'react';

export default function TwentyDemoLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div
      className="h-screen w-screen overflow-hidden"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {children}
    </div>
  );
}
