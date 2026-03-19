"use client";
import { useState } from 'react';
import { useNavigate } from 'react-router';

import {
  BookOpen, Users, FileText, Calendar, TrendingUp, UserCheck,
  Clock, Plus, Edit2, Trash2, Settings, CheckCircle, Shield,
  ChevronRight, ArrowRight, CircleDot
} from 'lucide-react';
import {
  mockActivities, mockRoadmap, eventTypeConfig,
  type ActivityType,
} from "@/app/admin/components/admin-shared";

const actionConfig: Record<ActivityType, { icon: React.ReactNode; color: string; bg: string }> = {
  create: { icon: <Plus className="w-3.5 h-3.5" />, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  update: { icon: <Edit2 className="w-3.5 h-3.5" />, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  delete: { icon: <Trash2 className="w-3.5 h-3.5" />, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
  config: { icon: <Settings className="w-3.5 h-3.5" />, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  approve: { icon: <CheckCircle className="w-3.5 h-3.5" />, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
};

const actionLabel: Record<ActivityType, string> = {
  create: 'สร้าง',
  update: 'แก้ไข',
  delete: 'ลบ',
  config: 'ตั้งค่า',
  approve: 'อนุมัติ',
};

export function AdminDashboard() {
  const navigate = useNavigate();
  const [activityFilter, setActivityFilter] = useState<ActivityType | 'all'>('all');

  const stats = [
    { label: 'หลักสูตรทั้งหมด', value: '3', icon: <FileText className="w-6 h-6" />, color: 'bg-primary/10 text-primary', path: '/admin/curricula' },
    { label: 'รายวิชาทั้งหมด', value: '16', icon: <BookOpen className="w-6 h-6" />, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', path: '/admin/courses' },
    { label: 'นักศึกษา', value: '1,245', icon: <Users className="w-6 h-6" />, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400', path: '/admin/users?role=student' },
    { label: 'อาจารย์', value: '48', icon: <UserCheck className="w-6 h-6" />, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', path: '/admin/users?role=professor' },
  ];

  const filteredActivities = activityFilter === 'all'
    ? mockActivities
    : mockActivities.filter(a => a.action === activityFilter);

  // Group activities by date
  const groupedActivities = filteredActivities.reduce((acc, a) => {
    const dateLabel = a.date === '2026-03-11' ? 'วันนี้' : a.date === '2026-03-10' ? 'เมื่อวาน' : a.date;
    if (!acc[dateLabel]) acc[dateLabel] = [];
    acc[dateLabel].push(a);
    return acc;
  }, {} as Record<string, typeof mockActivities>);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-[24px]">แดชบอร์ดผู้ดูแลระบบ</h1>
        <p className="text-[14px] text-muted-foreground mt-1">ภาพรวมระบบลงทะเบียนเรียน UNIy — วันพุธที่ 11 มีนาคม 2569</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div
            key={s.label}
            onClick={() => navigate(s.path)}
            className="bg-card rounded-2xl p-5 border border-border hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className={`inline-flex p-3 rounded-xl ${s.color}`}>{s.icon}</div>
              <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-[24px] mt-3">{s.value}</p>
            <p className="text-[13px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Activity Log - 3 cols */}
        <div className="lg:col-span-3 bg-card rounded-2xl border border-border flex flex-col max-h-[600px]">
          <div className="p-5 pb-3 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[18px] flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                กิจกรรมล่าสุด
              </h3>
            </div>
            {/* Filter chips */}
            <div className="flex gap-1.5 flex-wrap">
              {(['all', 'create', 'update', 'delete', 'config', 'approve'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setActivityFilter(f)}
                  className={`px-3 py-1 rounded-full text-[11px] border transition-all ${
                    activityFilter === f
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border hover:bg-accent'
                  }`}
                >
                  {f === 'all' ? 'ทั้งหมด' : actionLabel[f]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {Object.entries(groupedActivities).map(([dateLabel, activities]) => (
              <div key={dateLabel}>
                <p className="text-[11px] text-muted-foreground mb-2 px-1 sticky top-0 bg-card">{dateLabel}</p>
                <div className="space-y-2">
                  {activities.map(a => {
                    const ac = actionConfig[a.action];
                    return (
                      <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl bg-accent/30 hover:bg-accent/50 transition-colors">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${ac.bg} ${ac.color}`}>
                          {ac.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] leading-relaxed">{a.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1">
                              <Shield className="w-3 h-3 text-muted-foreground" />
                              <span className="text-[11px] text-primary">{a.adminName}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground">•</span>
                            <span className="text-[11px] text-muted-foreground">{a.timestamp}</span>
                            <span className="text-[10px] text-muted-foreground">•</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${ac.bg} ${ac.color}`}>
                              {actionLabel[a.action]}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Roadmap - 2 cols */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border flex flex-col max-h-[600px]">
          <div className="p-5 pb-3 border-b border-border">
            <h3 className="text-[18px] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Roadmap ภาคเรียน
            </h3>
            <p className="text-[12px] text-muted-foreground mt-1">กำหนดการสำคัญ 2/2568 — 1/2569</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-border" />
              <div className="space-y-4">
                {mockRoadmap.map((item, idx) => {
                  const evConf = eventTypeConfig[item.type] ?? eventTypeConfig.event;
                  const isToday = item.date === '2026-03-11';
                  return (
                    <div key={item.id} className="flex items-start gap-3 relative">
                      <div className={`w-[30px] h-[30px] rounded-full flex items-center justify-center z-10 shrink-0 border-2 ${
                        item.done
                          ? 'bg-success border-success text-white'
                          : isToday
                            ? 'bg-primary border-primary text-white animate-pulse'
                            : `${evConf.bg} border-border`
                      }`}>
                        {item.done ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <CircleDot className={`w-4 h-4 ${evConf.color}`} />
                        )}
                      </div>
                      <div className={`flex-1 p-3 rounded-xl border transition-all ${
                        item.done ? 'bg-muted/30 border-border/50 opacity-60' : 'bg-accent/30 border-border hover:bg-accent/50'
                      }`}>
                        <div className="flex items-start justify-between">
                          <p className={`text-[13px] ${item.done ? 'line-through' : ''}`}>{item.title}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ml-2 ${evConf.bg} ${evConf.color}`}>
                            {evConf.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {new Date(item.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-border">
            <button
              onClick={() => navigate('/admin/calendar')}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-border hover:bg-accent transition-colors text-[13px]"
            >
              <Calendar className="w-4 h-4" />
              ดูปฏิทินกิจกรรมทั้งหมด
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Enrollment Stats */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <h3 className="text-[18px] mb-4">สถิติการลงทะเบียนเรียน (Mock)</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'CS101 — Intro to Programming', enrolled: 163, capacity: 180 },
            { label: 'CS102 — Data Structures', enrolled: 80, capacity: 100 },
            { label: 'CS201 — Algorithms', enrolled: 38, capacity: 50 },
            { label: 'CS202 — Database Systems', enrolled: 42, capacity: 50 },
            { label: 'MATH101 — Calculus I', enrolled: 137, capacity: 160 },
            { label: 'GEN101 — English I', enrolled: 87, capacity: 100 },
          ].map(c => {
            const pct = Math.round(c.enrolled / c.capacity * 100);
            const isFull = pct >= 95;
            return (
              <div key={c.label} className="p-4 rounded-xl bg-accent/30 border border-border/50">
                <div className="flex justify-between text-[12px] mb-2">
                  <span className="truncate pr-2">{c.label}</span>
                  <span className={`shrink-0 ${isFull ? 'text-red-500' : 'text-muted-foreground'}`}>
                    {c.enrolled}/{c.capacity}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-accent overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isFull ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-primary'}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{pct}% {isFull ? '— เกือบเต็ม!' : ''}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
