import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useClasses } from "@/hooks/useClasses";
import { usePedagogical } from "@/hooks/usePedagogical";

export function ClassesTab() {
  const { classes, addClass, deleteClass } = useClasses();
  const { stages } = usePedagogical();

  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [shift, setShift] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !grade || !shift || !year) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    addClass({ name, grade, shift, year });
    setName("");
    setGrade("");
    setShift("");
    toast.success("Turma adicionada com sucesso!");
  };

  return (
    <div className="grid md:grid-cols-[300px_1fr] gap-6">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-lg">Nova Turma</CardTitle>
          <CardDescription>Cadastre uma turma para acompanhar os alunos.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Turma *</Label>
              <Input
                placeholder="Ex: 5º Ano A"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Etapa de Ensino *</Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((stage) => (
                    <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Turno *</Label>
              <Select value={shift} onValueChange={setShift}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Matutino">Matutino</SelectItem>
                  <SelectItem value="Vespertino">Vespertino</SelectItem>
                  <SelectItem value="Noturno">Noturno</SelectItem>
                  <SelectItem value="Integral">Integral</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ano Letivo *</Label>
              <Input
                placeholder="Ex: 2026"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Turmas Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {classes.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhuma turma cadastrada.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Etapa</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead>Ano Letivo</TableHead>
                  <TableHead className="w-[100px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((cls) => (
                  <TableRow key={cls.id}>
                    <TableCell className="font-medium">{cls.name}</TableCell>
                    <TableCell>{cls.grade}</TableCell>
                    <TableCell>{cls.shift}</TableCell>
                    <TableCell>{cls.year}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => {
                          if (window.confirm(`Tem certeza que deseja excluir a turma "${cls.name}"?`)) {
                            deleteClass(cls.id);
                            toast.success("Turma excluída.");
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
