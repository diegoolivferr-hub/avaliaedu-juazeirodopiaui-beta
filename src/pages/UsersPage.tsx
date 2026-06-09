import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { AuthService, User } from "@/lib/AuthService";
import { UserCog, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function UsersPage() {
  const { isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  const [users, setUsers] = useState<Omit<User, 'senha'>[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [role, setRole] = useState<'admin' | 'user'>("user");
  const [ativo, setAtivo] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      setLocation("/");
      return;
    }
    loadUsers();
  }, [isAdmin, setLocation]);

  const loadUsers = () => {
    setUsers(AuthService.getUsers());
  };

  const resetForm = () => {
    setEditingId(null);
    setNome("");
    setEmail("");
    setSenha("");
    setRole("user");
    setAtivo(true);
  };

  const handleOpenNew = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: Omit<User, 'senha'>) => {
    resetForm();
    setEditingId(user.id);
    setNome(user.nome);
    setEmail(user.email);
    setRole(user.role);
    setAtivo(user.ativo);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!nome.trim() || !email.trim()) {
      toast.error("Nome e E-mail são obrigatórios.");
      return;
    }

    if (editingId) {
      const updates: any = { nome, email, role, ativo };
      if (senha) updates.senha = senha;

      const { error } = AuthService.updateUser(editingId, updates);
      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Usuário atualizado com sucesso!");
    } else {
      if (!senha) {
        toast.error("Senha é obrigatória para novos usuários.");
        return;
      }
      const { error } = AuthService.createUser({
        nome,
        email,
        senha,
        role,
        ativo
      });
      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Usuário criado com sucesso!");
    }
    
    setIsModalOpen(false);
    loadUsers();
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este usuário?")) {
      const { error } = AuthService.deleteUser(id);
      if (error) {
        toast.error(error);
      } else {
        toast.success("Usuário excluído.");
        loadUsers();
      }
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <UserCog className="w-8 h-8 text-primary" />
            Gestão de Usuários
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os acessos, perfis e contas dos professores e administradores.
          </p>
        </div>
        <Button onClick={handleOpenNew}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuários do Sistema</CardTitle>
          <CardDescription>
            {users.length} usuário(s) cadastrado(s).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Usuário/E-mail</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.nome}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      {u.role === 'admin' ? (
                        <Badge variant="default" className="bg-purple-600 hover:bg-purple-700">Administrador</Badge>
                      ) : (
                        <Badge variant="secondary">Professor</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {u.ativo ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">Ativo</Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-600 border-red-600">Inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(u)}>
                          <Pencil className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(u.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
            <DialogDescription>
              Preencha os dados do usuário. Clique em salvar quando terminar.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: João da Silva" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Usuário ou E-mail</Label>
              <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Ex: joao.silva" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha">Senha {editingId && <span className="text-xs text-muted-foreground font-normal">(Deixe em branco para não alterar)</span>}</Label>
              <Input id="senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="***" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Perfil</Label>
                <Select value={role} onValueChange={(v: 'admin' | 'user') => setRole(v)}>
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="user">Professor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch id="status" checked={ativo} onCheckedChange={setAtivo} />
                  <Label htmlFor="status" className="font-normal cursor-pointer">
                    {ativo ? "Ativo" : "Inativo"}
                  </Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
