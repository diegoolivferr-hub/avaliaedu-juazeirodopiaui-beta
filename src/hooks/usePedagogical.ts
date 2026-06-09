import { useState, useEffect, useCallback } from "react";
import { DEFAULT_GRADES, DEFAULT_SUBJECTS } from "@/lib/constants";

export interface Subject {
  id: string;
  name: string;
  createdAt: number;
}

export interface Skill {
  id: string;
  code: string;
  description: string;
  objetoConhecimento?: string;
  subjectId: string;
  grade: string;
  createdAt: number;
}

const STORAGE_KEY_SUBJECTS = "gestao_disciplinas";
const STORAGE_KEY_SKILLS = "gestao_habilidades";

export const STAGES = [
  "1º ano",
  "2º ano",
  "3º ano",
  "4º ano",
  "5º ano",
  "6º ano",
  "7º ano",
  "8º ano",
  "9º ano",
];

export function usePedagogical() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);

  // Load initial data
  useEffect(() => {
    const storedSubjects = localStorage.getItem(STORAGE_KEY_SUBJECTS);
    if (storedSubjects) {
      try {
        setSubjects(JSON.parse(storedSubjects));
      } catch (e) {
        console.error("Erro ao carregar disciplinas", e);
      }
    } else {
      // Initialize with defaults if empty
      const defaultSubjects: Subject[] = DEFAULT_SUBJECTS.map((name, index) => ({
        id: `default-sub-${index}`,
        name,
        createdAt: Date.now(),
      }));
      setSubjects(defaultSubjects);
      localStorage.setItem(STORAGE_KEY_SUBJECTS, JSON.stringify(defaultSubjects));
    }

    const storedSkills = localStorage.getItem(STORAGE_KEY_SKILLS);
    if (storedSkills) {
      try {
        setSkills(JSON.parse(storedSkills));
      } catch (e) {
        console.error("Erro ao carregar habilidades", e);
      }
    }
  }, []);

  // Subject Actions
  const addSubject = useCallback((name: string) => {
    const newSubject: Subject = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random().toString(36).substring(2),
      name,
      createdAt: Date.now(),
    };
    setSubjects((prev) => {
      const updated = [...prev, newSubject];
      localStorage.setItem(STORAGE_KEY_SUBJECTS, JSON.stringify(updated));
      return updated;
    });
    return newSubject;
  }, []);

  const updateSubject = useCallback((id: string, name: string) => {
    setSubjects((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, name } : s));
      localStorage.setItem(STORAGE_KEY_SUBJECTS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteSubject = useCallback((id: string) => {
    setSubjects((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      localStorage.setItem(STORAGE_KEY_SUBJECTS, JSON.stringify(updated));
      return updated;
    });
    // Also delete skills associated with this subject
    setSkills((prev) => {
      const updated = prev.filter((s) => s.subjectId !== id);
      localStorage.setItem(STORAGE_KEY_SKILLS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Skill Actions
  const addSkill = useCallback((skill: Omit<Skill, "id" | "createdAt">) => {
    const newSkill: Skill = {
      ...skill,
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random().toString(36).substring(2),
      createdAt: Date.now(),
    };
    setSkills((prev) => {
      const updated = [...prev, newSkill];
      localStorage.setItem(STORAGE_KEY_SKILLS, JSON.stringify(updated));
      return updated;
    });
    return newSkill;
  }, []);

  const updateSkill = useCallback((id: string, data: Partial<Omit<Skill, "id" | "createdAt">>) => {
    setSkills((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, ...data } : s));
      localStorage.setItem(STORAGE_KEY_SKILLS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteSkill = useCallback((id: string) => {
    setSkills((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      localStorage.setItem(STORAGE_KEY_SKILLS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return {
    stages: STAGES,
    subjects,
    skills,
    addSubject,
    updateSubject,
    deleteSubject,
    addSkill,
    updateSkill,
    deleteSkill,
  };
}
