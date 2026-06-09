import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Check, X, Save } from "lucide-react";
import { toast } from "sonner";
import { useAppliedAssessments, AppliedAssessment, StudentResult } from "@/hooks/useAppliedAssessments";
import { useStudents } from "@/hooks/useStudents";
import { useAssessments } from "@/hooks/useAssessments";
import { useQuestions } from "@/hooks/useQuestions";

interface ResultsEntryTabProps {
  application: AppliedAssessment;
  onBack: () => void;
}

export function ResultsEntryTab({ application, onBack }: ResultsEntryTabProps) {
  const { saveStudentResult } = useAppliedAssessments();
  const { students } = useStudents();
  const { assessments } = useAssessments();
  const { questions } = useQuestions();

  const assessment = assessments.find(a => a.id === application.assessmentId);
  const classStudents = students.filter(s => s.classId === application.classId);

  // Get questions for this assessment
  const assessmentQuestions = questions.filter(q => assessment?.questionIds.includes(q.id));

  // Local state for editing results
  const [editingResults, setEditingResults] = useState<Record<string, StudentResult>>(application.results || {});

  const handleObjectiveToggle = (studentId: string, questionId: string, isCorrect: boolean) => {
    setEditingResults(prev => {
      const studentRes = prev[studentId] || { answers: {} };
      return {
        ...prev,
        [studentId]: {
          ...studentRes,
          answers: {
            ...studentRes.answers,
            [questionId]: {
              ...studentRes.answers[questionId],
              isCorrect
            }
          }
        }
      };
    });
  };

  const handleDiscursiveChange = (studentId: string, questionId: string, level: 1 | 2 | 3 | 4) => {
    setEditingResults(prev => {
      const studentRes = prev[studentId] || { answers: {} };
      return {
        ...prev,
        [studentId]: {
          ...studentRes,
          answers: {
            ...studentRes.answers,
            [questionId]: {
              ...studentRes.answers[questionId],
              discursiveLevel: level
            }
          }
        }
      };
    });
  };

  const handleSaveAll = () => {
    // Save each student's result
    Object.keys(editingResults).forEach(studentId => {
      saveStudentResult(application.id, studentId, editingResults[studentId]);
    });
    toast.success("Resultados salvos com sucesso!");
  };

  const calculateStudentGrades = (studentId: string) => {
    const studentRes = editingResults[studentId]?.answers || {};
    const gradesBySubject: Record<string, { total: number; scored: number }> = {};

    assessmentQuestions.forEach(q => {
      if (!gradesBySubject[q.subject]) {
        gradesBySubject[q.subject] = { total: 0, scored: 0 };
      }
      
      const res = studentRes[q.id];
      // Assuming each question is worth 1 point (or 10 total divided by Qs)
      // We'll normalize to 10 points per subject later
      gradesBySubject[q.subject].total += 1;

      if (q.type === "objetiva") {
        if (res?.isCorrect) {
          gradesBySubject[q.subject].scored += 1;
        }
      } else {
        // Discursive: level 4 = 1 point, level 3 = 0.75, level 2 = 0.5, level 1 = 0
        if (res?.discursiveLevel === 4) gradesBySubject[q.subject].scored += 1;
        else if (res?.discursiveLevel === 3) gradesBySubject[q.subject].scored += 0.75;
        else if (res?.discursiveLevel === 2) gradesBySubject[q.subject].scored += 0.5;
        else if (res?.discursiveLevel === 1) gradesBySubject[q.subject].scored += 0; // Or 0.25 depending on rubric
      }
    });

    const finalGrades: Record<string, number> = {};
    Object.keys(gradesBySubject).forEach(subject => {
      const { total, scored } = gradesBySubject[subject];
      finalGrades[subject] = total > 0 ? (scored / total) * 10 : 0;
    });

    return finalGrades;
  };

  if (!assessment) return <div>Avaliação não encontrada.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Lançamento de Resultados</h2>
            <p className="text-muted-foreground">Avaliação: {assessment.name}</p>
          </div>
        </div>
        <Button onClick={handleSaveAll}>
          <Save className="w-4 h-4 mr-2" />
          Salvar Tudo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alunos</CardTitle>
          <CardDescription>Expanda um aluno para lançar seus resultados.</CardDescription>
        </CardHeader>
        <CardContent>
          {classStudents.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhum aluno nesta turma.</p>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {classStudents.map(student => {
                const grades = calculateStudentGrades(student.id);
                return (
                  <AccordionItem key={student.id} value={student.id}>
                    <AccordionTrigger className="hover:no-underline hover:bg-muted/50 px-4 rounded-md">
                      <div className="flex items-center justify-between w-full pr-4">
                        <span className="font-medium">{student.name}</span>
                        <div className="flex gap-2">
                          {Object.keys(grades).map(subj => (
                            <Badge key={subj} variant="secondary">
                              {subj}: {grades[subj].toFixed(1)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4 px-4 pb-4 border-t">
                      <div className="space-y-6">
                        {assessmentQuestions.map((q, idx) => {
                          const res = editingResults[student.id]?.answers?.[q.id];
                          return (
                            <div key={q.id} className="grid grid-cols-[1fr_auto] gap-4 items-center p-3 rounded-md border bg-muted/20">
                              <div>
                                <p className="font-medium text-sm">Questão {idx + 1} <Badge variant="outline" className="ml-2">{q.subject}</Badge> {q.skill && <Badge variant="outline" className="ml-1">{q.skill}</Badge>}</p>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{q.statement}</p>
                              </div>
                              
                              <div>
                                {q.type === "objetiva" ? (
                                  <div className="flex gap-2">
                                    <Button
                                      variant={res?.isCorrect === true ? "default" : "outline"}
                                      size="sm"
                                      className={res?.isCorrect === true ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                                      onClick={() => handleObjectiveToggle(student.id, q.id, true)}
                                    >
                                      <Check className="w-4 h-4 mr-1" /> Acertou
                                    </Button>
                                    <Button
                                      variant={res?.isCorrect === false ? "destructive" : "outline"}
                                      size="sm"
                                      onClick={() => handleObjectiveToggle(student.id, q.id, false)}
                                    >
                                      <X className="w-4 h-4 mr-1" /> Errou
                                    </Button>
                                  </div>
                                ) : (
                                  <Select 
                                    value={res?.discursiveLevel?.toString()} 
                                    onValueChange={(v) => handleDiscursiveChange(student.id, q.id, parseInt(v) as 1|2|3|4)}
                                  >
                                    <SelectTrigger className="w-[180px]">
                                      <SelectValue placeholder="Selecione o nível" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="4">Nível 4 (Total)</SelectItem>
                                      <SelectItem value="3">Nível 3 (Parcial)</SelectItem>
                                      <SelectItem value="2">Nível 2 (Básico)</SelectItem>
                                      <SelectItem value="1">Nível 1 (Insuficiente)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
