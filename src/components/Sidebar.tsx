import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  GraduationCap, 
  FilePlus2, 
  Library, 
  FileDown, 
  BookKey, 
  LogOut, 
  UserCog, 
  ChevronRight,
  LayoutDashboard,
  Users,
  UserCheck,
  FileText,
  Database
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export const navItems = [
  { href: "/", label: "Início", icon: GraduationCap, roles: ["admin", "user"] },
  { href: "/cadastro", label: "Cadastro", icon: FilePlus2, roles: ["admin", "user"] },
  { href: "/banco", label: "Banco", icon: Library, roles: ["admin", "user"] },
  { href: "/avaliacoes", label: "Avaliações", icon: FileDown, roles: ["admin", "user"] },
  { 
    label: "Gestão Pedagógica", 
    icon: BookKey, 
    roles: ["admin"],
    // When expanding this, it will show the sub-items
    subItems: [
      { href: "/pedagogico/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/pedagogico/turmas", label: "Turmas", icon: Users },
      { href: "/pedagogico/alunos", label: "Alunos", icon: UserCheck },
      { href: "/pedagogico/aplicacoes", label: "Aplicações", icon: FileText },
      { href: "/pedagogico/estrutura", label: "Estrutura BNCC", icon: Database },
    ]
  },
  { href: "/usuarios", label: "Usuários", icon: UserCog, roles: ["admin"] },
];

interface SidebarProps {
  onNavClick?: () => void;
}

export function Sidebar({ onNavClick }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('sidebar-collapsible');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Error reading sidebar state from local storage", e);
    }
    return { "Gestão Pedagógica": true };
  });

  // Automatically open the group if we are inside its route
  useEffect(() => {
    navItems.forEach(item => {
      if (item.subItems) {
        const isInside = item.subItems.some(sub => location.startsWith(sub.href));
        if (isInside && !openGroups[item.label]) {
          setOpenGroups(prev => ({ ...prev, [item.label]: true }));
        }
      }
    });
  }, [location]);

  const toggleGroup = (label: string, isOpen: boolean) => {
    setOpenGroups(prev => {
      const next = { ...prev, [label]: isOpen };
      localStorage.setItem('sidebar-collapsible', JSON.stringify(next));
      return next;
    });
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex h-full flex-col bg-card border-r border-border shadow-sm">
      <div className="flex h-20 items-center px-6 border-b border-border/50 shrink-0">
        <Link href="/" className="flex items-center gap-3 group" onClick={onNavClick}>
          <img 
            src="/logo.png" 
            alt="AvaliaEdu Logo" 
            className="h-10 w-auto object-contain transition-transform group-hover:scale-105" 
          />
          <div className="flex flex-col justify-center">
            <span className="font-bold text-2xl tracking-tight leading-none">
              <span className="text-brand">Avalia</span><span className="text-primary">Edu</span>
            </span>
            <span className="text-[10px] text-muted-foreground mt-1 hidden sm:block">
              Gestão de Avaliações
            </span>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4">
        <div className="mb-4 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
          Menu Principal
        </div>
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            if (!user || !item.roles.includes(user.role)) return null;

            if (item.subItems) {
              const Icon = item.icon;
              const isGroupActive = item.subItems.some(sub => location.startsWith(sub.href)) || location === "/pedagogico";
              
              return (
                <Collapsible
                  key={item.label}
                  open={openGroups[item.label] ?? false}
                  onOpenChange={(isOpen) => toggleGroup(item.label, isOpen)}
                  className="w-full"
                >
                  <CollapsibleTrigger className={cn(
                    "flex w-full items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group/trigger",
                    isGroupActive && !(openGroups[item.label] ?? false)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  )}>
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </div>
                    <ChevronRight className={cn("h-4 w-4 transition-transform duration-200", (openGroups[item.label] ?? false) && "rotate-90")} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 mt-1 pl-9 pr-1 overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                    {item.subItems.map(subItem => {
                      const SubIcon = subItem.icon;
                      const active = location === subItem.href || location.startsWith(subItem.href + '/');
                      
                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          onClick={onNavClick}
                          className={cn(
                            "py-2 px-3 rounded-md text-sm font-medium flex items-center gap-2.5 transition-all",
                            active
                              ? "bg-primary/10 text-primary shadow-sm"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <SubIcon className="w-4 h-4" />
                          {subItem.label}
                        </Link>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              );
            }

            const Icon = item.icon;
            const active = item.href === "/" ? location === "/" : location.startsWith(item.href as string);

            return (
              <Link
                key={item.href}
                href={item.href as string}
                onClick={onNavClick}
                className={cn(
                  "px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-3 transition-all",
                  active
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground hover:translate-x-1"
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {user && (
        <div className="border-t border-border/50 p-4 shrink-0">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-muted/30 border border-border/50 shadow-sm transition-colors hover:bg-muted/50">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
              {user.nome.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-semibold truncate leading-tight">{user.nome}</span>
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider mt-0.5">
                {user.role === 'admin' ? 'Administrador' : 'Professor'}
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout} 
              title="Sair" 
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
