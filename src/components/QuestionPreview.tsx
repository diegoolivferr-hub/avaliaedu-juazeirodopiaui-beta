import { cn } from "@/lib/utils";
import { MathText } from "@/components/MathText";
import { OptionalBlock, StatementImage, DiscursiveRubric } from "./QuestionForm";

export interface QuestionPreviewData {
  number?: number;
  type?: "objetiva" | "discursiva";
  statement: string;
  statementImage: string | null;
  statementContinuation?: string | null;
  alternativeA: string;
  alternativeAImage: string | null;
  alternativeB: string;
  alternativeBImage: string | null;
  alternativeC: string;
  alternativeCImage: string | null;
  alternativeD: string;
  alternativeDImage: string | null;
  correctAlternative?: "A" | "B" | "C" | "D";
  answerLines?: number | null;
  showAnswerLines?: boolean;
  supportText?: string | null;
  supportTitle?: string | null;
  supportAuthor?: string | null;
  optionalBlocks?: OptionalBlock[];
  statementImagesList?: StatementImage[];
  discursiveRubric?: DiscursiveRubric;
  skill?: string | null;
}

interface Props {
  data: QuestionPreviewData;
  showAnswer?: boolean;
  compact?: boolean;
  className?: string;
}

const LETTERS: Array<"A" | "B" | "C" | "D"> = ["A", "B", "C", "D"];

export function QuestionPreview({
  data,
  showAnswer = false,
  compact = false,
  className,
}: Props) {
  const type = data.type ?? "objetiva";
  const hasContent =
    data.statement.trim() ||
    data.statementImage ||
    data.statementContinuation?.trim() ||
    data.supportText?.trim() ||
    data.alternativeA.trim() ||
    data.alternativeB.trim() ||
    data.alternativeC.trim() ||
    data.alternativeD.trim();

  if (!hasContent) {
    return (
      <div
        className={cn(
          "text-sm text-muted-foreground italic text-center py-8",
          className,
        )}
      >
        Comece a digitar para ver a pré-visualização aqui.
      </div>
    );
  }

  const answerLines =
    type === "discursiva" ? Math.max(1, data.answerLines ?? 5) : 0;

  return (
    <article
      className={cn(
        "question-preview text-foreground bg-background",
        compact ? "text-sm" : "text-base",
        className,
      )}
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
    >
      {data.optionalBlocks && data.optionalBlocks.length > 0 ? (
        data.optionalBlocks.map(block => {
          const isOldImage = block.type === 'image';
          const textContent = isOldImage ? '' : block.content;
          const imageContent = isOldImage ? block.content : block.imageUrl;

          if (!textContent?.trim() && !imageContent && !block.title?.trim() && !block.instruction?.trim()) return null;

          return (
            <div
              key={block.id}
              style={{
                background: "#f3f4f6",
                borderRadius: "8px",
                padding: "12px",
                marginBottom: "12px",
              }}
            >
              {block.instruction?.trim() && (
                <MathText
                  text={block.instruction}
                  block
                  style={{ fontWeight: "bold", marginBottom: "6px" }}
                />
              )}
              {block.title?.trim() && (
                <p style={{ fontWeight: "bold", textAlign: "center", marginBottom: "4px" }}>
                  <MathText text={block.title} />
                </p>
              )}
              {textContent?.trim() && (
                <MathText
                  text={textContent}
                  block
                  className="leading-relaxed whitespace-pre-wrap break-words"
                  style={{ textAlign: "justify" }}
                />
              )}
              {imageContent && (
                <div className="flex justify-center mt-2 mb-2">
                  <img
                    src={imageContent}
                    alt=""
                    style={{ maxWidth: "100%", height: "auto" }}
                  />
                </div>
              )}
              {block.author?.trim() && (
                <p className="text-right text-[0.85em] mt-1.5 italic">
                  — <MathText text={block.author} />
                </p>
              )}
            </div>
          );
        })
      ) : (data.supportText?.trim() ||
        data.supportTitle?.trim() ||
        data.supportAuthor?.trim()) ? (
        <div
          style={{
            background: "#f3f4f6",
            borderRadius: "8px",
            padding: "12px",
            marginBottom: "12px",
          }}
        >
          {data.supportTitle?.trim() && (
            <p style={{ fontWeight: "bold", textAlign: "center", marginBottom: "4px" }}>
              <MathText text={data.supportTitle} />
            </p>
          )}
          {data.supportText?.trim() && (
            <MathText
              text={data.supportText}
              block
              className="leading-relaxed whitespace-pre-wrap break-words"
              style={{ textAlign: "justify" }}
            />
          )}
          {data.supportAuthor?.trim() && (
            <p className="text-right text-[0.85em] mt-1.5 italic">
              — <MathText text={data.supportAuthor} />
            </p>
          )}
        </div>
      ) : null}

      <div className="space-y-2">
        <p
          className="leading-relaxed whitespace-pre-wrap break-words"
          style={{ textAlign: "justify" }}
        >
          {data.number !== undefined && (
            <span className="font-bold mr-1">
              {data.number}{data.skill ? ` - (${data.skill}) ` : ". "}
            </span>
          )}
          <MathText text={data.statement || ""} />
        </p>

        {data.statementImagesList && data.statementImagesList.length > 0 ? (
          data.statementImagesList.map(img => img.url ? (
            <div key={img.id} className="flex justify-center my-2">
              <img
                src={img.url}
                alt=""
                style={{ width: img.width ? (typeof img.width === 'number' ? `${img.width}px` : img.width) : undefined, height: img.height ? (typeof img.height === 'number' ? `${img.height}px` : img.height) : undefined }}
                className="max-w-full max-h-[260px] h-auto object-contain rounded border border-border"
              />
            </div>
          ) : null)
        ) : data.statementImage ? (
          <div className="flex justify-center my-2">
            <img
              src={data.statementImage}
              alt=""
              className="max-w-full max-h-[260px] h-auto object-contain rounded border border-border"
            />
          </div>
        ) : null}

        {data.statementContinuation?.trim() && (
          <MathText
            text={data.statementContinuation}
            block
            className="leading-relaxed whitespace-pre-wrap break-words"
            style={{ textAlign: "justify" }}
          />
        )}
      </div>

      {type === "objetiva" ? (
        <ol className="mt-3 space-y-1.5">
          {LETTERS.map((letter) => {
            const text = data[`alternative${letter}` as "alternativeA"];
            const image =
              data[`alternative${letter}Image` as "alternativeAImage"];
            const isCorrect =
              showAnswer && data.correctAlternative === letter;
            return (
              <li
                key={letter}
                className={cn(
                  "flex gap-2 items-start",
                  isCorrect &&
                  "bg-emerald-50 dark:bg-emerald-950/20 rounded px-1",
                )}
              >
                <span
                  className={cn(
                    "font-bold shrink-0",
                    isCorrect && "text-emerald-700 dark:text-emerald-400",
                  )}
                >
                  {letter})
                </span>
                <div className="flex-1 min-w-0">
                  <span className="leading-relaxed whitespace-pre-wrap break-words">
                    {text ? (
                      <MathText text={text} />
                    ) : (
                      <span className="text-muted-foreground italic">
                        (alternativa {letter} vazia)
                      </span>
                    )}
                  </span>
                  {image && (
                    <div className="mt-1 flex">
                      <img
                        src={image}
                        alt=""
                        className="max-w-full max-h-[140px] h-auto object-contain rounded border border-border"
                      />
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="mt-3 space-y-2">
          <p className="text-[0.7em] uppercase tracking-wide text-muted-foreground font-semibold">
            {data.showAnswerLines !== false
              ? `Resposta (${answerLines} linha${answerLines === 1 ? "" : "s"})`
              : `Espaço em branco (${answerLines} linha${answerLines === 1 ? "" : "s"})`}
          </p>
          {data.showAnswerLines !== false ? (
            <div className="space-y-[10px]">
              {Array.from({ length: answerLines }).map((_, i) => (
                <div
                  key={i}
                  className="border-b border-zinc-400/70 h-5"
                  aria-hidden
                />
              ))}
            </div>
          ) : (
            /* Espaço em branco: mesma altura das linhas sem as bordas */
            <div
              style={{ height: `${answerLines * 30}px` }}
              className="w-full border border-dashed border-zinc-300 rounded"
              aria-label="Espaço para cálculo"
            />
          )}
          {showAnswer && data.discursiveRubric && (
            <div className="mt-4 p-4 border rounded-md bg-muted/20 space-y-2 text-sm break-inside-avoid">
              <p className="font-bold text-base mb-3 border-b pb-2">Critérios de Correção (Gabarito)</p>
              {data.discursiveRubric.level1 && (
                <p><span className="font-semibold text-rose-600">Nível 1 (Insuficiente):</span> <span className="whitespace-pre-wrap">{data.discursiveRubric.level1}</span></p>
              )}
              {data.discursiveRubric.level2 && (
                <p><span className="font-semibold text-amber-600">Nível 2 (Parcial):</span> <span className="whitespace-pre-wrap">{data.discursiveRubric.level2}</span></p>
              )}
              {data.discursiveRubric.level3 && (
                <p><span className="font-semibold text-blue-600">Nível 3 (Adequada):</span> <span className="whitespace-pre-wrap">{data.discursiveRubric.level3}</span></p>
              )}
              {data.discursiveRubric.level4 && (
                <p><span className="font-semibold text-emerald-600">Nível 4 (Completa):</span> <span className="whitespace-pre-wrap">{data.discursiveRubric.level4}</span></p>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
