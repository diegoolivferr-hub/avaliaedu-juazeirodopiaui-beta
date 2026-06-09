import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { useClasses } from "@/hooks/useClasses";
import { useStudents } from "@/hooks/useStudents";
import { useAppliedAssessments } from "@/hooks/useAppliedAssessments";
import { useAssessments } from "@/hooks/useAssessments";
import { useQuestions } from "@/hooks/useQuestions";

const PERFORMANCE_LEVELS = {
  ADEQUADO: { label: "Adequado", color: "bg-green-500", min: 8 },
  BASICO: { label: "Básico", color: "bg-yellow-500", min: 5 },
  ABAIXO_BASICO: { label: "Abaixo do Básico", color: "bg-orange-500", min: 3 },
  CRITICO: { label: "Crítico", color: "bg-red-500", min: 0 }
};

function getPerformanceLevel(score: number) {
  if (score >= PERFORMANCE_LEVELS.ADEQUADO.min) return PERFORMANCE_LEVELS.ADEQUADO;
  if (score >= PERFORMANCE_LEVELS.BASICO.min) return PERFORMANCE_LEVELS.BASICO;
  if (score >= PERFORMANCE_LEVELS.ABAIXO_BASICO.min) return PERFORMANCE_LEVELS.ABAIXO_BASICO;
  return PERFORMANCE_LEVELS.CRITICO;
}

export function DashboardTab() {
  const { classes } = useClasses();
  const { students } = useStudents();
  const { appliedAssessments } = useAppliedAssessments();
  const { assessments } = useAssessments();
  const { questions } = useQuestions();

  const [classId, setClassId] = useState("");

  const dashboardData = useMemo(() => {
    if (!classId) return null;

    const classStudents = students.filter(s => s.classId === classId);
    const classApplications = appliedAssessments.filter(a => a.classId === classId);

    // Calculate grades
    // Format: { studentId: { subject: score } }
    const studentGrades: Record<string, Record<string, number>> = {};
    const skillPerformance: Record<string, { total: number, correct: number }> = {};
    const subjectPerformance: Record<string, { totalScores: number, count: number }> = {};
    const evolutionData: Record<string, any> = {};

    classStudents.forEach(student => {
      studentGrades[student.id] = {};
    });

    classApplications.forEach(app => {
      const assessment = assessments.find(a => a.id === app.assessmentId);
      if (!assessment) return;

      const appQuestions = questions.filter(q => assessment.questionIds.includes(q.id));
      
      const appDate = new Date(app.date).toLocaleDateString('pt-BR');
      if (!evolutionData[appDate]) {
        evolutionData[appDate] = { name: appDate, ...assessment.subjects.reduce((acc, sub) => ({...acc, [sub]: 0}), {}), count: 0 };
      }
      
      let appTotalScoresBySubject: Record<string, number> = {};
      let appStudentCount = 0;

      Object.keys(app.results).forEach(studentId => {
        if (!studentGrades[studentId]) studentGrades[studentId] = {};
        const studentRes = app.results[studentId].answers;
        
        appStudentCount++;
        const gradesBySubject: Record<string, { total: number; scored: number }> = {};

        appQuestions.forEach(q => {
          if (!gradesBySubject[q.subject]) gradesBySubject[q.subject] = { total: 0, scored: 0 };
          
          gradesBySubject[q.subject].total += 1;
          const res = studentRes[q.id];

          let score = 0;
          if (q.type === "objetiva" && res?.isCorrect) score = 1;
          else if (q.type === "discursiva" && res?.discursiveLevel) {
            if (res.discursiveLevel === 4) score = 1;
            else if (res.discursiveLevel === 3) score = 0.75;
            else if (res.discursiveLevel === 2) score = 0.5;
            else if (res.discursiveLevel === 1) score = 0;
          }

          gradesBySubject[q.subject].scored += score;

          // Track skill performance (only objective for simplicity, or include discursive)
          if (q.skill) {
            if (!skillPerformance[q.skill]) skillPerformance[q.skill] = { total: 0, correct: 0 };
            skillPerformance[q.skill].total += 1;
            skillPerformance[q.skill].correct += score; // treating score as % of correct
          }
        });

        Object.keys(gradesBySubject).forEach(subject => {
          const { total, scored } = gradesBySubject[subject];
          const finalScore = total > 0 ? (scored / total) * 10 : 0;
          
          if (!appTotalScoresBySubject[subject]) appTotalScoresBySubject[subject] = 0;
          appTotalScoresBySubject[subject] += finalScore;

          // Aggregate for overall subject performance
          if (!subjectPerformance[subject]) subjectPerformance[subject] = { totalScores: 0, count: 0 };
          subjectPerformance[subject].totalScores += finalScore;
          subjectPerformance[subject].count += 1;

          // Average student grades over multiple applications (simplification: last application overwrites or averages?)
          // Let's keep the average across all applications
          if (studentGrades[studentId][subject] === undefined) {
             studentGrades[studentId][subject] = finalScore;
          } else {
             studentGrades[studentId][subject] = (studentGrades[studentId][subject] + finalScore) / 2;
          }
        });
      });

      // Evolution average
      if (appStudentCount > 0) {
        Object.keys(appTotalScoresBySubject).forEach(subject => {
          evolutionData[appDate][subject] = appTotalScoresBySubject[subject] / appStudentCount;
        });
      }
    });

    const skillData = Object.keys(skillPerformance).map(skill => ({
      name: skill,
      acertos: Math.round((skillPerformance[skill].correct / skillPerformance[skill].total) * 100)
    }));

    const subjectData = Object.keys(subjectPerformance).map(subject => ({
      name: subject,
      media: Number((subjectPerformance[subject].totalScores / subjectPerformance[subject].count).toFixed(1))
    }));

    let allScores: number[] = [];
    Object.values(studentGrades).forEach(subjGrades => {
      Object.values(subjGrades).forEach(g => allScores.push(g));
    });

    const classAverage = allScores.length > 0 ? Number((allScores.reduce((a,b)=>a+b,0) / allScores.length).toFixed(1)) : 0;
    const maxScore = allScores.length > 0 ? Math.max(...allScores) : 0;
    const minScore = allScores.length > 0 ? Math.min(...allScores) : 0;

    return {
      studentCount: classStudents.length,
      classAverage,
      maxScore,
      minScore,
      skillData,
      subjectData,
      evolutionData: Object.values(evolutionData),
      studentGrades,
      classStudents
    };

  }, [classId, students, appliedAssessments, assessments, questions]);


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Painel de Desempenho</CardTitle>
          <CardDescription>Selecione uma turma para visualizar as estatísticas.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs">
            <Label>Turma</Label>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecione a turma" />
              </SelectTrigger>
              <SelectContent>
                {classes.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {dashboardData && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold">{dashboardData.studentCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Alunos na turma</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold">{dashboardData.classAverage.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground mt-1">Média Geral</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-green-600">{dashboardData.maxScore.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground mt-1">Maior Nota</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-red-600">{dashboardData.minScore.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground mt-1">Menor Nota</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Desempenho por Habilidade (%)</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData.skillData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" width={80} />
                    <RechartsTooltip formatter={(value) => `${value}%`} />
                    <Bar dataKey="acertos" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Média por Componente Curricular</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData.subjectData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 10]} />
                    <RechartsTooltip />
                    <Bar dataKey="media" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Evolução da Turma</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dashboardData.evolutionData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 10]} />
                    <RechartsTooltip />
                    <Legend />
                    {Object.keys(dashboardData.evolutionData[0] || {}).filter(k => k !== 'name' && k !== 'count').map((subject, idx) => (
                      <Line key={subject} type="monotone" dataKey={subject} stroke={`hsl(${idx * 45}, 70%, 50%)`} strokeWidth={2} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
