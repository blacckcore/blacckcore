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
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <div className="p-4 border-b border-border/50">
        {!collapsed && (
          <h2 className="text-lg font-bold font-display text-gradient-silver truncate">
            Painel de Controle
          </h2>
        )}
        {collapsed && (
          <span className="text-xl font-bold text-gradient-silver block text-center">P</span>
        )}
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                      activeClassName="text-foreground bg-accent glow-silver"
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/50 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={signOut}
              className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
