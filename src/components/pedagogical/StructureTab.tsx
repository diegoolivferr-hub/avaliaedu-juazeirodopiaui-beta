import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { usePedagogical, type Skill } from "@/hooks/usePedagogical";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

function truncate(text: string, max = 100) {
  if (!text) return "";
  return text.length > max ? text.slice(0, max) + "…" : text;
}

interface ViewModalProps {
  skill: Skill | null;
  subjectName: string;
  open: boolean;
  onClose: () => void;
}

function ViewModal({ skill, subjectName, open, onClose }: ViewModalProps) {
  if (!skill) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Badge variant="secondary" className="font-mono text-base px-3 py-1">
              {skill.code}
            </Badge>
          </DialogTitle>
          <DialogDescription>Detalhes completos da habilidade</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground font-medium mb-1">Etapa</p>
              <p className="font-semibold">{skill.grade}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-medium mb-1">Disciplina</p>
              <p className="font-semibold">{subjectName || "---"}</p>
            </div>
          </div>

          {skill.objetoConhecimento && (
            <div>
              <p className="text-muted-foreground font-medium mb-1 text-sm">Objeto de Conhecimento</p>
              <p className="text-sm bg-muted/40 rounded-md px-3 py-2 border">{skill.objetoConhecimento}</p>
            </div>
          )}

          <div>
            <p className="text-muted-foreground font-medium mb-1 text-sm">Descrição</p>
            <p className="text-sm leading-relaxed bg-muted/40 rounded-md px-3 py-2 border">
              {skill.description}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface EditModalProps {
  skill: Skill | null;
  stages: string[];
  subjects: { id: string; name: string }[];
  open: boolean;
  onClose: () => void;
  onSave: (id: string, data: Partial<Omit<Skill, "id" | "createdAt">>) => void;
}

function EditModal({ skill, stages, subjects, open, onClose, onSave }: EditModalProps) {
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [objetoConhecimento, setObjetoConhecimento] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [grade, setGrade] = useState("");

  useEffect(() => {
    if (open && skill) {
      setCode(skill.code);
      setDescription(skill.description);
      setObjetoConhecimento(skill.objetoConhecimento ?? "");
      setSubjectId(skill.subjectId);
      setGrade(skill.grade);
    }
  }, [open, skill]);

  const handleOpenChange = (v: boolean) => {
    if (!v) onClose();
  };

  const handleSave = () => {
    if (!code.trim() || !description.trim() || !subjectId || !grade) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    onSave(skill!.id, {
      code: code.trim(),
      description: description.trim(),
      objetoConhecimento: objetoConhecimento.trim() || undefined,
      subjectId,
      grade,
    });
    onClose();
    toast.success("Habilidade atualizada com sucesso!");
  };

  if (!skill) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Habilidade</DialogTitle>
          <DialogDescription>Atualize os dados da habilidade abaixo.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-grade">Etapa de Ensino *</Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger id="edit-grade">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-subject">Disciplina *</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger id="edit-subject">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-code">Código *</Label>
            <Input
              id="edit-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ex: EF05LP01"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-objeto">Objeto de Conhecimento</Label>
            <Input
              id="edit-objeto"
              value={objetoConhecimento}
              onChange={(e) => setObjetoConhecimento(e.target.value)}
              placeholder="Ex: Estratégia de leitura"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-desc">Descrição *</Label>
            <Textarea
              id="edit-desc"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição completa da habilidade"
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar Alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function StructureTab() {
  const {
    stages,
    subjects,
    skills,
    addSubject,
    deleteSubject,
    addSkill,
    updateSkill,
    deleteSkill,
  } = usePedagogical();

  const [newSubjectName, setNewSubjectName] = useState("");
  const [skillCode, setSkillCode] = useState("");
  const [skillDesc, setSkillDesc] = useState("");
  const [skillObjeto, setSkillObjeto] = useState("");
  const [skillSubject, setSkillSubject] = useState("");
  const [skillGrade, setSkillGrade] = useState("");
  const [viewSkill, setViewSkill] = useState<Skill | null>(null);
  const [editSkill, setEditSkill] = useState<Skill | null>(null);

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    if (subjects.some((s) => s.name.toLowerCase() === newSubjectName.trim().toLowerCase())) {
      toast.error("Já existe uma disciplina com este nome.");
      return;
    }
    addSubject(newSubjectName.trim());
    setNewSubjectName("");
    toast.success("Disciplina adicionada com sucesso!");
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillCode.trim() || !skillDesc.trim() || !skillSubject || !skillGrade) {
      toast.error("Preencha todos os campos obrigatórios da habilidade.");
      return;
    }
    if (skills.some((s) => s.code.toLowerCase() === skillCode.trim().toLowerCase())) {
      toast.error("Já existe uma habilidade com este código.");
      return;
    }
    addSkill({
      code: skillCode.trim(),
      description: skillDesc.trim(),
      objetoConhecimento: skillObjeto.trim() || undefined,
      subjectId: skillSubject,
      grade: skillGrade,
    });
    setSkillCode("");
    setSkillDesc("");
    setSkillObjeto("");
    toast.success("Habilidade adicionada com sucesso!");
  };

  return (
    <div>
      <Tabs defaultValue="disciplinas" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="etapas">Etapas</TabsTrigger>
          <TabsTrigger value="disciplinas">Disciplinas</TabsTrigger>
          <TabsTrigger value="habilidades">Habilidades</TabsTrigger>
        </TabsList>

        <TabsContent value="etapas" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Etapas de Ensino</CardTitle>
              <CardDescription>
                Lista padrão de anos escolares. Esta lista é fixa e não pode ser alterada para garantir a consistência do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {stages.map((stage) => (
                  <div key={stage} className="border rounded-md p-3 text-center bg-muted/20 font-medium">
                    {stage}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="disciplinas" className="mt-6">
          <div className="grid md:grid-cols-[300px_1fr] gap-6">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="text-lg">Nova Disciplina</CardTitle>
                <CardDescription>Cadastre uma nova disciplina no sistema.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddSubject} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject-name">Nome da Disciplina</Label>
                    <Input
                      id="subject-name"
                      placeholder="Ex: Matemática"
                      value={newSubjectName}
                      onChange={(e) => setNewSubjectName(e.target.value)}
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
                <CardTitle className="text-lg">Disciplinas Cadastradas</CardTitle>
              </CardHeader>
              <CardContent>
                {subjects.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Nenhuma disciplina cadastrada.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead className="w-[100px] text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subjects.map((subject) => (
                        <TableRow key={subject.id}>
                          <TableCell className="font-medium">{subject.name}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => {
                                if (window.confirm(`Tem certeza que deseja excluir a disciplina "${subject.name}"? Isso também removerá as habilidades vinculadas a ela.`)) {
                                  deleteSubject(subject.id);
                                  toast.success("Disciplina excluída.");
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
        </TabsContent>

        <TabsContent value="habilidades" className="mt-6">
          <div className="grid xl:grid-cols-[380px_1fr] gap-6 items-start">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="text-lg">Nova Habilidade (BNCC)</CardTitle>
                <CardDescription>Cadastre uma nova habilidade associando-a a uma etapa e disciplina.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddSkill} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="skill-grade">Etapa de Ensino *</Label>
                    <Select value={skillGrade} onValueChange={setSkillGrade}>
                      <SelectTrigger id="skill-grade">
                        <SelectValue placeholder="Selecione a etapa" />
                      </SelectTrigger>
                      <SelectContent>
                        {stages.map((stage) => (
                          <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="skill-subject">Disciplina *</Label>
                    <Select value={skillSubject} onValueChange={setSkillSubject}>
                      <SelectTrigger id="skill-subject">
                        <SelectValue placeholder="Selecione a disciplina" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="skill-code">Código *</Label>
                    <Input
                      id="skill-code"
                      placeholder="Ex: EF05LP01"
                      value={skillCode}
                      onChange={(e) => setSkillCode(e.target.value.toUpperCase())}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="skill-objeto">Objeto de Conhecimento</Label>
                    <Input
                      id="skill-objeto"
                      placeholder="Ex: Estratégia de leitura"
                      value={skillObjeto}
                      onChange={(e) => setSkillObjeto(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="skill-desc">Descrição *</Label>
                    <Textarea
                      id="skill-desc"
                      placeholder="Descrição da habilidade"
                      value={skillDesc}
                      onChange={(e) => setSkillDesc(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Habilidade
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Habilidades Cadastradas</CardTitle>
                <CardDescription>
                  {skills.length} habilidade{skills.length !== 1 ? "s" : ""} cadastrada{skills.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {skills.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhuma habilidade cadastrada.</p>
                ) : (
                  <div className="rounded-md border overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[110px]">Código</TableHead>
                          <TableHead className="w-[160px]">Objeto de Conhecimento</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead className="w-[100px]">Etapa</TableHead>
                          <TableHead className="w-[120px]">Disciplina</TableHead>
                          <TableHead className="w-[110px] text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {skills.map((skill) => {
                          const subject = subjects.find((s) => s.id === skill.subjectId);
                          return (
                            <TableRow key={skill.id}>
                              <TableCell>
                                <Badge variant="outline" className="font-mono whitespace-nowrap">
                                  {skill.code}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {skill.objetoConhecimento
                                  ? truncate(skill.objetoConhecimento, 60)
                                  : <span className="italic opacity-50">—</span>}
                              </TableCell>
                              <TableCell>
                                <p
                                  className="text-sm leading-snug"
                                  style={{
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                  }}
                                  title={skill.description}
                                >
                                  {skill.description}
                                </p>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                {skill.grade}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                {subject?.name || "---"}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                    onClick={() => setViewSkill(skill)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                    onClick={() => setEditSkill(skill)}
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => {
                                      if (window.confirm(`Tem certeza que deseja excluir a habilidade ${skill.code}?`)) {
                                        deleteSkill(skill.id);
                                        toast.success("Habilidade excluída.");
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
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <ViewModal
        skill={viewSkill}
        subjectName={subjects.find((s) => s.id === viewSkill?.subjectId)?.name ?? ""}
        open={!!viewSkill}
        onClose={() => setViewSkill(null)}
      />

      <EditModal
        skill={editSkill}
        stages={stages}
        subjects={subjects}
        open={!!editSkill}
        onClose={() => setEditSkill(null)}
        onSave={updateSkill}
      />
    </div>
  );
}
