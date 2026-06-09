import { useState, useEffect, useCallback } from "react";

export interface Student {
  id: string;
  name: string;
  enrollment?: string; // Matrícula
  classId: string; // ID da Turma
  createdAt: number;
}

const STORAGE_KEY = "gestao_alunos";

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setStudents(JSON.parse(stored));
      } catch (e) {
        console.error("Erro ao carregar alunos", e);
      }
    }
  }, []);

  const addStudent = useCallback((data: Omit<Student, "id" | "createdAt">) => {
    const newStudent: Student = {
      ...data,
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random().toString(36).substring(2),
      createdAt: Date.now(),
    };
    
    setStudents((prev) => {
      const updated = [...prev, newStudent];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    
    return newStudent;
  }, []);

  const updateStudent = useCallback((id: string, data: Partial<Omit<Student, "id" | "createdAt">>) => {
    setStudents((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, ...data } : s));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteStudent = useCallback((id: string) => {
    setStudents((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return {
    students,
    addStudent,
    updateStudent,
    deleteStudent,
  };
}
