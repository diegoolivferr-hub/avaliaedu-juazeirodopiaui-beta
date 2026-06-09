import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center py-20">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6 text-center">
          <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Página não encontrada</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            O endereço acessado não existe.
          </p>
          <Link href="/">
            <Button className="mt-5">Voltar ao início</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
