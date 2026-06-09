import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuestions, Question } from "@/hooks/useQuestions";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { QuestionForm, QuestionFormValue } from "@/components/QuestionForm";
import { QuestionPreview } from "@/components/QuestionPreview";
import {
  AlignLeft,
  BookOpen,
  Eye,
  FileText,
  Filter,
  Pencil,
  RotateCcw,
  Search,
  Trash2,
  X,
  User,
  CalendarDays,
  Archive,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { MathText } from "@/components/MathText";

// ── Helpers ───────────────────────────────────────────────────────────────────

const ALL = "__all__";

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

// ── View Modal ────────────────────────────────────────────────────────────────

interface ViewModalProps {
  question: Question | null;
  open: boolean;
  onClose: () => void;
}

function ViewModal({ question, open, onClose }: ViewModalProps) {
  if (!question) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <span>Visualizar Questão</span>
            <div className="flex flex-wrap gap-1.5">
              <Badge
                variant="outline"
                className={
                  question.type === "objetiva"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-violet-50 text-violet-700 border-violet-200"
                }
              >
                {question.type === "objetiva" ? (
                  <FileText className="w-3 h-3 mr-1" />
                ) : (
                  <AlignLeft className="w-3 h-3 mr-1" />
                )}
                {question.type === "objetiva" ? "Objetiva" : "Discursiva"}
              </Badge>
              <Badge variant="secondary">{question.subject}</Badge>
              <Badge variant="outline" className="text-xs">{question.grade}</Badge>
              {question.skill && (
                <Badge variant="outline" className="border-primary/20 text-primary font-mono text-xs">
                  {question.skill}
                </Badge>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            Visualização completa com gabarito destacado
          </DialogDescription>
        </DialogHeader>

        <div className="border rounded-lg p-5 bg-background mt-2">
          <QuestionPreview
            data={question}
            showAnswer={true}
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function BancoPage() {
  const { isAdmin, user } = useAuth();
  const { questions, updateQuestion, deleteQuestion } = useQuestions();
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [viewingQuestion, setViewingQuestion] = useState<Question | null>(null);

  // ── Filter state ─────────────────────────────────────────────────────────
  const [search, setSearch]           = useState("");
  const [filterGrade, setFilterGrade] = useState(ALL);
  const [filterSubject, setFilterSubject] = useState(ALL);
  const [filterSkill, setFilterSkill] = useState(ALL);
  const [filterType, setFilterType]   = useState<"__all__" | "objetiva" | "discursiva">(ALL as any);
  const [filterAuthor, setFilterAuthor] = useState(ALL);

  // ── Cascading options derived from real data in the bank ─────────────────
  
  const visibleQuestions = useMemo(() => {
    return isAdmin ? questions : questions.filter(q => q.createdBy === user?.id);
  }, [questions, isAdmin, user?.id]);

  /** All distinct grades present in the bank */
  const availableGrades = useMemo(
    () => unique(visibleQuestions.map((q) => q.grade)).sort(),
    [visibleQuestions]
  );

  /** Subjects available after grade filter */
  const availableSubjects = useMemo(() => {
    const pool = filterGrade === ALL ? visibleQuestions : visibleQuestions.filter((q) => q.grade === filterGrade);
    return unique(pool.map((q) => q.subject)).sort();
  }, [visibleQuestions, filterGrade]);

  /** Skills available after grade+subject filter */
  const availableSkills = useMemo(() => {
    let pool = visibleQuestions;
    if (filterGrade   !== ALL) pool = pool.filter((q) => q.grade   === filterGrade);
    if (filterSubject !== ALL) pool = pool.filter((q) => q.subject === filterSubject);
    return unique(pool.flatMap((q) => (q.skill ? [q.skill] : []))).sort();
  }, [visibleQuestions, filterGrade, filterSubject]);

  const availableAuthors = useMemo(() => {
    return unique(visibleQuestions.map((q) => q.createdByName || 'Desconhecido')).sort();
  }, [visibleQuestions]);

  // Reset downstream filters when an upstream filter changes
  const handleGradeChange = (val: string) => {
    setFilterGrade(val);
    setFilterSubject(ALL);
    setFilterSkill(ALL);
  };
  const handleSubjectChange = (val: string) => {
    setFilterSubject(val);
    setFilterSkill(ALL);
  };

  const hasActiveFilters =
    search !== "" ||
    filterGrade !== ALL ||
    filterSubject !== ALL ||
    filterSkill !== ALL ||
    filterType !== ALL ||
    filterAuthor !== ALL;

  const clearFilters = () => {
    setSearch("");
    setFilterGrade(ALL);
    setFilterSubject(ALL);
    setFilterSkill(ALL);
    setFilterType(ALL as any);
    setFilterAuthor(ALL);
  };

  // ── Filtered list ─────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return visibleQuestions.filter((item) => {
      if (filterGrade   !== ALL && item.grade   !== filterGrade)   return false;
      if (filterSubject !== ALL && item.subject !== filterSubject) return false;
      if (filterSkill   !== ALL && item.skill   !== filterSkill)   return false;
      if (filterType    !== ALL && item.type    !== filterType)     return false;
      if (filterAuthor  !== ALL && (item.createdByName || 'Desconhecido') !== filterAuthor) return false;
      if (q && !item.statement.toLowerCase().includes(q))          return false;
      return true;
    });
  }, [visibleQuestions, search, filterGrade, filterSubject, filterSkill, filterType, filterAuthor]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleEditSubmit = async (value: QuestionFormValue) => {
    if (editingQuestion) {
      updateQuestion(editingQuestion.id, value);
      toast.success("Questão atualizada com sucesso!");
      setEditingQuestion(null);
    }
  };

  const handleDelete = (id: string) => {
    deleteQuestion(id);
    toast.success("Questão excluída do banco local.");
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Banco de Questões</h1>
          <p className="text-muted-foreground mt-1">
            {visibleQuestions.length === 0
              ? "Gerencie as questões cadastradas no seu navegador."
              : `${visibleQuestions.length} questão${visibleQuestions.length > 1 ? "ões" : ""} no banco`}
          </p>
        </div>
        <Link href="/cadastro">
          <Button>Cadastrar Nova Questão</Button>
        </Link>
      </div>

      {/* Empty bank */}
      {visibleQuestions.length === 0 ? (
        <Card className="bg-accent/5 border-dashed">
          <CardContent className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="font-medium text-lg">Nenhuma questão encontrada</p>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Seu banco local está vazio. Comece adicionando questões para poder gerar provas.
              </p>
            </div>
            <Link href="/cadastro">
              <Button className="mt-2">Começar a cadastrar</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ── Filter panel ── */}
          <Card className="border-border/60 bg-muted/20">
            <CardContent className="p-4 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="filter-search"
                  placeholder="Buscar pelo enunciado..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-9"
                />
                {search && (
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setSearch("")}
                    aria-label="Limpar busca"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Dropdown filters */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {/* Etapa */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Etapa</Label>
                  <Select value={filterGrade} onValueChange={handleGradeChange}>
                    <SelectTrigger id="filter-grade" className="h-9 text-sm">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>Todas as etapas</SelectItem>
                      {availableGrades.map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Disciplina */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Disciplina</Label>
                  <Select
                    value={filterSubject}
                    onValueChange={handleSubjectChange}
                    disabled={availableSubjects.length === 0}
                  >
                    <SelectTrigger id="filter-subject" className="h-9 text-sm">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>Todas as disciplinas</SelectItem>
                      {availableSubjects.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Habilidade */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Habilidade</Label>
                  <Input
                    id="filter-skill"
                    list="filter-skills-list"
                    value={filterSkill === ALL ? "" : filterSkill}
                    onChange={(e) => setFilterSkill(e.target.value.toUpperCase() || ALL)}
                    disabled={availableSkills.length === 0}
                    placeholder="Todas"
                    className="h-9 text-sm"
                  />
                  <datalist id="filter-skills-list">
                    {availableSkills.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </datalist>
                </div>

                {/* Tipo */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Tipo</Label>
                  <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
                    <SelectTrigger id="filter-type" className="h-9 text-sm">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>Todos os tipos</SelectItem>
                      <SelectItem value="objetiva">Objetiva</SelectItem>
                      <SelectItem value="discursiva">Discursiva</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Professor (Apenas Admin) */}
                {isAdmin && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Professor</Label>
                    <Select value={filterAuthor} onValueChange={setFilterAuthor} disabled={availableAuthors.length === 0}>
                      <SelectTrigger id="filter-author" className="h-9 text-sm">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL}>Todos os autores</SelectItem>
                        {availableAuthors.map((a) => (
                          <SelectItem key={a} value={a}>{a}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Result summary + clear button */}
              <div className="flex items-center justify-between pt-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5" />
                  {hasActiveFilters
                    ? `${filtered.length} de ${visibleQuestions.length} questão${visibleQuestions.length > 1 ? "ões" : ""} encontrada${filtered.length !== 1 ? "s" : ""}`
                    : `${visibleQuestions.length} questão${visibleQuestions.length > 1 ? "ões" : ""} no banco`}
                </p>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-muted-foreground gap-1.5"
                    onClick={clearFilters}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Limpar filtros
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ── Results ── */}
          {filtered.length === 0 ? (
            <Card className="bg-muted/10 border-dashed">
              <CardContent className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                <Search className="w-10 h-10 text-muted-foreground/30" />
                <p className="font-medium text-foreground/70">Nenhuma questão encontrada</p>
                <p className="text-sm text-muted-foreground">
                  Tente ajustar os filtros ou{" "}
                  <button
                    className="underline text-primary hover:no-underline"
                    onClick={clearFilters}
                  >
                    limpar todos
                  </button>
                  .
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((q) => (
                <Card key={q.id} className="flex flex-col hover:border-primary/40 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex flex-wrap gap-1.5">
                        <Badge
                          variant="outline"
                          className={
                            q.type === "objetiva"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-violet-50 text-violet-700 border-violet-200"
                          }
                        >
                          {q.type === "objetiva" ? (
                            <FileText className="w-3 h-3 mr-1" />
                          ) : (
                            <AlignLeft className="w-3 h-3 mr-1" />
                          )}
                          {q.type === "objetiva" ? "Objetiva" : "Discursiva"}
                        </Badge>
                        <Badge variant="secondary">{q.subject}</Badge>
                        {q.skill && (
                          <Badge variant="outline" className="border-primary/20 text-primary font-mono text-xs">
                            {q.skill}
                          </Badge>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0 whitespace-nowrap">
                        {q.grade}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col justify-between">
                    <p className="text-sm line-clamp-4 text-foreground/90 leading-relaxed mb-4">
                      <MathText text={q.statement} />
                    </p>
                    
                    <div className="mt-auto space-y-2 pt-2 border-t border-border/40">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5" title="Autor">
                          <User className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[120px]">{q.createdByName || 'Administrador'}</span>
                        </div>
                        <div className="flex items-center gap-1.5" title="Data de criação">
                          <CalendarDays className="w-3.5 h-3.5" />
                          <span>{new Date(q.createdAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-xs">
                        {q.status === 'publicado' && <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200"><CheckCircle2 className="w-3 h-3 mr-1" /> Publicado</Badge>}
                        {(!q.status || q.status === 'rascunho') && <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200"><FileText className="w-3 h-3 mr-1" /> Rascunho</Badge>}
                        {q.status === 'arquivado' && <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-300"><Archive className="w-3 h-3 mr-1" /> Arquivado</Badge>}
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-3 border-t border-border flex justify-between bg-muted/20">
                    {/* View */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-muted-foreground hover:text-foreground"
                      onClick={() => setViewingQuestion(q)}
                      title="Visualizar questão completa"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver
                    </Button>

                    <div className="flex items-center gap-1">
                      {/* Edit */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-muted-foreground hover:text-foreground"
                        onClick={() => setEditingQuestion(q)}
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        Editar
                      </Button>

                      {/* Delete */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação excluirá permanentemente a questão do seu banco local.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(q.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Sim, excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* View modal */}
      <ViewModal
        question={viewingQuestion}
        open={!!viewingQuestion}
        onClose={() => setViewingQuestion(null)}
      />

      {/* Edit dialog */}
      <Dialog open={!!editingQuestion} onOpenChange={(open) => !open && setEditingQuestion(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Questão</DialogTitle>
          </DialogHeader>
          {editingQuestion && (
            <div className="py-4">
              <QuestionForm
                key={editingQuestion?.id}
                initial={editingQuestion}
                onSubmit={handleEditSubmit}
                onCancel={() => setEditingQuestion(null)}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}