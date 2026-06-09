import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuestions, Question } from "@/hooks/useQuestions";
import { useAssessments, Assessment, AssessmentFormatting } from "@/hooks/useAssessments";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

import { toast } from "sonner";
import { generateExamPDF } from "@/lib/pdf-generator";
import { AssessmentViewer } from "@/components/AssessmentViewer";
import { AnswerKeyViewer } from "@/components/AnswerKeyViewer";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { GripVertical, Settings2, Trash2, FileDown, Library, Loader2, Plus, Edit2, CheckCircle2, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePedagogical } from "@/hooks/usePedagogical";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableItem({ q, onRemove, disabled }: { q: Question; onRemove: (id: string) => void; disabled?: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: q.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`flex items-center gap-3 bg-card border ${isDragging ? 'border-primary shadow-md' : 'border-border shadow-sm hover:border-primary/50'} p-3 rounded-lg mb-3 relative transition-colors ${disabled ? 'opacity-80' : ''}`}>
      <button {...attributes} {...listeners} disabled={disabled} className={`touch-none p-1 -ml-1 text-muted-foreground hover:text-primary rounded ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-grab active:cursor-grabbing'}`}>
        <GripVertical className="w-5 h-5" />
      </button>
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <p className="text-sm font-medium line-clamp-2 leading-snug" title={q.statement}>{q.statement}</p>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="secondary" className="text-[10px] py-0 px-1.5">{q.subject}</Badge>
          <span className="text-[10px] text-muted-foreground uppercase font-semibold">{q.type === 'objetiva' ? 'Objetiva' : 'Discursiva'}</span>
        </div>
      </div>
      {!disabled && (
        <Button variant="ghost" size="icon" className="text-destructive h-8 w-8 shrink-0 self-center hover:bg-destructive/10" onClick={() => onRemove(q.id)}>
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

export default function AssessmentsPage() {
  const { isAdmin } = useAuth();
  const { questions } = useQuestions();
  const { assessments, addAssessment, updateAssessment, deleteAssessment } = useAssessments();
  const { stages, subjects } = usePedagogical();

  const [view, setView] = useState<'list' | 'editor'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverBase64, setCoverBase64] = useState<string | null>(null);

  const [formatting, setFormatting] = useState<AssessmentFormatting>({
    margin: "Média",
    margins: { top: 2, right: 2, bottom: 2, left: 2 },
    font: "Arial",
    fontSize: 12,
    spacing: "1.5"
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [printingAssessmentId, setPrintingAssessmentId] = useState<string | null>(null);
  const [generatingType, setGeneratingType] = useState<"exam" | "answerKey" | null>(null);


  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const resetForm = () => {
    setName("");
    setGrade("");
    setSelectedSubjects([]);
    setDescription("");
    setSelectedIds([]);
    setCoverFile(null);
    setCoverBase64(null);
    setFormatting({ margin: "Média", margins: { top: 2, right: 2, bottom: 2, left: 2 }, font: "Arial", fontSize: 12, spacing: "1.5" });
    setEditingId(null);
  };

  const handleCreateNew = () => {
    resetForm();
    setView('editor');
  };

  const handleEdit = (a: Assessment) => {
    setEditingId(a.id);
    setName(a.name);
    setGrade(a.grade);
    setSelectedSubjects(a.subjects || []);
    setDescription(a.description || "");
    setFormatting(a.formatting || { margin: "Média", margins: { top: 2, right: 2, bottom: 2, left: 2 }, font: "Arial", fontSize: 12, spacing: "1.5" });
    setSelectedIds(a.questionIds);
    setCoverBase64(a.coverImage);
    setCoverFile(null);
    setView('editor');
  };

  const toggleSubject = (subjName: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subjName) ? prev.filter(x => x !== subjName) : [...prev, subjName]
    );
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onload = () => setCoverBase64(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSelectedIds((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const saveAssessment = (status: "draft" | "published") => {
    if (!name.trim()) return toast.error("Informe um nome para a avaliação.");
    if (!grade) return toast.error("Selecione a etapa.");
    if (selectedSubjects.length === 0) return toast.error("Selecione ao menos uma disciplina.");
    if (selectedIds.length === 0) return toast.error("Adicione ao menos uma questão.");

    const data = {
      name,
      grade,
      subjects: selectedSubjects,
      description,
      formatting,
      status,
      questionIds: selectedIds,
      coverImage: coverBase64,
    };

    if (editingId) {
      updateAssessment(editingId, data);
      toast.success(status === 'published' ? "Avaliação publicada!" : "Rascunho salvo!");
    } else {
      addAssessment(data);
      toast.success(status === 'published' ? "Avaliação publicada!" : "Avaliação criada como rascunho!");
    }
    setView('list');
  };

  const [printingData, setPrintingData] = useState<{ assessment: Assessment, type: "exam" | "answerKey" } | null>(null);

  const handleGeneratePDF = async (a: Assessment, type: "exam" | "answerKey") => {
    setPrintingAssessmentId(a.id);
    setGeneratingType(type);
    setIsGenerating(true);
    setPrintingData({ assessment: a, type });
    toast.info(`Gerando PDF de alta fidelidade do ${type === 'exam' ? 'Prova' : 'Gabarito'}...`);
  };

  const handleReadyToPrint = async () => {
    try {
      // Pequeno atraso para garantir que a renderização do React DOM foi pintada na tela invisível
      await new Promise(resolve => setTimeout(resolve, 500));

      const pages = document.querySelectorAll('.print-page');
      if (!pages || pages.length === 0) {
        toast.error("Erro: Nenhuma página encontrada para gerar o PDF.");
        return;
      }

      const doc = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfHeight = doc.internal.pageSize.getHeight();

      let isFirstDocPage = true;
      const coverBase64 = printingData?.assessment.coverImage;

      // Se for imagem e for a prova (não gabarito), insere logo na primeira página do jsPDF
      if (generatingType === 'exam' && coverBase64) {
        try {
          doc.addImage(coverBase64, 'JPEG', 0, 0, pdfWidth, pdfHeight);
          isFirstDocPage = false;
        } catch (e) {
          console.error("Erro ao adicionar imagem de capa no jsPDF", e);
        }
      }

      for (let i = 0; i < pages.length; i++) {
        const pageEl = pages[i] as HTMLElement;
        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/jpeg', 1.0);

        if (!isFirstDocPage) {
          doc.addPage();
        }

        doc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        isFirstDocPage = false;
      }

      const suffix = generatingType === 'exam' ? 'Prova' : 'Gabarito';
      const name = printingData?.assessment.name.replace(/\\s+/g, '_') || 'Export';
      doc.save(`Avaliacao_${name}_${suffix}.pdf`);

      toast.success("PDF gerado com sucesso!");
    } catch (err) {
      console.error("Erro ao gerar PDF com html2canvas", err);
      toast.error("Erro inesperado ao capturar as páginas.");
    } finally {
      setPrintingData(null);
      setIsGenerating(false);
      setPrintingAssessmentId(null);
      setGeneratingType(null);
    }
  };

  const selectedQuestions = selectedIds.map(id => questions.find(q => q.id === id)!).filter(Boolean);
  const filteredBankQuestions = questions.filter(q =>
    (selectedSubjects.length === 0 || selectedSubjects.includes(q.subject)) &&
    (!grade || q.grade === grade)
  );



  const isPublished = editingId ? assessments.find(a => a.id === editingId)?.status === 'published' : false;

  const visibleAssessments = isAdmin ? assessments : assessments.filter(a => a.status === 'published');

  return (
    <>
      <div className="space-y-6 pb-20 relative">
        {view === 'list' && (
          <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Avaliações</h1>
                <p className="text-muted-foreground mt-1">
                  Gerencie e monte suas provas completas a partir do banco de questões.
                </p>
              </div>
              {isAdmin && (
                <Button onClick={handleCreateNew}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Avaliação
                </Button>
              )}
            </div>

            {visibleAssessments.length === 0 ? (
              <Card className="border-dashed bg-accent/5">
                <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                  <FileDown className="w-12 h-12 text-muted-foreground/50 mb-4" />
                  <p className="text-lg font-medium">Nenhuma avaliação {isAdmin ? 'encontrada' : 'disponível'}</p>
                  <p className="text-muted-foreground mb-4">
                    {isAdmin ? 'Crie sua primeira prova para exportar em PDF.' : 'Nenhuma avaliação foi publicada pela administração ainda.'}
                  </p>
                  {isAdmin && (
                    <Button onClick={handleCreateNew} variant="outline">Começar a Montar</Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleAssessments.map(a => (
                  <Card key={a.id} className="flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-lg line-clamp-2" title={a.name}>{a.name}</CardTitle>
                        {a.status === 'published' ? (
                          <Badge className="bg-emerald-500 hover:bg-emerald-600 shrink-0">Publicada</Badge>
                        ) : (
                          <Badge variant="secondary" className="shrink-0">Rascunho</Badge>
                        )}
                      </div>
                      <CardDescription className="line-clamp-1">{a.grade} • {(a.subjects || []).join(', ')}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-end gap-3">
                      <p className="text-sm text-muted-foreground">{a.questionIds.length} questões selecionadas</p>
                      <div className="flex items-center gap-2 mt-2">
                        {isAdmin && (
                          <Button variant="outline" size="sm" className="flex-1 px-2" onClick={() => handleEdit(a)}>
                            <Edit2 className="w-4 h-4 mr-1.5" />
                            {a.status === 'published' ? 'Ver' : 'Editar'}
                          </Button>
                        )}
                        <Button
                          variant="default"
                          size="sm"
                          className="px-2"
                          title="Baixar Prova"
                          disabled={isGenerating}
                          onClick={() => handleGeneratePDF(a, 'exam')}
                        >
                          {isGenerating && printingAssessmentId === a.id && generatingType === 'exam' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          className="px-2 bg-blue-600 hover:bg-blue-700"
                          title="Baixar Gabarito"
                          disabled={isGenerating}
                          onClick={() => handleGeneratePDF(a, 'answerKey')}
                        >
                          {isGenerating && printingAssessmentId === a.id && generatingType === 'answerKey' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                        </Button>
                        {isAdmin && (
                          <Button variant="ghost" size="sm" className="text-destructive px-2" onClick={() => {
                            if (confirm('Tem certeza que deseja excluir esta avaliação?')) deleteAssessment(a.id);
                          }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {view === 'editor' && (
          <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" onClick={() => setView('list')}>Voltar</Button>
                  <h1 className="text-2xl font-bold tracking-tight">{editingId ? (isPublished ? 'Visualizar Avaliação' : 'Editar Avaliação') : 'Nova Avaliação'}</h1>
                </div>
              </div>
              <div className="flex gap-2">
                {!isPublished && (
                  <Button variant="secondary" onClick={() => saveAssessment('draft')}>
                    Salvar Rascunho
                  </Button>
                )}
                {!isPublished && (
                  <Button onClick={() => saveAssessment('published')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Publicar
                  </Button>
                )}
              </div>
            </div>

            <Tabs defaultValue="config" className="w-full mt-4">
              <TabsList className="mb-4">
                <TabsTrigger value="config">Configuração e Questões</TabsTrigger>
                <TabsTrigger value="preview">Pré-visualização A4</TabsTrigger>
              </TabsList>

              <TabsContent value="config" className="space-y-6">
                <div className="grid lg:grid-cols-2 gap-6 items-start">
                  <Card className="bg-accent/5">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Dados Principais</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-1">
                        <Label>Nome da Avaliação</Label>
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Prova Mensal" disabled={isPublished} />
                      </div>
                      <div className="space-y-1">
                        <Label>Etapa</Label>
                        <Select value={grade} onValueChange={setGrade} disabled={isPublished}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>{stages.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Disciplinas (Multi-seleção)</Label>
                        <div className="h-32 overflow-y-auto border rounded-md p-3 bg-card">
                          {subjects.map(s => (
                            <div key={s.id} className="flex items-center space-x-2 mb-2">
                              <Checkbox
                                id={`subj-${s.id}`}
                                checked={selectedSubjects.includes(s.name)}
                                onCheckedChange={() => toggleSubject(s.name)}
                                disabled={isPublished}
                              />
                              <label htmlFor={`subj-${s.id}`} className={`text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${isPublished ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}>
                                {s.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label>Descrição da Avaliação (Opcional)</Label>
                        <Textarea
                          value={description}
                          onChange={e => setDescription(e.target.value)}
                          placeholder="Ex: Avaliação referente aos conteúdos trabalhados no 1º semestre..."
                          disabled={isPublished}
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-accent/5">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Configurações da Prova</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-1.5">
                        <Label>Enviar Nova Capa (Opcional)</Label>
                        <Input type="file" accept="image/*" onChange={handleCoverUpload} disabled={isPublished} />
                        {coverBase64 && (
                          <div className="mt-2 relative inline-block">
                            <img src={coverBase64} alt="Capa" className="h-20 object-contain border rounded-md" />
                            {!isPublished && (
                              <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => { setCoverBase64(null); setCoverFile(null); }}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3 col-span-2 border rounded-md p-3">
                          <Label className="text-sm font-semibold">Margens (cm) - Mín: 1cm</Label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {['top', 'bottom', 'left', 'right'].map((side) => {
                              const labels: any = { top: "Superior", bottom: "Inferior", left: "Esquerda", right: "Direita" };
                              return (
                                <div key={side} className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">{labels[side]}</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    step="0.1"
                                    value={formatting.margins ? (formatting.margins as any)[side] : 2}
                                    onChange={(e) => {
                                      const val = Math.max(1, parseFloat(e.target.value) || 1);
                                      setFormatting({
                                        ...formatting,
                                        margins: { ...(formatting.margins || { top: 2, bottom: 2, left: 2, right: 2 }), [side]: val }
                                      });
                                    }}
                                    disabled={isPublished}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label>Fonte</Label>
                          <Select value={formatting.font} onValueChange={(v: any) => setFormatting({ ...formatting, font: v })} disabled={isPublished}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Arial">Arial</SelectItem>
                              <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                              <SelectItem value="Calibri">Calibri</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label>Tamanho da Fonte</Label>
                          <Select value={formatting.fontSize.toString()} onValueChange={(v: any) => setFormatting({ ...formatting, fontSize: Number(v) as 10 | 12 | 14 })} disabled={isPublished}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="12">12</SelectItem>
                              <SelectItem value="14">14</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label>Espaço Linhas</Label>
                          <Input
                            type="number"
                            min="1"
                            step="0.1"
                            value={formatting.lineHeight ?? 1.3}
                            onChange={(e) => setFormatting({ ...formatting, lineHeight: Math.max(1, parseFloat(e.target.value) || 1.3) })}
                            disabled={isPublished}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Espaço Questões (px)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={formatting.questionSpacing ?? 16}
                            onChange={(e) => setFormatting({ ...formatting, questionSpacing: Math.max(0, parseInt(e.target.value) || 16) })}
                            disabled={isPublished}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Espaço Alternativas (px)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={formatting.alternativeSpacing ?? 6}
                            onChange={(e) => setFormatting({ ...formatting, alternativeSpacing: Math.max(0, parseInt(e.target.value) || 6) })}
                            disabled={isPublished}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid lg:grid-cols-3 gap-6 items-start">
                  {/* Lado Esquerdo: Banco (Oculto se Publicado) */}
                  {!isPublished && (
                    <div className="lg:col-span-2 space-y-4 w-full">
                      <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Library className="w-5 h-5 text-primary" /> Banco Filtrado
                      </h2>
                      <div className="max-h-[800px] overflow-y-auto space-y-3 pr-2">
                        {filteredBankQuestions.length === 0 ? (
                          <p className="text-muted-foreground text-sm bg-accent/5 p-4 rounded border">
                            Nenhuma questão encontrada com os filtros atuais.
                          </p>
                        ) : (
                          filteredBankQuestions.map((q) => {
                            const isSelected = selectedIds.includes(q.id);
                            return (
                              <div
                                key={q.id}
                                onClick={() => toggleSelection(q.id)}
                                className={`p-4 border rounded-lg cursor-pointer transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 bg-card'}`}
                              >
                                <div className="flex justify-between items-start gap-2 mb-2">
                                  <Badge variant={isSelected ? "default" : "secondary"} className="text-xs">{q.subject}</Badge>
                                  {isSelected && <Badge className="bg-primary">Selecionada</Badge>}
                                </div>
                                <p className="text-sm line-clamp-3 text-foreground">{q.statement}</p>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {/* Lado Direito: Selecionadas */}
                  <div className={`w-full ${isPublished ? 'lg:col-span-3' : 'lg:col-span-1'} space-y-6`}>
                    <Card className="flex flex-col h-full min-h-[600px] lg:sticky lg:top-24">
                      <CardHeader className="pb-3 shrink-0">
                        <CardTitle className="text-lg flex items-center justify-between">
                          <span>Questões Selecionadas ({selectedIds.length})</span>
                        </CardTitle>
                        <CardDescription>
                          {isPublished ? "Ordem final da prova" : "Arraste para reordenar."}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1 overflow-y-auto max-h-[700px] pr-1">
                        {selectedQuestions.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-md border border-dashed">
                            Nenhuma questão selecionada. Clique nas questões ao lado.
                          </div>
                        ) : (
                          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={isPublished ? undefined : handleDragEnd}>
                            <SortableContext items={selectedIds} strategy={verticalListSortingStrategy}>
                              {selectedQuestions.map(q => (
                                <SortableItem key={q.id} q={q} onRemove={toggleSelection} disabled={isPublished} />
                              ))}
                            </SortableContext>
                          </DndContext>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="mt-6 flex flex-col items-center min-h-[800px] bg-muted/30 p-8 rounded-lg border border-dashed relative overflow-hidden">
                <div className="w-full max-w-4xl flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" /> Visualização Real (A4)
                  </h3>
                  <div className="text-sm text-muted-foreground bg-background px-3 py-1.5 rounded-full border shadow-sm shrink-0">
                    Margens: Sup {formatting.margins?.top}cm | Inf {formatting.margins?.bottom}cm | Esq {formatting.margins?.left}cm | Dir {formatting.margins?.right}cm
                  </div>
                </div>

                {selectedQuestions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[500px] w-full text-muted-foreground">
                    <FileDown className="w-16 h-16 opacity-20 mb-4" />
                    <p>Adicione questões na aba "Configuração" para ver a prova.</p>
                  </div>
                ) : (
                  <div className="w-full flex justify-center pb-20 origin-top" style={{ transform: 'scale(0.85)' }}>
                    <AssessmentViewer
                      questions={selectedQuestions}
                      formatting={formatting}
                      previewMode={true}
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}


      </div>

      {printingData && (
        <div className="print-only" style={{ position: 'absolute', top: 0, left: 0, opacity: 0, zIndex: -1000, pointerEvents: 'none' }}>
          {printingData.type === 'exam' ? (
            <AssessmentViewer
              questions={printingData.assessment.questionIds.map(id => questions.find(q => q.id === id)!).filter(Boolean)}
              formatting={printingData.assessment.formatting}
              previewMode={false}
              onReadyToPrint={handleReadyToPrint}
            />
          ) : (
            <AnswerKeyViewer
              questions={printingData.assessment.questionIds.map(id => questions.find(q => q.id === id)!).filter(Boolean)}
              formatting={printingData.assessment.formatting}
              previewMode={false}
              onReadyToPrint={handleReadyToPrint}
            />
          )}
        </div>
      )}
    </>
  );
}
