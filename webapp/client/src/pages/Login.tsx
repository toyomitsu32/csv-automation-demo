import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Login() {
  const [, navigate] = useLocation();
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");

  const utils = trpc.useUtils();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      toast.success("ログインしました");
      utils.auth.me.invalidate();
      navigate("/");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      toast.success("アカウントを作成しました");
      utils.auth.me.invalidate();
      navigate("/");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername || !loginPassword) {
      toast.error("ユーザー名とパスワードを入力してください");
      return;
    }
    loginMutation.mutate({ username: loginUsername, password: loginPassword });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerUsername || !registerPassword) {
      toast.error("ユーザー名とパスワードを入力してください");
      return;
    }
    if (registerPassword.length < 6) {
      toast.error("パスワードは6文字以上で入力してください");
      return;
    }
    registerMutation.mutate({
      username: registerUsername,
      password: registerPassword,
      name: registerName || undefined,
      email: registerEmail || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <FileSpreadsheet className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">CSV Manager</CardTitle>
          <CardDescription>
            アカウントにログインまたは新規登録
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">ログイン</TabsTrigger>
              <TabsTrigger value="register">新規登録</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="login-username">ユーザー名</Label>
                  <Input
                    id="login-username"
                    type="text"
                    placeholder="ユーザー名を入力"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    disabled={loginMutation.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">パスワード</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="パスワードを入力"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    disabled={loginMutation.isPending}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ログイン中...
                    </>
                  ) : (
                    "ログイン"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="register-username">ユーザー名 *</Label>
                  <Input
                    id="register-username"
                    type="text"
                    placeholder="3文字以上"
                    value={registerUsername}
                    onChange={(e) => setRegisterUsername(e.target.value)}
                    disabled={registerMutation.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">パスワード *</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="6文字以上"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    disabled={registerMutation.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-name">表示名（任意）</Label>
                  <Input
                    id="register-name"
                    type="text"
                    placeholder="表示名"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    disabled={registerMutation.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">メールアドレス（任意）</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="example@email.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    disabled={registerMutation.isPending}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                  {registerMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      登録中...
                    </>
                  ) : (
                    "アカウント作成"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
