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
import { useI18n } from '@/lib/i18n';

const menuItems = [
  { titleKey: 'nav.dashboard', url: '/', icon: LayoutDashboard },
  { titleKey: 'nav.expenses', url: '/despesas', icon: Receipt },
  { titleKey: 'nav.savings', url: '/economia', icon: PiggyBank },
  { titleKey: 'nav.income', url: '/receber', icon: DollarSign },
  { titleKey: 'nav.habits', url: '/habitos', icon: CheckSquare },
  { titleKey: 'nav.goals', url: '/metas', icon: Target },
  { titleKey: 'nav.analytics', url: '/analises', icon: BarChart3 },
  { titleKey: 'nav.settings', url: '/configuracoes', icon: Settings },
];

export function AppSidebar() {
  const { signOut } = useAuth();
  const { state } = useSidebar();
  const { t } = useI18n();
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
        <div className="px-5 py-5 flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--brand)), hsl(212 100% 42%))',
              boxShadow: '0 0 20px hsl(var(--brand-glow))',
            }}
          >
            <span className="text-xs font-bold text-brand-foreground font-display">B</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold font-display text-foreground truncate tracking-tight">
                BlacckCore
              </h2>
              <PremiumBadge />
            </div>
          )}
        </div>

        <div className="divider mx-4 mb-2" />

        <SidebarContent className="flex-1 px-3 py-2">
          <SidebarGroup className="p-0">
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.titleKey}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === '/'}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/80 transition-all duration-200 group"
                        activeClassName="nav-active text-foreground"
                      >
                        <item.icon className="h-4 w-4 shrink-0 transition-colors" />
                        {!collapsed && <span className="font-medium">{t(item.titleKey)}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <div className="divider mx-4 mt-2" />
        <SidebarFooter className="p-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={signOut}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-all duration-200 cursor-pointer w-full"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="font-medium">{t('nav.logout')}</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </div>
    </Sidebar>
  );
}
