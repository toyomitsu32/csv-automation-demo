import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";

import { CreditCard, ArrowLeft, Check, Clock, XCircle, ShoppingBag, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function Payment() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const { data: subscriptionData, isLoading: subLoading, refetch: refetchSub } = trpc.stripe.getSubscriptionStatus.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: paymentHistory, isLoading: historyLoading, refetch: refetchHistory } = trpc.stripe.getPaymentHistory.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const checkoutMutation = trpc.stripe.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        toast.info("決済ページに移動します...");
        window.open(data.url, "_blank");
      }
    },
    onError: (error) => {
      toast.error(`エラー: ${error.message}`);
    },
  });

  const cancelMutation = trpc.stripe.cancelSubscription.useMutation({
    onSuccess: () => {
      toast.success("サブスクリプションをキャンセルしました");
      refetchSub();
    },
    onError: (error) => {
      toast.error(`エラー: ${error.message}`);
    },
  });

  const handlePurchase = (productKey: "CSV_EXPORT_PREMIUM" | "CSV_SUBSCRIPTION") => {
    checkoutMutation.mutate({ productKey });
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
              決済機能を利用するには、ログインしてください。
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "succeeded":
        return <Badge className="bg-green-100 text-green-800"><Check className="h-3 w-3 mr-1" />成功</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />処理中</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />失敗</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

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
              <CreditCard className="h-6 w-6 text-purple-600" />
              <h1 className="text-lg font-bold text-slate-800">決済・サブスクリプション</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Subscription Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              サブスクリプション状態
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subLoading ? (
              <div className="animate-pulse h-8 bg-slate-200 rounded w-32"></div>
            ) : subscriptionData?.status === "active" ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800">
                    <Check className="h-3 w-3 mr-1" />
                    アクティブ
                  </Badge>
                  <span className="text-sm text-slate-600">
                    CSV Manager Pro サブスクリプション
                  </span>
                </div>
                {subscriptionData.subscription?.currentPeriodEnd && (
                  <p className="text-sm text-slate-500">
                    次回請求日: {new Date(subscriptionData.subscription.currentPeriodEnd).toLocaleDateString("ja-JP")}
                  </p>
                )}
                {subscriptionData.subscription?.cancelAtPeriodEnd && (
                  <p className="text-sm text-orange-600">
                    期間終了時にキャンセル予定
                  </p>
                )}
                {!subscriptionData.subscription?.cancelAtPeriodEnd && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => cancelMutation.mutate()}
                    disabled={cancelMutation.isPending}
                  >
                    サブスクリプションをキャンセル
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-slate-500">アクティブなサブスクリプションはありません</p>
            )}
          </CardContent>
        </Card>

        {/* Products */}
        <h2 className="text-xl font-bold text-slate-800 mb-4">製品・サービス</h2>
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* One-time Purchase */}
          <Card className="border-2 hover:border-blue-300 transition-colors">
            <CardHeader>
              <CardTitle>CSV Export Premium</CardTitle>
              <CardDescription>プレミアムCSVエクスポート機能へのアクセス</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <span className="text-3xl font-bold">¥1,000</span>
                <span className="text-slate-500 ml-2">（一回払い）</span>
              </div>
              <ul className="text-sm text-slate-600 space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  高度なエクスポートオプション
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  カスタムフォーマット対応
                </li>
              </ul>
              <Button 
                className="w-full" 
                onClick={() => handlePurchase("CSV_EXPORT_PREMIUM")}
                disabled={checkoutMutation.isPending}
              >
                購入する
              </Button>
            </CardContent>
          </Card>

          {/* Subscription */}
          <Card className="border-2 border-purple-200 hover:border-purple-400 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>CSV Manager Pro</CardTitle>
                <Badge className="bg-purple-100 text-purple-800">おすすめ</Badge>
              </div>
              <CardDescription>月額サブスクリプション - 無制限のCSV操作</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <span className="text-3xl font-bold">¥500</span>
                <span className="text-slate-500 ml-2">/ 月</span>
              </div>
              <ul className="text-sm text-slate-600 space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  無制限のCSVアップロード
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  優先サポート
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  高度な分析機能
                </li>
              </ul>
              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700" 
                onClick={() => handlePurchase("CSV_SUBSCRIPTION")}
                disabled={checkoutMutation.isPending || subscriptionData?.status === "active"}
              >
                {subscriptionData?.status === "active" ? "登録済み" : "サブスクリプション開始"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>決済履歴</CardTitle>
              <Button variant="outline" size="sm" onClick={() => refetchHistory()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                更新
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse h-12 bg-slate-200 rounded"></div>
                ))}
              </div>
            ) : paymentHistory && paymentHistory.length > 0 ? (
              <div className="space-y-3">
                {paymentHistory.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-800">
                        ¥{payment.amount.toLocaleString()} {payment.currency.toUpperCase()}
                      </p>
                      <p className="text-sm text-slate-500">
                        {new Date(payment.createdAt).toLocaleString("ja-JP")}
                      </p>
                    </div>
                    {getStatusBadge(payment.status)}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-slate-500">決済履歴はありません</p>
            )}
          </CardContent>
        </Card>

        {/* Test Card Info */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">テスト用カード情報</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-700 mb-2">
              テスト決済には以下のカード番号を使用してください：
            </p>
            <code className="bg-white px-3 py-2 rounded border text-blue-800 font-mono">
              4242 4242 4242 4242
            </code>
            <p className="text-sm text-blue-600 mt-2">
              有効期限: 任意の将来の日付 / CVC: 任意の3桁
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
