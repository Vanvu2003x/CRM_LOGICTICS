"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Key, Mail, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { checkLogin } from "./actions";
import { useUserContext } from "@/components/auth/UserContext";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { setCurrentUser } = useUserContext();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);

    const res = await checkLogin(email, password);
    setLoading(false);

    if (res.success && res.user) {
      setCurrentUser(res.user);
      router.push("/dashboard");
      router.refresh();
    } else {
      setError(res.error || "Email không hợp lệ. Vui lòng thử lại.");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      
      {/* Abstract Background Shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.02)_0%,transparent_100%)]" />

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-[420px] px-4">
        
        <div className="flex flex-col items-center mb-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-center size-14 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl shadow-lg shadow-blue-500/30 mb-4 border border-white/10">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Logistics CRM</h1>
          <p className="text-blue-200 mt-2 text-sm font-medium">Hệ thống quản lý vận hành chuyên nghiệp</p>
        </div>

        <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-white/95 backdrop-blur-xl ring-1 ring-white/50 animate-in zoom-in-95 duration-500">
          <CardHeader className="pb-6 pt-8 text-center space-y-2 border-b border-slate-100/60 bg-white/50">
            <CardTitle className="text-xl font-bold text-slate-800">Đăng nhập</CardTitle>
            <CardDescription className="text-slate-500 text-sm font-medium">
              Sử dụng email nội bộ để truy cập
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-8 pt-6 bg-white/40">
            <form onSubmit={handleLogin} className="space-y-5">
              
              {error && (
                <Alert variant="destructive" className="bg-rose-50/80 border-rose-200/50 text-rose-800 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <AlertDescription className="text-xs font-semibold">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-bold text-slate-700 ml-1">Tài khoản Email</Label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="h-4.5 w-4.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <Input 
                      id="email" autoComplete="username" 
                      type="email" 
                      required 
                      placeholder="tenban@company.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-11 h-12 rounded-xl bg-white/70 border-slate-200/80 text-slate-900 font-medium placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-bold text-slate-700 ml-1">Mật khẩu</Label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Key className="h-4.5 w-4.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <Input 
                      id="password" autoComplete="current-password" 
                      type="password" 
                      required 
                      placeholder="Nhập mật khẩu..." 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-11 h-12 rounded-xl bg-white/70 border-slate-200/80 text-slate-900 font-medium placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent transition-all shadow-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3">
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98]"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang xác thực...
                    </span>
                  ) : (
                    "Đăng Nhập Ngay"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-xs text-slate-400/80 font-medium flex items-center justify-center gap-2">
          <span>&copy; {new Date().getFullYear()} CRM Platform</span>
          <span>•</span>
          <span>Bảo mật nội bộ</span>
        </div>
      </div>
    </div>
  );
}
