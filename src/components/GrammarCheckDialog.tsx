import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SparklesIcon, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const useGrammarCheck = () => ({
  isPending: false,
  mutateAsync: async ({ data }: any) => {
    return {
      suggestions: []
    };
  }
});

interface Suggestion {
  original: string;
  suggestion: string;
  explanation: string;
}

interface Props {
  text: string;
  onApply: (newText: string) => void;
  disabled?: boolean;
}

export function GrammarCheckButton({ text, onApply, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [applied, setApplied] = useState<Set<number>>(new Set());
  const mutation = useGrammarCheck();

  const run = async () => {
    if (!text.trim()) {
      toast.warning("Digite um texto antes de pedir a sugestão.");
      return;
    }

    try {
      const res = await mutation.mutateAsync({ data: { text } });
      setSuggestions(res.suggestions);
      setApplied(new Set());
      setOpen(true);

      if (res.suggestions.length === 0) {
        toast.success("Nenhuma correção sugerida — o texto está bom!");
      }
    } catch {
      toast.error("Não foi possível obter sugestões agora.");
    }
  };

  const applyOne = (index: number) => {
    const s = suggestions[index];
    if (!s) return;

    if (!text.includes(s.original)) {
      toast.warning("Trecho não foi mais encontrado no texto atual.");
      return;
    }

    const newText = text.replace(s.original, s.suggestion);
    onApply(newText);

    const next = new Set(applied);
    next.add(index);
    setApplied(next);

    toast.success("Sugestão aplicada.");
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={run}
        disabled={disabled || mutation.isPending}
      >
        {mutation.isPending ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <SparklesIcon className="w-4 h-4 mr-2" />
        )}
        Sugerir correção
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sugestões de correção</DialogTitle>
            <DialogDescription>
              A IA apenas sugere — você decide o que aplicar. Seu texto não foi
              alterado.
            </DialogDescription>
          </DialogHeader>

          {suggestions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nenhuma correção sugerida.
            </p>
          ) : (
            <div className="space-y-3">
              {suggestions.map((s, i) => (
                <div
                  key={i}
                  className="border border-border rounded-md p-3 bg-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2 text-sm">
                      <div>
                        <span className="text-xs uppercase tracking-wide text-muted-foreground">
                          Original
                        </span>
                        <p className="bg-destructive/10 text-destructive-foreground rounded px-2 py-1">
                          <span className="text-destructive">{s.original}</span>
                        </p>
                      </div>

                      <div>
                        <span className="text-xs uppercase tracking-wide text-muted-foreground">
                          Sugestão
                        </span>
                        <p className="bg-emerald-500/10 rounded px-2 py-1 text-emerald-700 dark:text-emerald-400">
                          {s.suggestion}
                        </p>
                      </div>

                      <p className="text-xs text-muted-foreground italic">
                        {s.explanation}
                      </p>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant={applied.has(i) ? "secondary" : "default"}
                      onClick={() => applyOne(i)}
                      disabled={applied.has(i)}
                    >
                      {applied.has(i) ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Aplicada
                        </>
                      ) : (
                        "Aplicar"
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}