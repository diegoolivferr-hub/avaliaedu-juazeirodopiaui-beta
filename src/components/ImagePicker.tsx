import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ImagePlus, X, Link as LinkIcon } from "lucide-react";
import { fileToDownscaledDataUrl } from "@/lib/image-utils";
import { toast } from "sonner";

interface ImagePickerProps {
  value: string | null | undefined;
  onChange: (v: string | null) => void;
  label?: string;
  compact?: boolean;
}

export function ImagePicker({ value, onChange, label, compact }: ImagePickerProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  const [open, setOpen] = useState(false);

  const handleFile = async (file: File) => {
    try {
      const dataUrl = await fileToDownscaledDataUrl(file);
      onChange(dataUrl);
    } catch (e) {
      toast.error("Não foi possível ler a imagem.");
    }
  };

  if (value) {
    return (
      <div className="flex items-start gap-2">
        <img
          src={value}
          alt="prévia"
          className="rounded-md border border-border max-h-32 max-w-[180px] object-contain bg-muted"
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => onChange(null)}
          aria-label="Remover imagem"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size={compact ? "sm" : "default"}
        onClick={() => setOpen(true)}
      >
        <ImagePlus className="w-4 h-4 mr-2" />
        {label ?? "Adicionar imagem"}
      </Button>
    );
  }

  return (
    <div className="border border-border rounded-md p-3 bg-muted/30">
      <Tabs defaultValue="upload">
        <TabsList className="mb-2">
          <TabsTrigger value="upload">
            <ImagePlus className="w-4 h-4 mr-1" /> Upload
          </TabsTrigger>
          <TabsTrigger value="url">
            <LinkIcon className="w-4 h-4 mr-1" /> URL
          </TabsTrigger>
        </TabsList>
        <TabsContent value="upload" className="space-y-2">
          <Input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <p className="text-xs text-muted-foreground">
            Imagem será redimensionada (máx 1200px) para o PDF.
          </p>
        </TabsContent>
        <TabsContent value="url" className="space-y-2">
          <Input
            placeholder="https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <Button
            type="button"
            size="sm"
            onClick={() => {
              if (url.trim()) onChange(url.trim());
            }}
          >
            Usar URL
          </Button>
        </TabsContent>
      </Tabs>
      <div className="mt-2 flex justify-end">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setOpen(false)}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}
