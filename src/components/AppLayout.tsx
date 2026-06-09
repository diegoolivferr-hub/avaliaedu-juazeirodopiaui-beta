import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/Sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      {user && (
        <aside className="hidden md:flex w-72 flex-col fixed inset-y-0 z-40">
          <Sidebar />
        </aside>
      )}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 ${user ? 'md:pl-72' : ''}`}>
        {/* Mobile Header */}
        <header className="md:hidden border-b border-border bg-card shadow-sm sticky top-0 z-30 flex items-center justify-between h-16 px-4">
          <Link href="/" className="flex items-center gap-2 group">
            <img 
              src="/logo.png" 
              alt="AvaliaEdu Logo" 
              className="h-8 w-auto object-contain transition-transform group-hover:scale-105" 
            />
            <span className="font-bold text-xl tracking-tight leading-none">
              <span className="text-brand">Avalia</span><span className="text-primary">Edu</span>
            </span>
          </Link>
          
          {user && (
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden hover:bg-muted/50">
                  <Menu className="h-6 w-6 text-foreground" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[280px]">
                <Sidebar onNavClick={() => setIsMobileMenuOpen(false)} />
              </SheetContent>
            </Sheet>
          )}
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8 lg:py-10">
          {children}
        </main>
        
        <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground bg-background/50">
          AvaliaEdu — feito para professores
        </footer>
      </div>
    </div>
  );
}

