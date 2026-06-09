import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import { useAppliedAssessments, AppliedAssessment } from "@/hooks/useAppliedAssessments";
import { useClasses } from "@/hooks/useClasses";
import { useAssessments } from "@/hooks/useAssessments";

interface ApplicationsTabProps {
  onSelectApplication: (app: AppliedAssessment) => void;
}

export function ApplicationsTab({ onSelectApplication }: ApplicationsTabProps) {
  const { appliedAssessments, addAppliedAssessment, deleteAppliedAssessment } = useAppliedAssessments();
  const { classes } = useClasses();
  const { assessments } = useAssessments();

  const [assessmentId, setAssessmentId] = useState("");
  const [classId, setClassId] = useState("");
  const [date, setDate] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assessmentId || !classId || !date) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    addAppliedAssessment({ assessmentId, classId, date });
    setAssessmentId("");
    setClassId("");
    setDate("");
    toast.success("Aplicação registrada com sucesso!");
  };

  return (
    <div className="grid md:grid-cols-[300px_1fr] gap-6">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-lg">Nova Aplicação</CardTitle>
          <CardDescription>Vincule uma avaliação a uma turma.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label>Avaliação *</Label>
              <Select value={assessmentId} onValueChange={setAssessmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a avaliação" />
                </SelectTrigger>
                <SelectContent>
                  {assessments.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Turma *</Label>
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a turma" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data de Aplicação *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Registrar Aplicação
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Avaliações Aplicadas</CardTitle>
        </CardHeader>
        <CardContent>
          {appliedAssessments.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhuma aplicação registrada.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Avaliação</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead className="w-[180px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appliedAssessments.map((app) => {
                  const assessment = assessments.find(a => a.id === app.assessmentId);
                  const cls = classes.find(c => c.id === app.classId);
                  return (
                    <TableRow key={app.id}>
                      <TableCell>{new Date(app.date).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="font-medium">{assessment?.name || "Desconhecida"}</TableCell>
                      <TableCell>{cls?.name || "Desconhecida"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onSelectApplication(app)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Lançar
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => {
                              if (window.confirm(`Tem certeza que deseja excluir esta aplicação?`)) {
                                deleteAppliedAssessment(app.id);
                                toast.success("Aplicação excluída.");
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
