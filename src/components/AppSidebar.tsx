import {
  LayoutDashboard,
  Receipt,
  PiggyBank,
  DollarSign,
  CheckSquare,
  Target,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/lib/auth';
import { PremiumBadge } from '@/components/PremiumBadge';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

const menuItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Despesas', url: '/despesas', icon: Receipt },
  { title: 'Economia', url: '/economia', icon: PiggyBank },
  { title: 'A Receber', url: '/receber', icon: DollarSign },
  { title: 'Hábitos', url: '/habitos', icon: CheckSquare },
  { title: 'Metas', url: '/metas', icon: Target },
  { title: 'Análises', url: '/analises', icon: BarChart3 },
  { title: 'Configurações', url: '/configuracoes', icon: Settings },
];

export function AppSidebar() {
  const { signOut } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <div
        className="h-full flex flex-col"
        style={{
          background: 'hsl(var(--sidebar-background))',
          borderRight: '1px solid hsl(var(--sidebar-border))',
        }}
      >
        {/* Logo */}
        <div className="px-5 py-5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl gradient-silver flex items-center justify-center shrink-0 shadow-[0_2px_12px_hsl(var(--glow-silver-strong))]">
            <span className="text-xs font-bold text-primary-foreground">P</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold font-display text-gradient-silver truncate tracking-tight">
                Painel de Controle
              </h2>
              <PremiumBadge />
            </div>
          )}
        </div>

        <div className="divider mx-4 mb-2" />

        {/* Nav */}
        <SidebarContent className="flex-1 px-3 py-2">
          <SidebarGroup className="p-0">
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === '/'}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/80 transition-all duration-200 group"
                        activeClassName="nav-active text-foreground"
                      >
                        <item.icon className="h-4 w-4 shrink-0 transition-colors" />
                        {!collapsed && <span className="font-medium">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* Footer */}
        <div className="divider mx-4 mt-2" />
        <SidebarFooter className="p-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={signOut}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-all duration-200 cursor-pointer w-full"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="font-medium">Sair</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </div>
    </Sidebar>
  );
}
