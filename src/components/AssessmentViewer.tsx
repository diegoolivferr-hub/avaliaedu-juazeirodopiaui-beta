import { forwardRef, useState, useEffect, useRef } from "react";
import { Question } from "@/hooks/useQuestions";
import { AssessmentFormatting } from "@/hooks/useAssessments";
import { MathText } from "@/components/MathText";

interface AssessmentViewerProps {
  questions: Question[];
  formatting: AssessmentFormatting;
  previewMode?: boolean;
  onReadyToPrint?: () => void;
}

export const AssessmentViewer = forwardRef<HTMLDivElement, AssessmentViewerProps>(
  ({ questions, formatting, previewMode = false, onReadyToPrint }, ref) => {
    const marginMap = {
      Pequena: 10,
      Média: 15,
      Grande: 20,
    };
    const spacingMap = {
      Simples: 1,
      "1.5": 1.5,
      Duplo: 2,
    };

    const marginMM = marginMap[formatting.margin] || 15;
    const { top = 2, right = 2, bottom = 2, left = 2 } = formatting.margins || {};
    const pt = formatting.margins ? top * 10 : marginMM;
    const pr = formatting.margins ? right * 10 : marginMM;
    const pb = formatting.margins ? bottom * 10 : marginMM;
    const pl = formatting.margins ? left * 10 : marginMM;
    const lineHeight = formatting.lineHeight ?? (spacingMap[formatting.spacing] || 1.3);

    const [pages, setPages] = useState<Question[][]>([]);
    const [isMeasuring, setIsMeasuring] = useState(true);
    const measureContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!questions || questions.length === 0) {
        setPages([]);
        setIsMeasuring(false);
        return;
      }

      setIsMeasuring(true);

      const runPagination = () => {
        if (!measureContainerRef.current) return;

        const questionElements = Array.from(measureContainerRef.current.children) as HTMLElement[];

        // A4 em pixels (96dpi): 794×1123px
        const pageHeightPx = 1123;
        // Margens em mm → px: 1mm ≈ 3.7795px
        const ptPx = pt * 3.7795;
        const pbPx = pb * 3.7795;
        const availableHeight = pageHeightPx - ptPx - pbPx;

        // Espaçamento real usado entre questões no render final
        const qSpacingPx = formatting.questionSpacing ?? 16;

        // Margem de segurança de 4% para diferenças de subpixel entre
        // o container de medição e o canvas do html2canvas
        const safeHeight = availableHeight * 0.96;

        const newPages: Question[][] = [];
        let currentPage: Question[] = [];
        let currentHeight = 0;

        questionElements.forEach((el, index) => {
          // offsetHeight é mais estável que getBoundingClientRect para elementos fora de viewport
          const qHeight = el.offsetHeight || el.getBoundingClientRect().height;
          // O primeiro item da página não tem espaçamento superior
          const gap = currentPage.length === 0 ? 0 : qSpacingPx;
          const totalQHeight = gap + qHeight;

          if (currentPage.length > 0 && currentHeight + totalQHeight > safeHeight) {
            newPages.push(currentPage);
            currentPage = [questions[index]];
            currentHeight = qHeight; // sem gap no topo da nova página
          } else {
            currentPage.push(questions[index]);
            currentHeight += totalQHeight;
          }
        });

        if (currentPage.length > 0) {
          newPages.push(currentPage);
        }

        setPages(newPages);
        setIsMeasuring(false);

        if (onReadyToPrint && !previewMode) {
          setTimeout(onReadyToPrint, 300);
        }
      };

      // Aguarda imagens carregarem antes de medir
      const waitForImages = (container: HTMLDivElement): Promise<void> => {
        const imgs = Array.from(container.querySelectorAll('img')) as HTMLImageElement[];
        const pending = imgs.filter(img => !img.complete);
        if (pending.length === 0) return Promise.resolve();
        return new Promise(resolve => {
          let loaded = 0;
          const done = () => { if (++loaded >= pending.length) resolve(); };
          pending.forEach(img => {
            img.addEventListener('load', done, { once: true });
            img.addEventListener('error', done, { once: true });
          });
          // Fallback: não espera mais de 2s por imagens
          setTimeout(resolve, 2000);
        });
      };

      // 300ms para o DOM da hidden div estabilizar antes de medir
      const timer = setTimeout(async () => {
        if (!measureContainerRef.current) return;
        await waitForImages(measureContainerRef.current);
        runPagination();
      }, 300);

      return () => clearTimeout(timer);
    }, [questions, formatting, previewMode, pt, pb, onReadyToPrint]);

    const renderQuestion = (q: Question, num: number) => (
      <div key={q.id} className="questao break-inside-avoid w-full max-w-full" style={{ marginBottom: `${formatting.questionSpacing ?? 16}px` }}>
        <div className="w-full max-w-full">
          <div className="w-full max-w-full space-y-4">
            {/* Texto de Apoio Legado */}
            {(!q.optionalBlocks || q.optionalBlocks.length === 0) && (q.supportText || q.supportTitle) && (
              <div
                className="mb-4 break-inside-avoid w-full max-w-full"
                style={{ background: '#f3f4f6', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}
              >
                {q.supportTitle && <h3 className="font-bold mb-1 text-center"><MathText text={q.supportTitle} /></h3>}
                {q.supportText && <MathText text={q.supportText} block className="text-justify whitespace-pre-wrap" />}
                {q.supportAuthor && <p className="text-right text-sm mt-2 italic">— <MathText text={q.supportAuthor} /></p>}
              </div>
            )}

            {/* Blocos Opcionais Novos */}
            {q.optionalBlocks?.map((block) => {
              const isOldImage = block.type === 'image';
              const textContent = isOldImage ? '' : block.content;
              const imageContent = isOldImage ? block.content : block.imageUrl;

              if (!textContent?.trim() && !imageContent && !block.title?.trim() && !block.instruction?.trim()) return null;

              return (
                <div
                  key={block.id}
                  className="break-inside-avoid w-full max-w-full"
                  style={{ background: '#f3f4f6', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}
                >
                  {block.instruction && (
                    <MathText
                      text={block.instruction}
                      block
                      style={{ fontWeight: 'bold', marginBottom: '6px' }}
                      className="whitespace-pre-wrap"
                    />
                  )}
                  {block.title && <h3 className="font-bold mb-1 text-center"><MathText text={block.title} /></h3>}
                  {textContent && <MathText text={textContent} block className="text-justify whitespace-pre-wrap" />}
                  {imageContent && (
                    <div className="flex justify-center my-4 break-inside-avoid w-full max-w-full">
                      <img 
                        src={imageContent} 
                        alt="Imagem de apoio" 
                        style={{ 
                          maxWidth: '100%', 
                          height: 'auto',
                          display: 'block'
                        }} 
                        className="object-contain"
                      />
                    </div>
                  )}
                  {block.author && <p className="text-right text-sm mt-2 italic">— <MathText text={block.author} /></p>}
                </div>
              );
            })}

            <p className="whitespace-pre-wrap w-full max-w-full">
              <span className="font-bold mr-1">{num}.</span>
              {q.skill && <span className="font-bold mr-1">({q.skill})</span>}
              <MathText text={q.statement} />
            </p>
            
            {/* Imagem do enunciado legada */}
            {(!q.statementImagesList || q.statementImagesList.length === 0) && q.statementImage && (
              <div className="flex justify-center my-4 break-inside-avoid w-full max-w-full">
                <img src={q.statementImage} alt="Imagem da questão" style={{ maxWidth: '100%', height: 'auto', display: 'block', maxHeight: '400px', objectFit: 'contain' }} />
              </div>
            )}

            {/* Imagens múltiplas do enunciado */}
            {q.statementImagesList?.map((img) => img.url ? (
              <div key={img.id} className="flex justify-center my-4 break-inside-avoid w-full max-w-full">
                <img 
                  src={img.url} 
                  alt="Imagem da questão" 
                  style={{ 
                    maxWidth: '100%', 
                    height: 'auto',
                    display: 'block',
                    width: img.width ? (typeof img.width === 'number' ? `${img.width}px` : img.width) : undefined, 
                    maxHeight: img.height ? (typeof img.height === 'number' ? `${img.height}px` : img.height) : '400px'
                  }} 
                  className="object-contain"
                />
              </div>
            ) : null)}
            
            {q.statementContinuation && (
              <MathText text={q.statementContinuation} block className="whitespace-pre-wrap w-full max-w-full" />
            )}

            {q.type === 'objetiva' ? (
              <div className="mt-4 w-full max-w-full flex flex-col" style={{ gap: `${formatting.alternativeSpacing ?? 6}px` }}>
                {['A', 'B', 'C', 'D'].map((letter) => {
                  const text = q[`alternative${letter}` as keyof Question];
                  const img = q[`alternative${letter}Image` as keyof Question];
                  if (!text && !img) return null;
                  return (
                    <div key={letter} className="flex gap-3 items-start break-inside-avoid w-full max-w-full">
                      <span className="font-bold shrink-0">{letter})</span>
                      <div className="space-y-2 flex-1 min-w-0 w-full max-w-full">
                        {text && <MathText text={String(text)} className="block whitespace-pre-wrap break-words" />}
                        {img && <img src={String(img)} style={{ maxWidth: '100%', height: 'auto', display: 'block', maxHeight: '150px', objectFit: 'contain' }} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : q.showAnswerLines !== false ? (
              /* Linhas de resposta */
              <div className="mt-8 space-y-8 w-full max-w-full">
                {Array.from({ length: q.answerLines || 5 }).map((_, i) => (
                  <div key={i} className="border-b border-gray-400 w-full" style={{ height: '1px' }}></div>
                ))}
              </div>
            ) : (
              /* Espaço em branco para cálculos */
              <div
                className="mt-8 w-full max-w-full"
                style={{ height: `${(q.answerLines || 5) * 33}px` }}
              />
            )}
          </div>
        </div>
      </div>
    );

    const pageStyle = { 
      width: '794px',
      minHeight: '1123px',
      padding: `${Math.round(pt * 3.78)}px ${Math.round(pr * 3.78)}px ${Math.round(pb * 3.78)}px ${Math.round(pl * 3.78)}px`,
      backgroundColor: '#ffffff',
      color: '#000000',
      fontSize: `${formatting.fontSize}px`,
      fontFamily: formatting.font,
      lineHeight: lineHeight,
      wordBreak: 'break-word' as const,
      overflowWrap: 'break-word' as const,
      whiteSpace: 'normal' as const,
      textAlign: 'left' as const
    };

    return (
      <div className={previewMode ? "print-wrapper bg-gray-100 py-10 w-full overflow-auto flex flex-col items-center gap-10" : "print-wrapper absolute top-0 left-0 -z-50 opacity-0 pointer-events-none"}>
        
        {/* Contêiner invisível usado apenas para medir a altura real das questões antes de paginar */}
        {isMeasuring && (
          <div
            style={{
              ...pageStyle,
              position: 'fixed',
              top: 0,
              left: '-9999px',
              visibility: 'hidden',
              height: 'auto',
              minHeight: 'auto',
              overflow: 'hidden',
              pointerEvents: 'none',
              zIndex: -9999,
            }}
            className="print-page print-layout"
          >
            <div ref={measureContainerRef} className="w-full max-w-full flex flex-col">
              {questions.map((q, i) => renderQuestion(q, i + 1))}
            </div>
          </div>
        )}

        {!isMeasuring && pages.map((pageQuestions, pageIndex) => {
          // Calcular o número global da primeira questão desta página
          const pageStartNum = pages.slice(0, pageIndex).reduce((acc, pg) => acc + pg.length, 0);
          return (
            <div 
              key={pageIndex}
              ref={pageIndex === 0 ? ref : null} 
              style={pageStyle}
              className={previewMode ? "print-page bg-white shadow-md overflow-hidden" : "print-page print-layout"}
            >
              <div className="w-full max-w-full flex flex-col">
                {pageQuestions.map((q, i) => renderQuestion(q, pageStartNum + i + 1))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
);
AssessmentViewer.displayName = "AssessmentViewer";
