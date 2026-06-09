import { useState, useEffect, useCallback } from "react";

export interface AssessmentFormatting {
  margin: "Pequena" | "Média" | "Grande"; // Legacy support
  margins?: { top: number; right: number; bottom: number; left: number };
  font: "Arial" | "Times New Roman" | "Calibri";
  fontSize: 10 | 12 | 14;
  spacing: "Simples" | "1.5" | "Duplo"; // Legacy
  lineHeight?: number;
  questionSpacing?: number;
  alternativeSpacing?: number;
}

export interface Assessment {
  id: string;
  name: string;
  grade: string;
  subjects: string[];
  description: string;
  formatting: AssessmentFormatting;
  status: "draft" | "published";
  questionIds: string[];
  coverImage: string | null;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "avaliacoes_prova";

export function useAssessments() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const migrated = parsed.map((a: any) => ({
          ...a,
          subjects: a.subjects || (a.subject ? [a.subject] : []),
          description: a.description || a.bimester || "",
          formatting: a.formatting || {
            margin: a.formatting?.margin || "Média",
            margins: a.formatting?.margins || { top: 2, right: 2, bottom: 2, left: 2 },
            font: a.formatting?.font || "Arial",
            fontSize: a.formatting?.fontSize || 12,
            spacing: a.formatting?.spacing || "1.5",
            lineHeight: a.formatting?.lineHeight ?? (a.formatting?.spacing === "Duplo" ? 2.0 : a.formatting?.spacing === "1.5" ? 1.5 : 1.3),
            questionSpacing: a.formatting?.questionSpacing ?? 16,
            alternativeSpacing: a.formatting?.alternativeSpacing ?? 6
          }
        }));
        setAssessments(migrated);
      } catch (e) {
        console.error("Erro ao carregar avaliações do localStorage", e);
      }
    }
  }, []);

  const addAssessment = useCallback((data: Omit<Assessment, "id" | "createdAt" | "updatedAt">) => {
    const newAssessment: Assessment = {
      ...data,
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random().toString(36).substring(2),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    setAssessments((prev) => {
      const updated = [newAssessment, ...prev];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    
    return newAssessment.id;
  }, []);

  const updateAssessment = useCallback((id: string, data: Partial<Assessment>) => {
    setAssessments((prev) => {
      const updated = prev.map((a) => (a.id === id ? { ...a, ...data, updatedAt: Date.now() } : a));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteAssessment = useCallback((id: string) => {
    setAssessments((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return {
    assessments,
    addAssessment,
    updateAssessment,
    deleteAssessment,
  };
}
