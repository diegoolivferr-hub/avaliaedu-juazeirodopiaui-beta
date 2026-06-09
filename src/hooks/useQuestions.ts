import { useState, useEffect, useCallback } from "react";
import { QuestionFormValue } from "@/components/QuestionForm";
import { useAuth } from "@/hooks/useAuth";

export interface Question extends QuestionFormValue {
  id: string;
  createdAt: number;
  createdBy: string;
  createdByName: string;
  status: 'rascunho' | 'publicado' | 'arquivado';
}

const STORAGE_KEY = "questoes_prova";

export function useQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const { user } = useAuth();

  // Carregar dados inicialmente e aplicar migração
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        let parsed = JSON.parse(stored);
        let migrated = false;

        // Migração: adicionar propriedade createdBy nas questões antigas
        parsed = parsed.map((q: any) => {
          if (!q.createdBy) {
            migrated = true;
            return {
              ...q,
              createdBy: 'admin-1',
              createdByName: 'Administrador',
              status: q.status || 'rascunho'
            };
          }
          return q;
        });

        if (migrated) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        }

        setQuestions(parsed);
      } catch (e) {
        console.error("Erro ao carregar questões do localStorage", e);
      }
    }
  }, []);

  // Adicionar questão
  const addQuestion = useCallback((data: QuestionFormValue) => {
    const newQuestion: Question = {
      ...data,
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random().toString(36).substring(2),
      createdAt: Date.now(),
      createdBy: user?.id || 'admin-1',
      createdByName: user?.nome || 'Administrador',
      status: 'rascunho'
    };
    
    setQuestions((prev) => {
      const updated = [newQuestion, ...prev]; // As mais recentes primeiro
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, [user]);

  // Atualizar questão existente
  const updateQuestion = useCallback((id: string, data: QuestionFormValue) => {
    setQuestions((prev) => {
      const updated = prev.map((q) => (q.id === id ? { ...q, ...data } : q));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Excluir questão
  const deleteQuestion = useCallback((id: string) => {
    setQuestions((prev) => {
      const updated = prev.filter((q) => q.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return {
    questions,
    addQuestion,
    updateQuestion,
    deleteQuestion,
  };
}
