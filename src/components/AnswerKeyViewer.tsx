import { forwardRef, useEffect } from "react";
import { Question } from "@/hooks/useQuestions";
import { AssessmentFormatting } from "@/hooks/useAssessments";
import { MathText } from "@/components/MathText";

interface AnswerKeyViewerProps {
  questions: Question[];
  formatting: AssessmentFormatting;
  previewMode?: boolean;
  onReadyToPrint?: () => void;
}

export const AnswerKeyViewer = forwardRef<HTMLDivElement, AnswerKeyViewerProps>(
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

    useEffect(() => {
      if (onReadyToPrint && !previewMode) {
        const timer = setTimeout(onReadyToPrint, 100);
        return () => clearTimeout(timer);
      }
    }, [onReadyToPrint, previewMode]);

    return (
      <div className={previewMode ? "w-full h-full flex justify-center" : "absolute top-0 left-0 -z-50 opacity-0 pointer-events-none"} style={previewMode ? {} : { width: '794px' }}>
        <div 
          ref={ref} 
          style={{ 
            width: '794px', 
            padding: `${Math.round(pt * 3.78)}px ${Math.round(pr * 3.78)}px ${Math.round(pb * 3.78)}px ${Math.round(pl * 3.78)}px`,
            backgroundColor: '#ffffff',
            color: '#000000',
            fontSize: `${formatting.fontSize}px`,
            fontFamily: formatting.font,
            lineHeight: lineHeight,
            minHeight: '1123px'
          }}
          className={`print-layout break-words ${previewMode ? 'shadow-2xl' : ''}`}
        >
          <div className="mb-6 border-b pb-4">
            <h1 className="text-2xl font-bold text-center">GABARITO DA AVALIAÇÃO</h1>
          </div>
          
          <div className="space-y-6">
            {questions.map((q, index) => (
              <div key={q.id} className="break-inside-avoid">
                <div className="flex gap-3">
                  <span className="font-bold whitespace-nowrap">{index + 1} - </span>
                  <div className="flex-1">
                    {q.type === 'objetiva' ? (
                      <span className="font-bold text-lg">{q.correctAlternative}</span>
                    ) : (
                      <div className="space-y-2">
                        <span className="font-bold text-base">Questão Discursiva</span>
                        {q.discursiveRubric && (
                          <div className="ml-2 text-sm space-y-1">
                            {q.discursiveRubric.level1 && <p><strong>Nível 1:</strong> <MathText text={q.discursiveRubric.level1} /></p>}
                            {q.discursiveRubric.level2 && <p><strong>Nível 2:</strong> <MathText text={q.discursiveRubric.level2} /></p>}
                            {q.discursiveRubric.level3 && <p><strong>Nível 3:</strong> <MathText text={q.discursiveRubric.level3} /></p>}
                            {q.discursiveRubric.level4 && <p><strong>Nível 4:</strong> <MathText text={q.discursiveRubric.level4} /></p>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
);
AnswerKeyViewer.displayName = "AnswerKeyViewer";
