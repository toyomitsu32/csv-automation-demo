import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Download, Upload, CreditCard, LogOut, FileSpreadsheet, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { useRef, useState } from "react";
import { toast } from "sonner";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: csvData, isLoading: csvLoading, refetch } = trpc.csv.getData.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const downloadMutation = trpc.csv.download.useQuery(undefined, {
    enabled: false,
  });

  const uploadMutation = trpc.csv.upload.useMutation({
    onSuccess: (result) => {
      toast.success(`${result.rowsImported}件のデータをインポートしました`);
      refetch();
      setUploading(false);
    },
    onError: (error) => {
      toast.error(`アップロードエラー: ${error.message}`);
      setUploading(false);
    },
  });

  const handleDownload = async () => {
    try {
      const result = await downloadMutation.refetch();
      if (result.data) {
        const blob = new Blob([result.data.csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("CSVファイルをダウンロードしました");
      }
    } catch (error) {
      toast.error("ダウンロードに失敗しました");
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("CSVファイルを選択してください");
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      uploadMutation.mutate({ csvContent: content });
    };
    reader.onerror = () => {
      toast.error("ファイルの読み込みに失敗しました");
      setUploading(false);
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-8 w-8 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-800">CSV Manager</h1>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-slate-600">
                  ようこそ、{user?.name || user?.username || "ユーザー"}さん
                </span>
                <Button asChild variant="outline" size="sm">
                  <Link href="/payment">
                    <CreditCard className="h-4 w-4 mr-2" />
                    決済
                  </Link>
                </Button>
                <Button variant="outline" size="sm" onClick={() => logout()}>
                  <LogOut className="h-4 w-4 mr-2" />
                  ログアウト
                </Button>
              </>
            ) : (
              <Button asChild>
                <Link href="/login">ログイン</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">
            CSVファイル管理システム
          </h2>
          <p className="text-slate-600">
            CSVファイルのダウンロード、アップロード、データ管理を簡単に行えます。
          </p>
        </div>

        {!isAuthenticated ? (
          /* Not Logged In View */
          <div className="text-center">
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle>ログインが必要です</CardTitle>
                <CardDescription>
                  CSVファイルの操作や決済機能を利用するには、ログインしてください。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full" size="lg">
                  <Link href="/login">ログインして始める</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Logged In View - CSV Data Table */
          <div className="space-y-6">
            {/* Action Buttons */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">CSV操作</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 items-center">
                  <Button onClick={handleDownload} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    CSVダウンロード
                  </Button>
                  <div className="flex items-center gap-2">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      disabled={uploading}
                      className="max-w-[250px]"
                    />
                    {uploading && (
                      <span className="text-sm text-slate-500">アップロード中...</span>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => refetch()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    更新
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Data Table */}
            <Card>
              <CardHeader>
                <CardTitle>CSVデータ一覧</CardTitle>
                <CardDescription>
                  データベースに保存されているCSVデータ
                </CardDescription>
              </CardHeader>
              <CardContent>
                {csvLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : csvData && csvData.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[80px]">ID</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">更新日時</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {csvData.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell className="font-medium">{row.id}</TableCell>
                            <TableCell>{row.product}</TableCell>
                            <TableCell className="text-right">{row.quantity}</TableCell>
                            <TableCell className="text-right">¥{Number(row.price).toLocaleString()}</TableCell>
                            <TableCell className="text-right text-slate-500 text-sm">
                              {new Date(row.updatedAt).toLocaleString("ja-JP")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    データがありません
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-slate-500">
          © 2024 CSV Manager. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
