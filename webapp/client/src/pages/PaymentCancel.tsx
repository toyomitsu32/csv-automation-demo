import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle } from "lucide-react";
import { Link } from "wouter";

export default function PaymentCancel() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
      <Card className="max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-orange-100 rounded-full">
              <XCircle className="h-12 w-12 text-orange-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">決済がキャンセルされました</CardTitle>
          <CardDescription>
            決済処理がキャンセルされました。再度お試しいただけます。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            ご不明な点がございましたら、お気軽にお問い合わせください。
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link href="/payment">決済ページに戻る</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">ホームに戻る</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
