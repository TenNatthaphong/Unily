"use client";
import { useState } from 'react';
import {
  Calendar, Plus, Edit2, Trash2, X, Save, Clock, ChevronLeft, ChevronRight,
  Image as ImageIcon
} from 'lucide-react';
import { mockEvents, eventTypeConfig, type CalendarEvent } from "@/app/admin/components/admin-shared";

const eventTypes = ['registration', 'exam', 'holiday', 'event', 'deadline'] as const;

function EventForm({
  event,
  onSave,
  onCancel,
}: {
  event: CalendarEvent | null;
  onSave: (ev: CalendarEvent) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(event?.title ?? '');
  const [description, setDescription] = useState(event?.description ?? '');
  const [startDate, setStartDate] = useState(event?.startDate ?? '');
  const [endDate, setEndDate] = useState(event?.endDate ?? '');
  const [type, setType] = useState<string>(event?.type ?? 'event');
  const [bannerUrl, setBannerUrl] = useState(event?.bannerUrl ?? '');

  const handleSubmit = () => {
    if (!title || !startDate || !endDate) return;
    onSave({
      id: event?.id ?? `ev-${Date.now()}`,
      title,
      description,
      startDate,
      endDate,
      type: type as CalendarEvent['type'],
      bannerUrl: bannerUrl || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-card rounded-2xl p-6 w-full max-w-lg border border-border max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[18px]">{event ? 'แก้ไขกิจกรรม' : 'เพิ่มกิจกรรมใหม่'}</h3>
          <button onClick={onCancel} className="p-2 rounded-lg hover:bg-accent"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-[13px] text-muted-foreground">ชื่อกิจกรรม</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full mt-1 px-4 py-2.5 rounded-xl border-2 border-border bg-accent/30 focus:border-primary outline-none text-[14px]" placeholder="เช่น วันเปิดลงทะเบียน" />
          </div>
          <div>
            <label className="text-[13px] text-muted-foreground">รายละเอียด</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full mt-1 px-4 py-2.5 rounded-xl border-2 border-border bg-accent/30 focus:border-primary outline-none text-[14px] resize-none" placeholder="รายละเอียดเพิ่มเติม..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[13px] text-muted-foreground">วันเริ่มต้น</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full mt-1 px-4 py-2.5 rounded-xl border-2 border-border bg-accent/30 focus:border-primary outline-none text-[14px]" />
            </div>
            <div>
              <label className="text-[13px] text-muted-foreground">วันสิ้นสุด</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full mt-1 px-4 py-2.5 rounded-xl border-2 border-border bg-accent/30 focus:border-primary outline-none text-[14px]" />
            </div>
          </div>
          <div>
            <label className="text-[13px] text-muted-foreground">ประเภท</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {eventTypes.map(t => {
                const conf = eventTypeConfig[t];
                return (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`px-3 py-1.5 rounded-xl text-[12px] border-2 transition-all ${
                      type === t
                        ? `${conf.bg} ${conf.color} border-current`
                        : 'border-border hover:bg-accent'
                    }`}
                  >
                    {conf.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-[13px] text-muted-foreground flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5" />
              URL แบนเนอร์ (ไม่บังคับ)
            </label>
            <input value={bannerUrl} onChange={e => setBannerUrl(e.target.value)} className="w-full mt-1 px-4 py-2.5 rounded-xl border-2 border-border bg-accent/30 focus:border-primary outline-none text-[14px]" placeholder="https://..." />
          </div>
          <button
            onClick={handleSubmit}
            disabled={!title || !startDate || !endDate}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {event ? 'บันทึกการแก้ไข' : 'เพิ่มกิจกรรม'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>(mockEvents);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [viewMonth, setViewMonth] = useState(new Date(2026, 2)); // March 2026

  const filteredEvents = events
    .filter(e => typeFilter === 'all' || e.type === typeFilter)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const handleSave = (ev: CalendarEvent) => {
    setEvents(prev => {
      const idx = prev.findIndex(e => e.id === ev.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = ev;
        return updated;
      }
      return [...prev, ev];
    });
    setShowForm(false);
    setEditingEvent(null);
  };

  const handleDelete = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  // Calendar helpers
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.startDate <= dateStr && e.endDate >= dateStr);
  };

  const monthNames = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  const dayNames = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[24px]">ปฏิทินกิจกรรม</h1>
          <p className="text-[14px] text-muted-foreground mt-1">จัดการกำหนดการ ประชาสัมพันธ์ แบนเนอร์</p>
        </div>
        <button
          onClick={() => { setEditingEvent(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
        >
          <Plus className="w-5 h-5" />
          เพิ่มกิจกรรม
        </button>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Calendar View */}
        <div className="lg:col-span-3 bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setViewMonth(new Date(year, month - 1))} className="p-2 rounded-xl hover:bg-accent"><ChevronLeft className="w-5 h-5" /></button>
            <h3 className="text-[16px]">{monthNames[month]} {year + 543}</h3>
            <button onClick={() => setViewMonth(new Date(year, month + 1))} className="p-2 rounded-xl hover:bg-accent"><ChevronRight className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {dayNames.map(d => (
              <div key={d} className="text-center text-[11px] text-muted-foreground py-2">{d}</div>
            ))}
            {calendarDays.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} />;
              const dayEvents = getEventsForDay(day);
              const isToday = day === 11 && month === 2 && year === 2026;
              return (
                <div
                  key={day}
                  className={`relative p-1.5 min-h-[60px] rounded-xl border transition-all ${
                    isToday ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-accent/30'
                  }`}
                >
                  <span className={`text-[12px] ${isToday ? 'text-primary font-bold' : ''}`}>{day}</span>
                  <div className="space-y-0.5 mt-0.5">
                    {dayEvents.slice(0, 2).map(ev => {
                      const conf = eventTypeConfig[ev.type];
                      return (
                        <div key={ev.id} className={`text-[8px] px-1 py-0.5 rounded ${conf.bg} ${conf.color} truncate`}>
                          {ev.title}
                        </div>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <span className="text-[8px] text-muted-foreground">+{dayEvents.length - 2}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Event List */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border flex flex-col max-h-[600px]">
          <div className="p-4 border-b border-border">
            <h3 className="text-[16px] mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              รายการกิจกรรม
            </h3>
            <div className="flex gap-1 flex-wrap">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-2.5 py-1 rounded-full text-[10px] border transition-all ${typeFilter === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent'}`}
              >ทั้งหมด</button>
              {eventTypes.map(t => {
                const conf = eventTypeConfig[t];
                return (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={`px-2.5 py-1 rounded-full text-[10px] border transition-all ${typeFilter === t ? `${conf.bg} ${conf.color} border-current` : 'border-border hover:bg-accent'}`}
                  >
                    {conf.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredEvents.map(ev => {
              const conf = eventTypeConfig[ev.type];
              return (
                <div key={ev.id} className="p-3 rounded-xl bg-accent/30 border border-border/50 hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${conf.bg} ${conf.color}`}>{conf.label}</span>
                      </div>
                      <p className="text-[13px] mt-1 truncate">{ev.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{ev.description}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(ev.startDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                        {ev.startDate !== ev.endDate && ` — ${new Date(ev.endDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}`}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => { setEditingEvent(ev); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-accent text-primary"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(ev.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showForm && (
        <EventForm
          event={editingEvent}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingEvent(null); }}
        />
      )}
    </div>
  );
}
