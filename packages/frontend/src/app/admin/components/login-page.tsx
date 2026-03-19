"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import svgPaths from "@/app/admin/imports/svg-u8ep38b9zx";

import { Eye, EyeOff, Mail, Lock, Sun, Moon } from 'lucide-react';
import { motion } from 'motion/react';
import imgFrame641 from "figma:asset/71a81c9a0267dd8c168553b171f7c35d9828d29d.png";
import { useAuth } from "@/app/admin/components/auth-context";
import { useTheme } from "@/components/ui/theme-provider";

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate loading
    await new Promise(r => setTimeout(r, 600));

    const result = login(email, password);
    setIsLoading(false);

    if (result.success && result.role) {
      router.push(`/${result.role}`);
    } else {
      setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 font-['Inter',sans-serif] relative">
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-3 rounded-full bg-card border border-border hover:bg-accent transition-colors z-10"
      >
        {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex bg-card rounded-[40px] shadow-2xl overflow-hidden max-w-[1050px] w-full min-h-[600px] border border-border/50"
      >
        {/* Left Side - Image */}
        <div className="hidden lg:block relative w-[480px] shrink-0">
          <div className="absolute inset-0 bg-primary rounded-[35px] m-3">
            <img
              src={imgFrame641 as any}
              alt="Student illustration"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
          {/* Logo overlay */}
          <div className="absolute top-10 left-10 z-10">
            <svg width="80" height="61" viewBox="0 0 98 75" fill="none">
              <g>
                <path d={svgPaths.p3f562b00} fill="white" />
                <path d={svgPaths.p1d4ed2f0} fill="white" />
                <path d={svgPaths.p3f8ed100} fill="white" />
                <path d={svgPaths.p2d451180} fill="white" />
              </g>
            </svg>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 lg:px-16">
          {/* Logo for mobile */}
          <div className="lg:hidden mb-6">
            <svg width="120" height="91" viewBox="0 0 229.5 174.668" fill="none">
              <g>
                <path d={svgPaths.pd4eca80} fill="var(--primary)" />
                <path d={svgPaths.p3b2077f0} fill="var(--primary)" />
                <path d={svgPaths.p8857e00} fill="var(--primary)" />
                <path d={svgPaths.p18d81d00} fill="var(--primary)" />
              </g>
            </svg>
          </div>

          {/* Desktop Logo */}
          <div className="hidden lg:block mb-8">
            <svg width="160" height="122" viewBox="0 0 229.5 174.668" fill="none">
              <g>
                <path d={svgPaths.pd4eca80} fill="var(--primary)" />
                <path d={svgPaths.p3b2077f0} fill="var(--primary)" />
                <path d={svgPaths.p8857e00} fill="var(--primary)" />
                <path d={svgPaths.p18d81d00} fill="var(--primary)" />
              </g>
            </svg>
          </div>

          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-[24px] mb-2 text-center"
          >
            ยินดีต้อนรับ
          </motion.h2>
          <p className="text-[14px] text-muted-foreground mb-8 text-center">
            เข้าสู่ระบบเพื่อจัดการการลงทะเบียนเรียน
          </p>

          <form onSubmit={handleSubmit} className="w-full max-w-[380px] space-y-5">
            {/* Email */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="อีเมล หรือ ชื่อผู้ใช้..."
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-accent/50 border-2 border-border focus:border-primary focus:bg-card transition-all outline-none text-[14px] placeholder:text-muted-foreground"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="รหัสผ่าน..."
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-accent/50 border-2 border-border focus:border-primary focus:bg-card transition-all outline-none text-[14px] placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[13px] text-destructive text-center"
              >
                {error}
              </motion.p>
            )}

            <div className="flex justify-end">
              <button type="button" className="text-[13px] text-primary hover:underline">
                ลืมรหัสผ่าน?
              </button>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50 text-[15px] flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'เข้าสู่ระบบ'
              )}
            </motion.button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8 text-center">
            <p className="text-[12px] text-muted-foreground mb-3">ทดลองเข้าระบบ</p>
            <div className="flex gap-2 flex-wrap justify-center">
              {[
                { label: 'นักศึกษา', email: 'student01' },
                { label: 'อาจารย์', email: 'prof01' },
                { label: 'แอดมิน', email: 'admin01' },
              ].map(acc => (
                <button
                  key={acc.email}
                  onClick={() => { setEmail(acc.email); setPassword('demo'); }}
                  className="px-4 py-1.5 text-[12px] rounded-full border border-border hover:bg-accent hover:border-primary/50 transition-all"
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
