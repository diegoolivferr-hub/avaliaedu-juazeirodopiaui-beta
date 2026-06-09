import { jsPDF } from "jspdf";
import { Question } from "@/hooks/useQuestions";
import { AssessmentFormatting } from "@/hooks/useAssessments";

export interface PDFConfig {
  coverFile: File | null;
  margin: number;
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function generateExamPDF(
  type: "exam" | "answerKey",
  questions: Question[],
  formatting: AssessmentFormatting,
  config: PDFConfig,
  filename: string = "Prova_Gerada.pdf"
) {
  // A4 em mm
  const pdfWidth = 210;
  const pdfHeight = 297;

  const doc = new jsPDF("p", "mm", "a4");

  // Converter margens de cm (do formatting) para mm
  const { top = 2, right = 2, bottom = 2, left = 2 } = formatting.margins || {};
  const marginTop = top * 10;
  const marginRight = right * 10;
  const marginBottom = bottom * 10;
  const marginLeft = left * 10;
  const contentWidth = pdfWidth - marginLeft - marginRight;

  // Fonte e tamanho
  const fontName = formatting.font === "Times New Roman" ? "times" : formatting.font === "Calibri" ? "helvetica" : "helvetica"; // fallback to helvetica
  const fontSize = formatting.fontSize || 12;
  const lineSpacingScale = formatting.spacing === "Simples" ? 1.15 : formatting.spacing === "1.5" ? 1.5 : 2;

  let y = marginTop;

  function addPageIfNeeded(requiredHeight: number) {
    if (y + requiredHeight > pdfHeight - marginBottom) {
      doc.addPage();
      y = marginTop;
      return true;
    }
    return false;
  }

  function writeText(text: string, size: number, isBold: boolean = false, align: "left" | "center" | "right" | "justify" = "left", xOffset: number = 0) {
    if (!text) return;
    doc.setFont(fontName, isBold ? "bold" : "normal");
    doc.setFontSize(size);
    
    // Normalizar quebras de linha existentes
    const paragraphs = text.split('\n');
    const lineHeight = (size * 0.3528) * lineSpacingScale; // mm por pt * scale
    
    for (const paragraph of paragraphs) {
      if (paragraph.trim() === '') {
        y += lineHeight;
        addPageIfNeeded(lineHeight);
        continue;
      }
      
      const lines = doc.splitTextToSize(paragraph, contentWidth - xOffset);
      for (let i = 0; i < lines.length; i++) {
        addPageIfNeeded(lineHeight);
        if (align === "center") {
          const textWidth = doc.getTextWidth(lines[i]);
          doc.text(lines[i], marginLeft + xOffset + (contentWidth - xOffset - textWidth) / 2, y);
        } else if (align === "right") {
          const textWidth = doc.getTextWidth(lines[i]);
          doc.text(lines[i], marginLeft + contentWidth - textWidth, y);
        } else if (align === "justify") {
          // jsPDF native justify only works correctly if max width is passed
          // We will just use left align for simplicity to avoid weird spacing issues with native justify,
          // unless strictly needed. Using left is safer.
          doc.text(lines[i], marginLeft + xOffset, y);
        } else {
          doc.text(lines[i], marginLeft + xOffset, y);
        }
        y += lineHeight;
      }
    }
  }

  // Capa
  if (type === "exam" && config.coverFile && config.coverFile.type.startsWith("image/")) {
    const coverDataUrl = await readFileAsDataURL(config.coverFile);
    doc.addImage(coverDataUrl, "JPEG", 0, 0, pdfWidth, pdfHeight);
    doc.addPage();
    y = marginTop;
  }

  if (type === "answerKey") {
    // Título do Gabarito
    writeText("GABARITO", fontSize + 4, true, "center");
    y += 10;

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      writeText(`Questão ${i + 1} - ${q.type === 'objetiva' ? 'Objetiva' : 'Discursiva'}`, fontSize, true);
      
      if (q.type === "objetiva") {
        writeText(`Alternativa correta: ${q.correctAlternative || '-'}`, fontSize, false, "left", 5);
      } else {
        const rubric = q.discursiveRubric;
        if (rubric) {
          writeText(`Nível 1 (Insuficiente): ${rubric.level1 || '-'}`, fontSize - 2, false, "left", 5);
          writeText(`Nível 2 (Parcial): ${rubric.level2 || '-'}`, fontSize - 2, false, "left", 5);
          writeText(`Nível 3 (Adequada): ${rubric.level3 || '-'}`, fontSize - 2, false, "left", 5);
          writeText(`Nível 4 (Completa): ${rubric.level4 || '-'}`, fontSize - 2, false, "left", 5);
        }
      }
      y += 5;
    }
  } else {
    // Prova
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      
      // Espaço entre questões
      if (i > 0) y += 10;

      // Imprimir blocos de apoio legados (supportTitle, etc) se não houver blocos opcionais
      if (!q.optionalBlocks || q.optionalBlocks.length === 0) {
        if (q.supportTitle || q.supportText || q.supportAuthor) {
        if (q.supportTitle) {
          writeText(q.supportTitle, fontSize, true, "center");
          y += 2;
        }
        if (q.supportText) {
          writeText(q.supportText, fontSize, false, "justify");
        }
        if (q.supportAuthor) {
          writeText(q.supportAuthor, fontSize - 2, false, "right");
        }
        y += 5;
        }
      }

      // Opcional Blocks
      if (q.optionalBlocks && q.optionalBlocks.length > 0) {
        for (const block of q.optionalBlocks) {
          if (block.type === "text") {
            if (block.title) {
              writeText(block.title, fontSize, true, "center");
              y += 2;
            }
            if (block.content) {
              writeText(block.content, fontSize, false, "justify");
            }
            if (block.author) {
              writeText(block.author, fontSize - 2, false, "right");
            }
            y += 5;
          } else if (block.type === "image" && block.content) {
             // Block de imagem (a ser implementado se for base64/url suportada)
             try {
                const img = await loadImage(block.content);
                const imgRatio = img.height / img.width;
                const renderWidth = Math.min(contentWidth * 0.8, block.width || contentWidth * 0.8);
                const renderHeight = renderWidth * imgRatio;
                addPageIfNeeded(renderHeight + 5);
                const imgX = marginLeft + (contentWidth - renderWidth) / 2;
                doc.addImage(img, "JPEG", imgX, y, renderWidth, renderHeight);
                y += renderHeight + 5;
             } catch(e) {
                console.error("Falha ao carregar imagem do bloco opcional", e);
             }
          }
        }
      }

      // Enunciado Principal
      const statementPrefix = q.skill ? `${i + 1} - (${q.skill}) ` : `${i + 1}. `;
      const statementFirstLineIndent = doc.getTextWidth(statementPrefix);
      
      doc.setFont(fontName, "bold");
      doc.setFontSize(fontSize);
      addPageIfNeeded(10);
      doc.text(statementPrefix, marginLeft, y);
      
      // O texto do enunciado pode ser longo
      if (q.statement) {
        // Reduz a margem inicial pela largura do prefixo
        const statementText = q.statement;
        
        // Render first paragraph differently
        const paragraphs = statementText.split('\n');
        for (let pIndex = 0; pIndex < paragraphs.length; pIndex++) {
           const paragraph = paragraphs[pIndex];
           const currentIndent = pIndex === 0 ? statementFirstLineIndent : 0;
           const lines = doc.splitTextToSize(paragraph, contentWidth - currentIndent);
           
           for (let lIndex = 0; lIndex < lines.length; lIndex++) {
              addPageIfNeeded(fontSize * 0.3528 * lineSpacingScale);
              doc.setFont(fontName, "normal");
              if (pIndex === 0 && lIndex === 0) {
                 doc.text(lines[lIndex], marginLeft + currentIndent, y);
              } else {
                 doc.text(lines[lIndex], marginLeft, y);
              }
              y += fontSize * 0.3528 * lineSpacingScale;
           }
        }
      }

      y += 2;

      // Imagem do enunciado legada e lista de imagens
      const imagesToRender: any[] = [];
      if (q.statementImagesList && q.statementImagesList.length > 0) {
         imagesToRender.push(...q.statementImagesList);
      } else if (q.statementImage) {
         imagesToRender.push({ url: q.statementImage });
      }

      for (const imgData of imagesToRender) {
         if (imgData.url) {
            try {
              const img = await loadImage(imgData.url);
              const imgRatio = img.height / img.width;
              let renderWidth = contentWidth * 0.6; // Padrão 60%
              if ('width' in imgData && imgData.width) {
                 renderWidth = Math.min(contentWidth, Number(imgData.width));
              }
              const renderHeight = renderWidth * imgRatio;
              addPageIfNeeded(renderHeight + 5);
              const imgX = marginLeft + (contentWidth - renderWidth) / 2;
              doc.addImage(img, "JPEG", imgX, y, renderWidth, renderHeight);
              y += renderHeight + 5;
            } catch (e) {
              console.error("Falha ao carregar imagem do enunciado", e);
            }
         }
      }

      // Continuação do Enunciado
      if (q.statementContinuation) {
        writeText(q.statementContinuation, fontSize, false, "left");
        y += 2;
      }

      // Alternativas ou Linhas Discursivas
      if (q.type === "objetiva") {
        const letters = ['A', 'B', 'C', 'D'];
        for (const letter of letters) {
          const altTextKey = `alternative${letter}` as keyof Question;
          const altImgKey = `alternative${letter}Image` as keyof Question;
          const altText = q[altTextKey] as string;
          const altImg = q[altImgKey] as string;

          if (!altText && !altImg) continue;

          addPageIfNeeded(10); // mínimo para a letra
          doc.setFont(fontName, "bold");
          doc.text(`${letter})`, marginLeft + 5, y);
          
          if (altText) {
             const letterIndent = 12;
             const lines = doc.splitTextToSize(altText, contentWidth - 5 - letterIndent);
             doc.setFont(fontName, "normal");
             for (let lIndex = 0; lIndex < lines.length; lIndex++) {
                addPageIfNeeded(fontSize * 0.3528 * lineSpacingScale);
                doc.text(lines[lIndex], marginLeft + 5 + letterIndent, y);
                if (lIndex < lines.length - 1) y += fontSize * 0.3528 * lineSpacingScale;
             }
          }
          y += fontSize * 0.3528 * lineSpacingScale;

          if (altImg) {
            try {
              const img = await loadImage(altImg);
              const imgRatio = img.height / img.width;
              const renderWidth = contentWidth * 0.4; // 40% para img alt
              const renderHeight = renderWidth * imgRatio;
              addPageIfNeeded(renderHeight + 5);
              const imgX = marginLeft + 15;
              doc.addImage(img, "JPEG", imgX, y, renderWidth, renderHeight);
              y += renderHeight + 5;
            } catch (e) {
              console.error("Falha ao carregar imagem da alternativa", e);
            }
          }
        }
      } else {
        // Discursiva — Linhas ou espaço em branco
        const linesCount = q.answerLines || 5;
        // Altura por "linha": 10mm (mesmo espaçamento usado no PDF com linhas)
        const lineHeightMM = 10;
        y += 5; // Espaço antes das linhas/espaço

        if (q.showAnswerLines !== false) {
          // Desenhar linhas horizontais
          for (let l = 0; l < linesCount; l++) {
            addPageIfNeeded(lineHeightMM);
            doc.setDrawColor(150, 150, 150);
            doc.line(marginLeft, y, marginLeft + contentWidth, y);
            y += lineHeightMM;
          }
        } else {
          // Espaço em branco (sem linhas) — apenas avançar o Y
          const blankHeight = linesCount * lineHeightMM;
          addPageIfNeeded(blankHeight);
          y += blankHeight;
        }
      }
    }
  }

  doc.save(filename);
}
