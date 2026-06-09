import { useState, useEffect, useCallback } from "react";

export interface StudentResult {
  // Key: questionId
  answers: Record<string, { 
    isCorrect?: boolean; 
    discursiveLevel?: 1 | 2 | 3 | 4;
  }>;
}

export interface AppliedAssessment {
  id: string;
  assessmentId: string;
  classId: string;
  date: string;
  results: Record<string, StudentResult>; // Key: studentId
  createdAt: number;
}

const STORAGE_KEY = "gestao_aplicacoes";

export function useAppliedAssessments() {
  const [appliedAssessments, setAppliedAssessments] = useState<AppliedAssessment[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setAppliedAssessments(JSON.parse(stored));
      } catch (e) {
        console.error("Erro ao carregar aplicações", e);
      }
    }
  }, []);

  const addAppliedAssessment = useCallback((data: Omit<AppliedAssessment, "id" | "createdAt" | "results">) => {
    const newAppliedAssessment: AppliedAssessment = {
      ...data,
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random().toString(36).substring(2),
      results: {}, // Initialize empty results
      createdAt: Date.now(),
    };
    
    setAppliedAssessments((prev) => {
      const updated = [...prev, newAppliedAssessment];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    
    return newAppliedAssessment;
  }, []);

  const deleteAppliedAssessment = useCallback((id: string) => {
    setAppliedAssessments((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Salvar resultados de um aluno específico em uma aplicação
  const saveStudentResult = useCallback((appliedAssessmentId: string, studentId: string, result: StudentResult) => {
    setAppliedAssessments((prev) => {
      const updated = prev.map((a) => {
        if (a.id === appliedAssessmentId) {
          return {
            ...a,
            results: {
              ...a.results,
              [studentId]: result
            }
          };
        }
        return a;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return {
    appliedAssessments,
    addAppliedAssessment,
    deleteAppliedAssessment,
    saveStudentResult,
  };
}
