import { useState, useEffect, useCallback } from "react";

export interface Class {
  id: string;
  name: string;
  grade: string; // Etapa de ensino
  shift: string; // Turno
  year: string; // Ano letivo
  school?: string; // Escola
  teacher?: string; // Professor responsável
  createdAt: number;
}

const STORAGE_KEY = "gestao_turmas";

export function useClasses() {
  const [classes, setClasses] = useState<Class[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setClasses(JSON.parse(stored));
      } catch (e) {
        console.error("Erro ao carregar turmas", e);
      }
    }
  }, []);

  const addClass = useCallback((data: Omit<Class, "id" | "createdAt">) => {
    const newClass: Class = {
      ...data,
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random().toString(36).substring(2),
      createdAt: Date.now(),
    };

    setClasses((prev) => {
      const updated = [...prev, newClass];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    return newClass;
  }, []);

  const updateClass = useCallback((id: string, data: Partial<Omit<Class, "id" | "createdAt">>) => {
    setClasses((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, ...data } : c));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteClass = useCallback((id: string) => {
    setClasses((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return {
    classes,
    addClass,
    updateClass,
    deleteClass,
  };
}
