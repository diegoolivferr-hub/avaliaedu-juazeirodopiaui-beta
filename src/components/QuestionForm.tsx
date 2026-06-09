import { useState, useEffect, useRef } from "react";

import type { Question } from "@/hooks/useQuestions";
import { usePedagogical } from "@/hooks/usePedagogical";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ImagePicker } from "./ImagePicker";
import { GrammarCheckButton } from "./GrammarCheckDialog";
import { QuestionPreview } from "./QuestionPreview";
import { AssessmentViewer } from "./AssessmentViewer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { htmlToPlainText, isHtml } from "@/lib/html-utils";
import {
  ALTERNATIVE_KEYS,
  ANSWER_LINES_DEFAULT,
  ANSWER_LINES_PRESETS,
  DEFAULT_GRADES,
  DEFAULT_SECTIONS,
  DEFAULT_SUBJECTS,
  DIFFICULTY_OPTIONS,
  QUESTION_TYPE_OPTIONS,
} from "@/lib/constants";
import {
  Save,
  Loader2,
  Eye,
  ChevronDown,
  BookText,
  ListChecks,
  AlignLeft,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
} from "lucide-react";

export interface OptionalBlock {
  id: string;
  type?: "text" | "image";
  instruction?: string;
  title?: string;
  content: string;
  author?: string;
  width?: number;
  height?: number;
  imageUrl?: string;
}

export interface StatementImage {
  id: string;
  url: string;
  width?: number;
  height?: number;
}

export interface DiscursiveRubric {
  level1: string;
  level2: string;
  level3: string;
  level4: string;
}

export interface QuestionFormValue {
  type: "objetiva" | "discursiva";
  statement: string;
  statementImage: string | null;
  statementContinuation: string | null;
  alternativeA: string;
  alternativeAImage: string | null;
  alternativeB: string;
  alternativeBImage: string | null;
  alternativeC: string;
  alternativeCImage: string | null;
  alternativeD: string;
  alternativeDImage: string | null;
  correctAlternative: "A" | "B" | "C" | "D" | null;
  answerLines: number | null;
  showAnswerLines: boolean;
  supportText: string | null;
  supportTitle: string | null;
  supportAuthor: string | null;
  subject: string;
  grade: string;
  skill: string | null;
  optionalBlocks?: OptionalBlock[];
  statementImagesList?: StatementImage[];
  discursiveRubric?: DiscursiveRubric;
}

const empty: QuestionFormValue = {
  type: "objetiva",
  statement: "",
  statementImage: null,
  statementContinuation: null,
  alternativeA: "",
  alternativeAImage: null,
  alternativeB: "",
  alternativeBImage: null,
  alternativeC: "",
  alternativeCImage: null,
  alternativeD: "",
  alternativeDImage: null,
  correctAlternative: "A",
  answerLines: null,
  showAnswerLines: true,
  supportText: null,
  supportTitle: null,
  supportAuthor: null,
  subject: "",
  grade: "",
  skill: null,
  optionalBlocks: [],
  statementImagesList: [],
  discursiveRubric: { level1: "", level2: "", level3: "", level4: "" },
};

/** Builds a fully-populated form value from a saved question, handling backward-compat. */
function buildValueFromQuestion(q: Question): QuestionFormValue {
  const rawStatement = q.statement ?? "";
  const statementText = isHtml(rawStatement) ? htmlToPlainText(rawStatement) : rawStatement;
  const t = (q.type as "objetiva" | "discursiva") ?? "objetiva";

  let loadedOptionalBlocks = q.optionalBlocks || [];
  if (loadedOptionalBlocks.length === 0 && (q.supportText || q.supportTitle || q.supportAuthor)) {
    loadedOptionalBlocks = [{
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      type: "text",
      title: q.supportTitle ?? "",
      content: q.supportText ?? "",
      author: q.supportAuthor ?? "",
    }];
  }

  let loadedStatementImages = q.statementImagesList || [];
  if (loadedStatementImages.length === 0 && q.statementImage) {
    loadedStatementImages = [{
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      url: q.statementImage,
    }];
  }

  return {
    type: t,
    statement: statementText,
    statementImage: q.statementImage ?? null,
    statementContinuation: q.statementContinuation ?? null,
    alternativeA: q.alternativeA ?? "",
    alternativeAImage: q.alternativeAImage ?? null,
    alternativeB: q.alternativeB ?? "",
    alternativeBImage: q.alternativeBImage ?? null,
    alternativeC: q.alternativeC ?? "",
    alternativeCImage: q.alternativeCImage ?? null,
    alternativeD: q.alternativeD ?? "",
    alternativeDImage: q.alternativeDImage ?? null,
    correctAlternative:
      (q.correctAlternative as "A" | "B" | "C" | "D" | null) ??
      (t === "objetiva" ? "A" : null),
    answerLines: q.answerLines ?? (t === "discursiva" ? ANSWER_LINES_DEFAULT : null),
    showAnswerLines: q.showAnswerLines ?? true,
    supportText: q.supportText ?? null,
    supportTitle: q.supportTitle ?? null,
    supportAuthor: q.supportAuthor ?? null,
    subject: q.subject,
    grade: q.grade,
    skill: q.skill ?? null,
    optionalBlocks: loadedOptionalBlocks,
    statementImagesList: loadedStatementImages,
    discursiveRubric: q.discursiveRubric ?? { level1: "", level2: "", level3: "", level4: "" },
  };
}

interface Props {
  initial?: Question | null;
  onSubmit: (value: QuestionFormValue) => Promise<void> | void;
  submitting?: boolean;
  onCancel?: () => void;
  resetAfterSubmit?: boolean;
  submitLabel?: string;
  submitIcon?: React.ReactNode;
  /** Em modo de lote: ativa highlight de habilidade e o reset por token */
  batchMode?: boolean;
  /**
   * Incrementar este número após cada adição bem-sucedida.
   * O formulário reseta o conteúdo (enunciado, alternativas, habilidade)
   * mas mantém etapa e disciplina.
   */
  batchResetToken?: number;
}

export function QuestionForm({
  initial,
  onSubmit,
  submitting,
  onCancel,
  resetAfterSubmit,
  submitLabel,
  submitIcon,
  batchMode = false,
  batchResetToken,
}: Props) {
  const { stages, subjects, skills } = usePedagogical();
  // Lazy init: if editing an existing question, populate immediately so the
  // form body is visible on the first render (validBNCC = true right away).
  const [value, setValue] = useState<QuestionFormValue>(() =>
    initial ? buildValueFromQuestion(initial) : empty
  );
  const [touched, setTouched] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  // Rastreia o último token processado para detectar mudanças
  const prevBatchToken = useRef<number>(batchResetToken ?? 0);
  /** Ref para o botão trigger do select de habilidade — usado para foco automático */
  const skillTriggerRef = useRef<HTMLButtonElement>(null);
  /** Sinaliza que o foco deve ser movido para o campo de habilidade após o reset */
  const [focusSkill, setFocusSkill] = useState(false);

  // States for preview formatting
  const [previewFont, setPreviewFont] = useState<"Arial" | "Times New Roman" | "Calibri">("Arial");
  const [previewFontSize, setPreviewFontSize] = useState<10 | 12 | 14>(12);

  /**
   * Reset de conteúdo no modo lote: quando batchResetToken muda, limpa
   * enunciado / alternativas / habilidade mas MANTÉM etapa e disciplina.
   */
  useEffect(() => {
    if (
      batchResetToken !== undefined &&
      batchResetToken !== prevBatchToken.current
    ) {
      prevBatchToken.current = batchResetToken;
      setValue((prev) => ({
        ...empty,
        grade: prev.grade,
        subject: prev.subject,
        skill: null,          // professor DEVE selecionar novamente
      }));
      setTouched(false);
      setSupportOpen(false);
      // Agenda o foco no campo de habilidade após o próximo render
      setFocusSkill(true);
    }
  }, [batchResetToken]);

  /** Move o foco para o select de habilidade assim que o DOM estiver pronto */
  useEffect(() => {
    if (focusSkill && skillTriggerRef.current) {
      // Pequeno delay para garantir que o Radix já terminou de renderizar
      const id = setTimeout(() => {
        skillTriggerRef.current?.focus();
        setFocusSkill(false);
      }, 50);
      return () => clearTimeout(id);
    }
  }, [focusSkill]);

  // When `initial` changes (e.g. user edits a different question without closing
  // the dialog), resync the form state using the shared builder.
  useEffect(() => {
    if (initial) {
      const built = buildValueFromQuestion(initial);
      setValue(built);
      setSupportOpen((built.optionalBlocks?.length ?? 0) > 0);
    }
  }, [initial]);

  const update = <K extends keyof QuestionFormValue>(
    key: K,
    v: QuestionFormValue[K],
  ) => setValue((prev) => ({ ...prev, [key]: v }));

  const onTypeChange = (t: "objetiva" | "discursiva") => {
    setValue((prev) => ({
      ...prev,
      type: t,
      correctAlternative:
        t === "objetiva" ? prev.correctAlternative ?? "A" : null,
      answerLines:
        t === "discursiva" ? prev.answerLines ?? ANSWER_LINES_DEFAULT : null,
    }));
  };

  const currentSubjectId = subjects.find(s => s.name === value.subject)?.id;
  const filteredSkills = skills.filter(
    (s) => s.grade === value.grade && s.subjectId === currentSubjectId
  );

  const validBNCC = !!value.grade && !!value.subject;

  /**
   * O formulário de questão só aparece quando etapa e disciplina estão preenchidas.
   */
  const showFormBody = validBNCC;


  const baseValid =
    validBNCC &&
    value.statement.trim().length > 3;
  const objetivaValid =
    value.type !== "objetiva" ||
    (value.alternativeA.trim() &&
      value.alternativeB.trim() &&
      value.alternativeC.trim() &&
      value.alternativeD.trim() &&
      !!value.correctAlternative);
  const discursivaValid =
    value.type !== "discursiva" ||
    (value.answerLines !== null && value.answerLines >= 1);
  const valid = baseValid && objetivaValid && discursivaValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    const trimOrNull = (s: string | null | undefined) =>
      s && s.trim() ? s : null;

    // Retrocompatibilidade para exportação PDF (que lê os campos antigos)
    let syncSupportText = null;
    let syncSupportTitle = null;
    let syncSupportAuthor = null;
    const firstText = value.optionalBlocks?.find(b => b.type === "text" && b.content.trim());
    if (firstText) {
      syncSupportText = trimOrNull(firstText.content);
      syncSupportTitle = trimOrNull(firstText.title);
      syncSupportAuthor = trimOrNull(firstText.author);
    }

    let syncStatementImage = null;
    if (value.statementImagesList && value.statementImagesList.length > 0) {
      syncStatementImage = value.statementImagesList[0].url;
    }

    await onSubmit({
      ...value,
      statementContinuation: trimOrNull(value.statementContinuation),
      supportText: syncSupportText,
      supportTitle: syncSupportTitle,
      supportAuthor: syncSupportAuthor,
      statementImage: syncStatementImage,
    });
    if (resetAfterSubmit) setValue(empty);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Card className="border-primary/50 shadow-sm bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BookText className="w-4 h-4 text-primary" />
              Classificação Obrigatória BNCC
            </span>
            {validBNCC && (
              <span className="text-sm bg-primary text-primary-foreground px-3 py-1 rounded-full font-medium">
                {value.grade} • {value.subject}{value.skill ? ` • ${value.skill}` : ""}
              </span>
            )}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Selecione a etapa e disciplina para liberar a criação da questão.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label>Etapa de Ensino</Label>
              <Select
                value={value.grade}
                onValueChange={(v) => {
                  update("grade", v);
                  update("skill", null);
                }}
              >
                <SelectTrigger data-testid="select-grade">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Disciplina</Label>
              <Select
                value={value.subject}
                onValueChange={(v) => {
                  update("subject", v);
                  update("skill", null);
                }}
              >
                <SelectTrigger data-testid="select-subject">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.name}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>
                Habilidade (opcional)
              </Label>
              <Select
                value={value.skill || ""}
                onValueChange={(v) => update("skill", v)}
                disabled={!value.grade || !value.subject || filteredSkills.length === 0}
              >
                <SelectTrigger
                  ref={skillTriggerRef}
                  data-testid="select-skill"
                >
                  <SelectValue placeholder={filteredSkills.length === 0 ? "Nenhuma habilidade" : "Selecione"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredSkills.map((s) => (
                    <SelectItem key={s.id} value={s.code}>
                      {s.code} - {s.description.length > 30 ? s.description.substring(0, 30) + "..." : s.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {showFormBody ? (
        <>
          <Tabs defaultValue="edit" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="edit">Editar Questão</TabsTrigger>
              <TabsTrigger value="preview">Visualização</TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className="m-0 space-y-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* LEFT — Form fields */}
                <div className="space-y-5">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <ListChecks className="w-4 h-4 text-primary" />
                        Tipo de questão
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RadioGroup
                        value={value.type}
                        onValueChange={(v) =>
                          onTypeChange(v as "objetiva" | "discursiva")
                        }
                        className="grid sm:grid-cols-2 gap-2"
                      >
                        {QUESTION_TYPE_OPTIONS.map((opt) => (
                          <Label
                            key={opt.value}
                            htmlFor={`type-${opt.value}`}
                            className={`border rounded-md p-3 cursor-pointer flex items-center gap-3 hover-elevate ${value.type === opt.value
                              ? "border-primary bg-primary/5"
                              : "border-border"
                              }`}
                          >
                            <RadioGroupItem
                              value={opt.value}
                              id={`type-${opt.value}`}
                              data-testid={`type-${opt.value}`}
                            />
                            <span className="text-sm font-medium">{opt.label}</span>
                          </Label>
                        ))}
                      </RadioGroup>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Enunciado</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="statement-text">Texto do enunciado</Label>
                        <Textarea
                          id="statement-text"
                          data-testid="input-statement"
                          placeholder="Digite o enunciado da questão..."
                          value={value.statement}
                          onChange={(e) => update("statement", e.target.value)}
                          rows={5}
                          className="resize-y"
                        />
                        {touched && value.statement.trim().length <= 3 && (
                          <p className="text-xs text-destructive">
                            Enunciado é obrigatório.
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 items-center">
                          <GrammarCheckButton
                            text={value.statement}
                            onApply={(corrected) => update("statement", corrected)}
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Imagens do enunciado (opcional)</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const list = value.statementImagesList || [];
                              update("statementImagesList", [...list, { id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(), url: "" }]);
                            }}
                          >
                            <Plus className="w-4 h-4 mr-1" /> Adicionar imagem
                          </Button>
                        </div>

                        {(value.statementImagesList || []).map((img, index) => (
                          <div key={img.id} className="border rounded-md p-3 relative bg-muted/10 space-y-3">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-medium text-muted-foreground">Imagem {index + 1}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => {
                                  const list = [...(value.statementImagesList || [])];
                                  list.splice(index, 1);
                                  update("statementImagesList", list);
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>

                            <ImagePicker
                              value={img.url || null}
                              onChange={(v) => {
                                const list = [...(value.statementImagesList || [])];
                                if (list[index]) {
                                  list[index] = { ...list[index], url: v || "" };
                                  update("statementImagesList", list);
                                }
                              }}
                              label="Selecionar imagem"
                            />

                            <div className="grid grid-cols-2 gap-3 mt-2">
                              <div className="space-y-1">
                                <Label className="text-xs">Largura (px ou %)</Label>
                                <Input
                                  placeholder="Ex: 300px ou 100%"
                                  className="h-8 text-xs"
                                  value={img.width ?? ""}
                                  onChange={(e) => {
                                    const list = [...(value.statementImagesList || [])];
                                    if (list[index]) {
                                      list[index] = { ...list[index], width: Number(e.target.value) || undefined };
                                      update("statementImagesList", list);
                                    }
                                  }}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Altura (px ou %)</Label>
                                <Input
                                  placeholder="Ex: 200px"
                                  className="h-8 text-xs"
                                  value={img.height ?? ""}
                                  onChange={(e) => {
                                    const list = [...(value.statementImagesList || [])];
                                    if (list[index]) {
                                      list[index] = { ...list[index], height: Number(e.target.value) || undefined };
                                      update("statementImagesList", list);
                                    }
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}

                        <p className="text-xs text-muted-foreground">
                          As imagens aparecerão centralizadas em sequência, entre o texto inicial e o texto complementar.
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="statement-continuation">
                          Texto complementar após a imagem (opcional)
                        </Label>
                        <Textarea
                          id="statement-continuation"
                          data-testid="input-statement-continuation"
                          placeholder="Ex.: Com base na imagem acima, responda..."
                          value={value.statementContinuation ?? ""}
                          onChange={(e) =>
                            update("statementContinuation", e.target.value)
                          }
                          rows={3}
                          className="resize-y"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {value.type === "objetiva" ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Alternativas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <RadioGroup
                          value={value.correctAlternative ?? "A"}
                          onValueChange={(v) =>
                            update("correctAlternative", v as "A" | "B" | "C" | "D")
                          }
                          className="space-y-3"
                        >
                          {ALTERNATIVE_KEYS.map((letter) => {
                            const fieldKey = `alternative${letter}` as
                              | "alternativeA"
                              | "alternativeB"
                              | "alternativeC"
                              | "alternativeD";
                            const imageKey = `${fieldKey}Image` as
                              | "alternativeAImage"
                              | "alternativeBImage"
                              | "alternativeCImage"
                              | "alternativeDImage";
                            return (
                              <div
                                key={letter}
                                className="border border-border rounded-md p-3 bg-muted/20"
                              >
                                <div className="flex items-start gap-3">
                                  <RadioGroupItem
                                    value={letter}
                                    id={`alt-${letter}`}
                                    className="mt-3"
                                  />
                                  <Label
                                    htmlFor={`alt-${letter}`}
                                    className="font-bold mt-2 w-6"
                                  >
                                    {letter})
                                  </Label>
                                  <div className="flex-1 space-y-2">
                                    <Input
                                      data-testid={`input-alt-${letter}`}
                                      placeholder={`Alternativa ${letter}`}
                                      value={value[fieldKey]}
                                      onChange={(e) =>
                                        update(fieldKey, e.target.value)
                                      }
                                    />
                                    <ImagePicker
                                      value={value[imageKey]}
                                      onChange={(v) => update(imageKey, v)}
                                      label={`Imagem da alternativa ${letter}`}
                                      compact
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </RadioGroup>
                        <p className="text-xs text-muted-foreground mt-3">
                          Marque o círculo da alternativa correta — esse será o
                          gabarito.
                        </p>
                        {touched && !objetivaValid && (
                          <p className="text-xs text-destructive mt-2">
                            Preencha as quatro alternativas e marque o gabarito.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <AlignLeft className="w-4 h-4 text-primary" />
                          Resposta discursiva
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-1">
                          <Label>Espaço para resposta (número de linhas)</Label>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Input
                              type="number"
                              min={1}
                              max={60}
                              value={value.answerLines ?? ANSWER_LINES_DEFAULT}
                              onChange={(e) => {
                                const n = Number(e.target.value);
                                if (!Number.isNaN(n))
                                  update("answerLines", Math.max(1, Math.min(60, n)));
                              }}
                              className="w-28"
                              data-testid="input-answer-lines"
                            />
                            <div className="flex flex-wrap gap-1">
                              {ANSWER_LINES_PRESETS.map((n) => (
                                <Button
                                  key={n}
                                  type="button"
                                  size="sm"
                                  variant={
                                    value.answerLines === n ? "default" : "outline"
                                  }
                                  onClick={() => update("answerLines", n)}
                                >
                                  {n}
                                </Button>
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Define a altura do espaço reservado para a resposta.
                          </p>
                          {touched && !discursivaValid && (
                            <p className="text-xs text-destructive">
                              Defina ao menos 1 linha de resposta.
                            </p>
                          )}
                        </div>

                        {/* Toggle: exibir linhas ou espaço em branco */}
                        <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
                          <div className="space-y-0.5">
                            <Label htmlFor="toggle-show-lines" className="text-sm font-medium cursor-pointer">
                              Exibir linhas na resposta
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              {value.showAnswerLines
                                ? "Linhas visíveis — ideal para escrita"
                                : "Espaço em branco — ideal para cálculos e desenhos"}
                            </p>
                          </div>
                          <Switch
                            id="toggle-show-lines"
                            checked={value.showAnswerLines}
                            onCheckedChange={(checked) => update("showAnswerLines", checked)}
                          />
                        </div>

                        <div className="pt-4 border-t mt-4 space-y-4">
                          <div>
                            <Label className="text-base font-semibold">Critérios de Correção (Gabarito)</Label>
                            <p className="text-xs text-muted-foreground">Descreva os critérios esperados para cada nível de resposta.</p>
                          </div>

                          <div className="space-y-3">
                            <div className="space-y-1">
                              <Label className="text-xs font-semibold text-rose-600">Nível 1 (Insuficiente)</Label>
                              <Textarea
                                className="h-16 text-sm resize-y"
                                placeholder="Ex.: O aluno não demonstrou compreensão do tema..."
                                value={value.discursiveRubric?.level1 || ""}
                                onChange={(e) => update("discursiveRubric", { ...value.discursiveRubric!, level1: e.target.value })}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs font-semibold text-amber-600">Nível 2 (Parcial)</Label>
                              <Textarea
                                className="h-16 text-sm resize-y"
                                placeholder="Ex.: O aluno abordou o tema, mas faltaram elementos..."
                                value={value.discursiveRubric?.level2 || ""}
                                onChange={(e) => update("discursiveRubric", { ...value.discursiveRubric!, level2: e.target.value })}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs font-semibold text-blue-600">Nível 3 (Adequada)</Label>
                              <Textarea
                                className="h-16 text-sm resize-y"
                                placeholder="Ex.: O aluno compreendeu e respondeu de forma satisfatória..."
                                value={value.discursiveRubric?.level3 || ""}
                                onChange={(e) => update("discursiveRubric", { ...value.discursiveRubric!, level3: e.target.value })}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs font-semibold text-emerald-600">Nível 4 (Completa)</Label>
                              <Textarea
                                className="h-16 text-sm resize-y"
                                placeholder="Ex.: Resposta excelente, cobrindo todos os pontos exigidos..."
                                value={value.discursiveRubric?.level4 || ""}
                                onChange={(e) => update("discursiveRubric", { ...value.discursiveRubric!, level4: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <BookText className="w-4 h-4 text-primary" />
                        Textos Opcionais (Textos e Imagens)
                      </CardTitle>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const list = value.optionalBlocks || [];
                          update("optionalBlocks", [...list, { id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(), type: "text", content: "" }]);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-1" /> Adicionar Bloco
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {(value.optionalBlocks || []).length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">Nenhum texto opcional adicionado.</p>
                      ) : (
                        (value.optionalBlocks || []).map((block, index) => {
                          const isOldImage = block.type === "image";
                          const textContent = isOldImage ? "" : block.content;
                          const imageContent = isOldImage ? block.content : block.imageUrl;

                          return (
                            <div key={block.id} className="border rounded-md p-4 bg-card shadow-sm space-y-4 relative">
                              <div className="flex justify-between items-center pb-2 border-b">
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-semibold text-primary">Texto Opcional {index + 1}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    disabled={index === 0}
                                    onClick={() => {
                                      const list = [...(value.optionalBlocks || [])];
                                      [list[index - 1], list[index]] = [list[index], list[index - 1]];
                                      update("optionalBlocks", list);
                                    }}
                                  >
                                    <ArrowUp className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    disabled={index === (value.optionalBlocks?.length || 0) - 1}
                                    onClick={() => {
                                      const list = [...(value.optionalBlocks || [])];
                                      [list[index + 1], list[index]] = [list[index], list[index + 1]];
                                      update("optionalBlocks", list);
                                    }}
                                  >
                                    <ArrowDown className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                    onClick={() => {
                                      const list = [...(value.optionalBlocks || [])];
                                      list.splice(index, 1);
                                      update("optionalBlocks", list);
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <div className="space-y-1">
                                  <Label className="text-xs font-medium">Enunciado do texto (opcional)</Label>
                                  <Input
                                    className="h-8 text-sm"
                                    placeholder="Ex.: Texto 1 / Leia o texto abaixo / Analise a imagem"
                                    value={block.instruction ?? ""}
                                    onChange={(e) => {
                                      const list = [...(value.optionalBlocks || [])];
                                      if (list[index]) {
                                        list[index] = { ...list[index], instruction: e.target.value };
                                        update("optionalBlocks", list);
                                      }
                                    }}
                                  />
                                  <p className="text-[11px] text-muted-foreground">Aparecerá em negrito acima do conteúdo do texto.</p>
                                </div>
                                <div className="grid sm:grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <Label className="text-xs">Título do texto (opcional)</Label>
                                    <Input
                                      className="h-8 text-sm"
                                      placeholder="Ex.: A Raposa e as Uvas"
                                      value={block.title ?? ""}
                                      onChange={(e) => {
                                        const list = [...(value.optionalBlocks || [])];
                                        if (list[index]) {
                                          list[index] = { ...list[index], title: e.target.value };
                                          update("optionalBlocks", list);
                                        }
                                      }}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Autor (opcional)</Label>
                                    <Input
                                      className="h-8 text-sm"
                                      placeholder="Ex.: Machado de Assis"
                                      value={block.author ?? ""}
                                      onChange={(e) => {
                                        const list = [...(value.optionalBlocks || [])];
                                        if (list[index]) {
                                          list[index] = { ...list[index], author: e.target.value };
                                          update("optionalBlocks", list);
                                        }
                                      }}
                                    />
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <Label className="text-xs">Conteúdo do texto</Label>
                                  <Textarea
                                    placeholder="Cole aqui o texto..."
                                    value={textContent}
                                    onChange={(e) => {
                                      const list = [...(value.optionalBlocks || [])];
                                      if (list[index]) {
                                        list[index] = { ...list[index], content: e.target.value };
                                        if (list[index].type === "image") {
                                          list[index].type = "text";
                                        }
                                        update("optionalBlocks", list);
                                      }
                                    }}
                                    rows={4}
                                    className="resize-y text-sm"
                                  />
                                </div>

                                <div className="space-y-3 pt-2">
                                  <ImagePicker
                                    value={imageContent || null}
                                    onChange={(v) => {
                                      const list = [...(value.optionalBlocks || [])];
                                      if (list[index]) {
                                        list[index] = { ...list[index], imageUrl: v || undefined };
                                        if (list[index].type === "image") {
                                          list[index].type = "text";
                                          list[index].content = "";
                                        }
                                        update("optionalBlocks", list);
                                      }
                                    }}
                                    label="Adicionar Imagem (opcional)"
                                  />
                                </div>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </CardContent>
                  </Card>

                </div>

                {/* RIGHT — Live preview */}
                <div className="lg:sticky lg:top-4">
                  <Card className="border-primary/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Eye className="w-4 h-4 text-primary" />
                        Pré-visualização
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Veja como a questão aparecerá na prova impressa.
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border border-dashed border-border bg-white dark:bg-zinc-50 text-zinc-900 p-4 max-h-[70vh] overflow-y-auto">
                        <QuestionPreview
                          data={{
                            number: 1,
                            type: value.type,
                            statement: value.statement,
                            statementImage: value.statementImage,
                            statementContinuation: value.statementContinuation,
                            alternativeA: value.alternativeA,
                            alternativeAImage: value.alternativeAImage,
                            alternativeB: value.alternativeB,
                            alternativeBImage: value.alternativeBImage,
                            alternativeC: value.alternativeC,
                            alternativeCImage: value.alternativeCImage,
                            alternativeD: value.alternativeD,
                            alternativeDImage: value.alternativeDImage,
                            correctAlternative: value.correctAlternative ?? undefined,
                            answerLines: value.answerLines,
                            showAnswerLines: value.showAnswerLines,
                            supportText: value.supportText,
                            supportTitle: value.supportTitle,
                            supportAuthor: value.supportAuthor,
                            optionalBlocks: value.optionalBlocks,
                            statementImagesList: value.statementImagesList,
                            discursiveRubric: value.discursiveRubric,
                            skill: value.skill,
                          }}
                          showAnswer
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="mt-0">
              <div className="flex flex-col items-center bg-muted/10 rounded-lg border border-dashed relative overflow-hidden">
                <div className="w-full max-w-4xl flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 border-b bg-white">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Eye className="w-5 h-5 text-primary" /> Visualização Real (A4)
                  </h3>
                  <div className="flex gap-4 items-center">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Fonte:</Label>
                      <Select value={previewFont} onValueChange={(v: any) => setPreviewFont(v)}>
                        <SelectTrigger className="w-[160px] h-9 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Arial">Arial</SelectItem>
                          <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                          <SelectItem value="Calibri">Calibri</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Tamanho:</Label>
                      <Select value={previewFontSize.toString()} onValueChange={(v: any) => setPreviewFontSize(Number(v) as 10 | 12 | 14)}>
                        <SelectTrigger className="w-[80px] h-9 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="12">12</SelectItem>
                          <SelectItem value="14">14</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="w-full flex justify-center bg-gray-100">
                  <AssessmentViewer
                    questions={[
                      {
                        ...value,
                        id: "preview",
                        createdAt: Date.now(),
                      } as unknown as Question
                    ]}
                    formatting={{
                      margin: "Média",
                      margins: { top: 2, right: 2, bottom: 2, left: 2 },
                      font: previewFont,
                      fontSize: previewFontSize,
                      spacing: "1.5"
                    }}
                    previewMode={true}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex flex-col items-end gap-1">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            <Button
              type="submit"
              disabled={submitting || !valid}
              data-testid="button-submit"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : submitIcon ? (
                submitIcon
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {submitLabel ?? (initial ? "Salvar alterações" : "Salvar questão")}
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center py-12 bg-accent/5 border border-dashed rounded-lg">
          <BookText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-medium text-lg text-foreground/80">Quase lá!</p>
          <p className="text-muted-foreground">Preencha a classificação BNCC acima para liberar o formulário da questão.</p>
        </div>
      )}
    </form>
  );
}
