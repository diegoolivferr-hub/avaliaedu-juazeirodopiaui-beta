import { useState, useEffect } from "react";
import { BookKey } from "lucide-react";
import { StructureTab } from "@/components/pedagogical/StructureTab";
import { ClassesTab } from "@/components/pedagogical/ClassesTab";
import { StudentsTab } from "@/components/pedagogical/StudentsTab";
import { ApplicationsTab } from "@/components/pedagogical/ApplicationsTab";
import { ResultsEntryTab } from "@/components/pedagogical/ResultsEntryTab";
import { DashboardTab } from "@/components/pedagogical/DashboardTab";
import { AppliedAssessment } from "@/hooks/useAppliedAssessments";
import { useParams, useLocation } from "wouter";

type Tab = "estrutura" | "turmas" | "alunos" | "aplicacoes" | "lancamento" | "dashboard";

export default function PedagogicalPage() {
  const params = useParams<{ tab?: string }>();
  const [, setLocation] = useLocation();
  const urlTab = (params?.tab as Tab) || "dashboard";

  const [activeTab, setActiveTab] = useState<Tab>(urlTab);
  const [selectedApplication, setSelectedApplication] = useState<AppliedAssessment | null>(null);

  // Sync state with URL
  useEffect(() => {
    setActiveTab(urlTab);
    if (urlTab !== "lancamento") {
      setSelectedApplication(null);
    }
  }, [urlTab]);

  const handleSelectApplication = (app: AppliedAssessment) => {
    setSelectedApplication(app);
    setLocation("/pedagogico/lancamento");
  };

  const handleBackToApplications = () => {
    setSelectedApplication(null);
    setLocation("/pedagogico/aplicacoes");
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <BookKey className="w-8 h-8 text-primary" />
          Gestão Pedagógica
        </h1>
        <p className="text-muted-foreground mt-1">
          Acompanhe o aprendizado dos alunos, registre turmas, aplicações de avaliações e lance resultados.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="flex-1 min-w-0 w-full">
          {activeTab === "dashboard" && <DashboardTab />}
          {activeTab === "turmas" && <ClassesTab />}
          {activeTab === "alunos" && <StudentsTab />}
          {activeTab === "aplicacoes" && <ApplicationsTab onSelectApplication={handleSelectApplication} />}
          {activeTab === "lancamento" && selectedApplication && (
            <ResultsEntryTab application={selectedApplication} onBack={handleBackToApplications} />
          )}
          {activeTab === "estrutura" && <StructureTab />}
        </div>
      </div>
    </div>
  );
}
