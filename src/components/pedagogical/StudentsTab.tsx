import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useStudents } from "@/hooks/useStudents";
import { useClasses } from "@/hooks/useClasses";

export function StudentsTab() {
  const { students, addStudent, deleteStudent } = useStudents();
  const { classes } = useClasses();

  const [name, setName] = useState("");
  const [enrollment, setEnrollment] = useState("");
  const [classId, setClassId] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !classId) {
      toast.error("Nome e Turma são obrigatórios.");
      return;
    }
    addStudent({ name, enrollment, classId });
    setName("");
    setEnrollment("");
    toast.success("Aluno adicionado com sucesso!");
  };

  return (
    <div className="grid md:grid-cols-[300px_1fr] gap-6">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-lg">Novo Aluno</CardTitle>
          <CardDescription>Cadastre um aluno manualmente ou importe via planilha.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Aluno *</Label>
              <Input
                placeholder="Ex: João Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Matrícula (opcional)</Label>
              <Input
                placeholder="Ex: 2026001"
                value={enrollment}
                onChange={(e) => setEnrollment(e.target.value)}
              />
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
            <Button type="submit" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
            <Button type="button" variant="outline" className="w-full" onClick={() => toast.info("Importação via planilha será disponibilizada em breve.")}>
              <Upload className="w-4 h-4 mr-2" />
              Importar Planilha
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Alunos Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhum aluno cadastrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead className="w-[100px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => {
                  const studentClass = classes.find(c => c.id === student.classId);
                  return (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.enrollment || "—"}</TableCell>
                      <TableCell>{studentClass?.name || "Desconhecida"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => {
                            if (window.confirm(`Tem certeza que deseja excluir o aluno "${student.name}"?`)) {
                              deleteStudent(student.id);
                              toast.success("Aluno excluído.");
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
