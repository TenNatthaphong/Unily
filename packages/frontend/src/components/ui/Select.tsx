import { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface SelectProps {
  value: string;
  onChange: (val: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  autoWidth?: boolean;
}

export function Select({ value, onChange, options, placeholder = "Select...", className = "", disabled, autoWidth }: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const selectedTitle = options.find(o => o.value === value)?.label || placeholder;

  return (
    <div className={`unily-select-wrapper ${className}`} ref={ref} style={{ position: 'relative', width: autoWidth ? 'max-content' : '100%', minWidth: '140px' }}>
      
      {autoWidth && (
        <div aria-hidden="true" style={{ visibility: 'hidden', height: 0, overflow: 'hidden', whiteSpace: 'nowrap', fontSize: '0.875rem', fontWeight: 500, padding: '0 36px' }}>
          {options.map(o => (<div key={`meas-${o.value}`}>{o.label}</div>))}
          <div>{placeholder}</div>
        </div>
      )}

      <button 
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className="unily-select-trigger"
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
          padding: '0 14px', height: '44px', background: 'var(--bg-input, var(--bg-card))',
          border: open ? '1px solid var(--primary)' : '1px solid var(--border)', 
          boxShadow: open ? '0 0 0 3px rgba(59,130,246,0.1)' : 'none',
          borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
          cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1, 
          fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 500,
          transition: 'all 0.2s ease'
        }}
      >
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedTitle}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} color="var(--text-muted)" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
           <motion.div
             initial={{ opacity: 0, y: -6, scale: 0.98 }} 
             animate={{ opacity: 1, y: 0, scale: 1 }} 
             exit={{ opacity: 0, y: -6, scale: 0.98 }}
             transition={{ type: 'spring', stiffness: 400, damping: 30 }}
             className="unily-select-menu"
             style={{
               position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 9999,
               background: 'var(--bg-elevated, var(--bg-card))', border: '1px solid var(--border)',
               borderRadius: 'var(--radius-md)', padding: '6px', boxShadow: 'var(--shadow-lg)',
               maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px'
             }}
           >
             {options.map(o => {
               const isActive = o.value === value;
               return (
                 <button type="button" key={o.value} onClick={() => { onChange(o.value); setOpen(false); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
                      padding: '10px 12px', background: isActive ? 'var(--primary-mild)' : 'transparent',
                      border: 'none', color: isActive ? 'var(--primary)' : 'var(--text-primary)',
                      borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.875rem', 
                      fontWeight: isActive ? 600 : 400, textAlign: 'left', transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => { if(!isActive) e.currentTarget.style.background = 'rgba(128,128,128,0.1)'; }}
                    onMouseLeave={(e) => { if(!isActive) e.currentTarget.style.background = 'transparent'; }}
                 >
                   <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                     {o.icon && <span style={{ color: isActive ? 'var(--primary)' : 'var(--text-muted)' }}>{o.icon}</span>}
                     {o.label}
                   </span>
                   {isActive && <Check size={15} />}
                 </button>
               )
             })}
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
