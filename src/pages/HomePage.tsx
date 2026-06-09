import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  FilePlus2,
  Library,
  FileDown,
  BookOpen,
} from "lucide-react";
import { useQuestions } from "@/hooks/useQuestions";

export default function HomePage() {
  const { questions } = useQuestions();

  const stats = {
    total: questions.length,
    disciplinas: new Set(questions.map(q => q.subject)).size,
    series: new Set(questions.map(q => q.grade)).size,
  };

  const recent = questions.slice(0, 4);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-gradient-to-br from-brand to-primary text-white p-8 md:p-12 shadow-xl relative overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white opacity-5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-60 h-60 bg-white opacity-5 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="max-w-2xl relative z-10">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
            AvaliaEdu
          </h1>

          <p className="mt-4 text-base md:text-lg text-white/90 leading-relaxed font-light">
            O AvaliaEdu é um sistema voltado à gestão de avaliações e questões educacionais da rede de ensino, permitindo o cadastro, organização e geração de provas de forma prática, padronizada e eficiente, contribuindo para o acompanhamento da aprendizagem dos estudantes.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/cadastro">
              <Button size="lg" className="bg-white text-brand hover:bg-white/90 hover:shadow-md transition-all font-semibold border-0 rounded-xl px-6">
                <FilePlus2 className="w-5 h-5 mr-2" />
                Cadastrar questão
              </Button>
            </Link>

            <Link href="/gerar">
              <Button
                size="lg"
                variant="outline"
                className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 hover:border-white/50 transition-all font-medium rounded-xl px-6"
              >
                <FileDown className="w-5 h-5 mr-2" />
                Gerar prova
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl shadow-sm border border-border/60 border-l-4 border-l-brand hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de questões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-brand">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border border-border/60 border-l-4 border-l-primary hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Disciplinas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {stats.disciplinas}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border border-border/60 border-l-4 border-l-brand hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Séries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-brand">{stats.series}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border border-border/60 border-l-4 border-l-primary hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold text-primary flex items-center gap-2 mt-1.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-40"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              Funcionando
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        <QuickAction
          href="/cadastro"
          icon={FilePlus2}
          title="Cadastro de Questões"
          desc="Adicione novas questões ao sistema."
        />

        <QuickAction
          href="/banco"
          icon={Library}
          title="Banco de Questões"
          desc="Visualize e organize suas questões."
        />

        <QuickAction
          href="/gerar"
          icon={FileDown}
          title="Gerar Prova"
          desc="Monte e exporte provas em PDF."
        />
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Questões recentes</h2>

          <Link href="/banco">
            <Button variant="ghost" size="sm">
              Ver todas <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {recent.length === 0 ? (
          <Card className="rounded-2xl border-dashed border-2 bg-muted/20">
            <CardContent className="py-16 text-center">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />

              <p className="text-muted-foreground mb-6 font-medium">
                Nenhuma questão cadastrada ainda.
              </p>

              <Link href="/cadastro">
                <Button className="rounded-xl px-6">Cadastrar primeira questão</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {recent.map((q, index) => (
              <Card key={index} className="rounded-2xl shadow-sm hover:shadow-md border border-border/60 transition-all hover:-translate-y-0.5">
                <CardContent className="p-5">
                  <Badge className="bg-brand/10 text-brand hover:bg-brand/20 border-0 font-medium px-2.5 py-0.5">{q.subject}</Badge>

                  <p className="text-sm mt-3 text-foreground/80 leading-relaxed line-clamp-2">{q.statement}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  title,
  desc,
}: {
  href: string;
  icon: any;
  title: string;
  desc: string;
}) {
  return (
    <Link href={href}>
      <Card className="h-full rounded-2xl hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer border border-border/60 group">
        <CardContent className="p-6">
          <div className="w-12 h-12 rounded-xl bg-brand/5 text-brand inline-flex items-center justify-center mb-4 ring-1 ring-brand/10 group-hover:bg-brand/10 group-hover:scale-110 transition-all">
            <Icon className="w-6 h-6" />
          </div>

          <h3 className="font-semibold text-foreground/90">{title}</h3>

          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{desc}</p>
        </CardContent>
      </Card>
    </Link>
  );
}