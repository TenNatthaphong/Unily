import { useRouter } from 'next/navigation';

import { Home } from 'lucide-react';

export function NotFound() {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <p className="text-[72px] text-primary opacity-20">404</p>
      <p className="text-[18px] text-muted-foreground">ไม่พบหน้าที่ต้องการ</p>
      <button
        onClick={() => router.push('/')}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all"
      >
        <Home className="w-4 h-4" />
        กลับหน้าหลัก
      </button>
    </div>
  );
}
