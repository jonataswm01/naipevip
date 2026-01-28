"use client";

interface AuthCardProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export function AuthCard({ children, title, subtitle }: AuthCardProps) {
  return (
    <div className="w-full max-w-md bg-marrom-dark/90 border border-marrom rounded-xl p-8 shadow-warm">
      <div className="mb-6">
        <h1 className="font-titulo text-2xl text-off-white font-semibold mb-2">
          {title}
        </h1>
        <p className="font-texto text-sm text-off-white-soft/80">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
