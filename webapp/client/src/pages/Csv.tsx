import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";

import { Download, Upload, FileSpreadsheet, ArrowLeft, RefreshCw } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useRef } from "react";
import { toast } from "sonner";

export default function Csv() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: csvData, isLoading, refetch } = trpc.csv.getData.useQuery(undefined, {
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

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>ログインが必要です</CardTitle>
            <CardDescription>
              CSVファイルの操作を行うには、ログインしてください。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full">
              <Link href="/login">ログインする</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">ホームに戻る</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                戻る
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-6 w-6 text-blue-600" />
              <h1 className="text-lg font-bold text-slate-800">CSVデータ管理</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Actions */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Card className="flex-1 min-w-[250px]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Download className="h-5 w-5 text-green-600" />
                CSVダウンロード
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={handleDownload} className="w-full" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                ダウンロード
              </Button>
            </CardContent>
          </Card>

          <Card className="flex-1 min-w-[250px]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="h-5 w-5 text-blue-600" />
                CSVアップロード
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                disabled={uploading}
                className="cursor-pointer"
              />
              {uploading && (
                <p className="text-sm text-slate-500 mt-2">アップロード中...</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>現在のデータ</CardTitle>
                <CardDescription>
                  データベースに保存されているCSVデータ
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                更新
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : csvData && csvData.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead>更新日時</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvData.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.id}</TableCell>
                        <TableCell>{row.product}</TableCell>
                        <TableCell className="text-right">{row.quantity}</TableCell>
                        <TableCell className="text-right">¥{Number(row.price).toLocaleString()}</TableCell>
                        <TableCell className="text-slate-500 text-sm">
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
      </main>
    </div>
  );
}
