import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto min-w-0">
          {/* Topbar */}
          <header className="sticky top-0 z-10 flex items-center gap-3 px-5 py-3.5 border-b border-border/60"
            style={{ background: 'hsl(var(--background) / 0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
          >
            <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
            <div className="h-4 w-px bg-border" />
            <span className="text-xs text-muted-foreground font-medium tracking-wide">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </header>

          {/* Content */}
          <div className="p-5 md:p-7 lg:p-10 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
