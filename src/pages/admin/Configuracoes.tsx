import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { UserPlus, Users, CheckCircle, XCircle, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

const Configuracoes = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const [createOpen, setCreateOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [formError, setFormError] = useState("");

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      Authorization: `Bearer ${session?.access_token || supabaseAnonKey}`,
      "Content-Type": "application/json",
    };
  };

  const { data: admins, isLoading } = useQuery({
    queryKey: ["admin-users"],
    enabled: !!user,
    queryFn: async (): Promise<AdminUser[]> => {
      const headers = await getAuthHeaders();
      const res = await fetch(`${supabaseUrl}/functions/v1/manage-admin-users`, { headers });
      if (!res.ok) throw new Error("Erro ao carregar usuários");
      const data = await res.json();
      return data.admins || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { email: string; password: string; name: string }) => {
      const headers = await getAuthHeaders();
      const res = await fetch(`${supabaseUrl}/functions/v1/manage-admin-users`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar usuário");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setCreateOpen(false);
      setForm({ name: "", email: "", password: "" });
      setFormError("");
      toast({ title: "Usuário criado", description: "O novo administrador foi criado com sucesso." });
    },
    onError: (err: any) => {
      setFormError(err.message);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const headers = await getAuthHeaders();
      const res = await fetch(`${supabaseUrl}/functions/v1/manage-admin-users/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ is_active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao atualizar usuário");
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({
        title: variables.is_active ? "Usuário ativado" : "Usuário desativado",
        description: variables.is_active
          ? "O usuário pode agora acessar o painel."
          : "O usuário não pode mais acessar o painel.",
      });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (form.password.length < 8) {
      setFormError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    createMutation.mutate(form);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Nunca";
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600 mt-1">Gerencie as configurações do sistema</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Usuários Administradores
              </CardTitle>
              <CardDescription>
                Gerencie quem tem acesso ao painel administrativo
              </CardDescription>
            </div>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#084D6C] hover:bg-[#084D6C]/90">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Novo Usuário
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-[#084D6C]" />
                    Criar Administrador
                  </DialogTitle>
                  <DialogDescription>
                    O novo usuário terá acesso completo ao painel administrativo.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome completo</Label>
                    <Input
                      id="name"
                      placeholder="João Silva"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="joao@rsdata.inf.br"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Mínimo 8 caracteres"
                        value={form.password}
                        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                        className="pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  {formError && (
                    <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{formError}</p>
                  )}
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => { setCreateOpen(false); setFormError(""); }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      className="bg-[#084D6C] hover:bg-[#084D6C]/90"
                      disabled={createMutation.isPending}
                    >
                      {createMutation.isPending ? "Criando..." : "Criar usuário"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Último acesso</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        Nenhum usuário encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    admins?.map((admin) => (
                      <TableRow key={admin.id}>
                        <TableCell className="font-medium">{admin.name}</TableCell>
                        <TableCell className="text-gray-600">{admin.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{admin.role}</Badge>
                        </TableCell>
                        <TableCell>
                          {admin.is_active ? (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Ativo
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="gap-1">
                              <XCircle className="h-3 w-3" />
                              Inativo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {formatDate(admin.last_login)}
                        </TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={toggleActiveMutation.isPending}
                              >
                                {admin.is_active ? (
                                  <><XCircle className="h-4 w-4 mr-1 text-red-500" /> Desativar</>
                                ) : (
                                  <><CheckCircle className="h-4 w-4 mr-1 text-green-500" /> Ativar</>
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {admin.is_active ? "Desativar usuário?" : "Ativar usuário?"}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {admin.is_active
                                    ? `${admin.name} não poderá mais acessar o painel administrativo.`
                                    : `${admin.name} poderá acessar o painel administrativo novamente.`}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    toggleActiveMutation.mutate({ id: admin.id, is_active: !admin.is_active })
                                  }
                                  className={
                                    admin.is_active
                                      ? "bg-red-600 hover:bg-red-700"
                                      : "bg-green-600 hover:bg-green-700"
                                  }
                                >
                                  {admin.is_active ? "Desativar" : "Ativar"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Configuracoes;
