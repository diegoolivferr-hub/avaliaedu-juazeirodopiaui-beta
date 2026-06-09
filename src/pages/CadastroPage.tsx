import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  CheckSquare,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Eye,
  Layers,
  Lightbulb,
  ListOrdered,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
  GraduationCap,
} from "lucide-react";

import { QuestionForm, QuestionFormValue } from "@/components/QuestionForm";
import { AssessmentViewer } from "@/components/AssessmentViewer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MathText } from "@/components/MathText";
import { useQuestions } from "@/hooks/useQuestions";
import type { Question } from "@/hooks/useQuestions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/** Questão temporária — igual a Question mas com id gerado localmente */
interface TempQuestion extends QuestionFormValue {
  _tempId: string;
}

function makeTempId() {
  return `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Summarise statement to max N chars */
function summarise(text: string, max = 80) {
  if (!text) return "(sem enunciado)";
  return text.length > max ? text.slice(0, max) + "…" : text;
}

export default function CadastroPage() {
  const { addQuestion } = useQuestions();

  // ── Lista temporária ───────────────────────────────────────────────────────
  const [tempList, setTempList] = useState<TempQuestion[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  /** Token incrementado após cada adição — dispara reset interno no QuestionForm */
  const [batchResetToken, setBatchResetToken] = useState(0);
  /** Grade+subject da última questão — exibido no banner de contexto */
  const [persistedBncc, setPersistedBncc] = useState<{ grade: string; subject: string } | null>(null);
  /** Token para forçar reset completo do formulário após salvar */
  const [formKey, setFormKey] = useState(0);

  // Questão being edited (null = new)
  const editingQuestion =
    editingId ? tempList.find((q) => q._tempId === editingId) ?? null : null;

  // ── Handlers ───────────────────────────────────────────────────────────────

  /** Adiciona à lista temp / atualiza existente */
  const handleAddToList = useCallback(
    async (value: QuestionFormValue) => {
      if (editingId) {
        setTempList((prev) =>
          prev.map((q) =>
            q._tempId === editingId ? { ...value, _tempId: editingId } : q
          )
        );
        setEditingId(null);
        toast.success("Questão atualizada na lista!");
      } else {
        setTempList((prev) => [...prev, { ...value, _tempId: makeTempId() }]);
        // Persiste grade+subject para o banner e dispara reset interno do form
        setPersistedBncc({ grade: value.grade, subject: value.subject });
        setBatchResetToken((t) => t + 1);
        toast.success(`Questão ${tempList.length + 1} adicionada! Selecione a habilidade para continuar.`);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [editingId, tempList.length]
  );

  /** Remover da lista */
  const handleRemove = (id: string) => {
    setTempList((prev) => prev.filter((q) => q._tempId !== id));
    if (editingId === id) setEditingId(null);
    toast.info("Questão removida da lista.");
  };

  /** Mover para cima */
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setTempList((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  /** Mover para baixo */
  const handleMoveDown = (index: number) => {
    setTempList((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index + 1], next[index]] = [next[index], next[index + 1]];
      return next;
    });
  };

  /** Salvar todas no banco */
  const handleSaveAll = async () => {
    if (tempList.length === 0) return;
    setSavingAll(true);
    try {
      for (const q of tempList) {
        const { _tempId, ...value } = q;
        addQuestion(value as QuestionFormValue);
      }
      toast.success("Questões salvas com sucesso!");
      setTempList([]);
      setEditingId(null);
      setPersistedBncc(null);
      // Força reset completo do formulário
      setFormKey((k) => k + 1);
      setBatchResetToken((t) => t + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSavingAll(false);
    }
  };

  /** Converter lista temp para Question[] para o AssessmentViewer */
  const tempAsQuestions: Question[] = tempList.map((q, i) => ({
    ...(q as QuestionFormValue),
    id: q._tempId,
    createdAt: i,
  } as unknown as Question));

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-6 lg:px-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Cadastrar questões
          </h1>
          <p className="text-muted-foreground mt-1">
            Crie uma ou várias questões e salve tudo de uma vez.
          </p>
        </div>
      </div>

      {/* Dica contextual */}
      <Card className="bg-accent/5 border-accent/30">
        <CardContent className="p-4 flex gap-3 items-start">
          <Lightbulb className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Preencha o formulário e clique em <strong>"Adicionar à lista"</strong> para cada questão.
            Quando terminar, clique em <strong>"Salvar"</strong> para gravar todas no banco de questões.
          </p>
        </CardContent>
      </Card>

      {/* ── FLUXO ÚNICO ── */}
      <div className="space-y-8">
        {/* Formulário */}
        <div>
          {editingId && (
            <div className="mb-3 flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium">
              <Eye className="w-4 h-4 shrink-0" />
              Editando questão #{tempList.findIndex((q) => q._tempId === editingId) + 1} — salve para atualizar na lista.
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 ml-auto text-amber-600 hover:bg-amber-100"
                onClick={() => setEditingId(null)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}

          {/* Banner de contexto: mostra grade+subject fixados, lembra que skill é obrigatória */}
          {!editingId && persistedBncc && (
            <div className="mb-3 flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/5 border border-primary/20 text-sm">
              <GraduationCap className="w-4 h-4 text-primary shrink-0" />
              <span className="text-foreground/70">Criando para:</span>
              <span className="font-semibold text-primary">
                {persistedBncc.subject} &mdash; {persistedBncc.grade}
              </span>
              <span className="ml-auto text-xs text-destructive font-medium animate-pulse">
                ⚠ Selecione a habilidade
              </span>
            </div>
          )}

          <QuestionForm
            key={editingId ?? `batch-form-${formKey}`}
            initial={
              editingQuestion
                ? ({
                    ...editingQuestion,
                    id: editingQuestion._tempId,
                    createdAt: 0,
                  } as unknown as Question)
                : null
            }
            batchMode={!editingId}
            batchResetToken={editingId ? undefined : batchResetToken}
            submitLabel={
              editingId
                ? "Atualizar na lista"
                : `Adicionar à lista ${tempList.length > 0 ? `(${tempList.length} já adicionada${tempList.length > 1 ? "s" : ""})` : ""}`
            }
            submitIcon={editingId ? <Save className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            submitting={false}
            onSubmit={handleAddToList}
          />
        </div>

        {/* Lista temporária + preview */}
        {tempList.length > 0 && (
          <Tabs defaultValue="list" className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <TabsList>
                <TabsTrigger value="list" className="gap-2">
                  <ClipboardList className="w-4 h-4" />
                  Lista ({tempList.length})
                </TabsTrigger>
                <TabsTrigger value="preview" className="gap-2">
                  <Eye className="w-4 h-4" />
                  Pré-visualização A4
                </TabsTrigger>
              </TabsList>

              {/* Salvar */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    className="gap-2 bg-primary hover:bg-primary/90"
                    disabled={savingAll}
                  >
                    {savingAll ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckSquare className="w-4 h-4" />
                    )}
                    Salvar ({tempList.length})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Salvar questões?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {tempList.length === 1
                        ? "A questão será salva no banco de questões. Essa ação não pode ser desfeita."
                        : `As ${tempList.length} questões serão salvas no banco de questões. Essa ação não pode ser desfeita.`}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSaveAll}>
                      Confirmar e salvar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* Lista */}
            <TabsContent value="list" className="mt-0">
              <div className="space-y-3">
                {tempList.map((q, index) => (
                  <Card
                    key={q._tempId}
                    className={`transition-all ${
                      editingId === q._tempId
                        ? "border-amber-400 ring-2 ring-amber-200"
                        : "hover:border-primary/40"
                    }`}
                  >
                    <CardContent className="p-4 flex items-start gap-4">
                      {/* Número */}
                      <div className="shrink-0 w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            {q.type === "objetiva" ? "Objetiva" : "Discursiva"}
                          </span>
                          {q.skill && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">
                              {q.skill}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {q.grade} · {q.subject}
                          </span>
                        </div>
                        <p className="text-sm text-foreground leading-snug">
                          <MathText text={summarise(q.statement)} />
                        </p>
                      </div>

                      {/* Ações */}
                      <div className="shrink-0 flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          title="Mover para cima"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === tempList.length - 1}
                          title="Mover para baixo"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary hover:bg-primary/10"
                          onClick={() =>
                            setEditingId(
                              editingId === q._tempId ? null : q._tempId
                            )
                          }
                          title="Editar"
                        >
                          <ListOrdered className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemove(q._tempId)}
                          title="Remover"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Preview A4 */}
            <TabsContent value="preview" className="mt-0">
              <div className="rounded-lg border bg-gray-100 overflow-auto">
                <AssessmentViewer
                  questions={tempAsQuestions}
                  formatting={{
                    margin: "Média",
                    margins: { top: 2, right: 2, bottom: 2, left: 2 },
                    font: "Arial",
                    fontSize: 12,
                    spacing: "1.5",
                  }}
                  previewMode={true}
                />
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Empty state */}
        {tempList.length === 0 && (
          <div className="text-center py-16 border-2 border-dashed rounded-xl bg-muted/10">
            <Layers className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-medium text-foreground/70">
              Nenhuma questão na lista ainda
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Preencha o formulário acima e clique em "Adicionar à lista".
            </p>
          </div>
        )}
      </div>
    </div>
  );
}