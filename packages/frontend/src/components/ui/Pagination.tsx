import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  lastPage: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function Pagination({
  currentPage,
  lastPage,
  onPageChange,
  className = '',
}: PaginationProps) {
  if (lastPage <= 1) return null;

  const getPages = () => {
    const pages: (number | string)[] = [];
    
    // Always show first page
    pages.push(1);

    if (currentPage > 3) {
      pages.push('...');
    }

    // Show pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(lastPage - 1, currentPage + 1); i++) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }

    if (currentPage < lastPage - 2) {
      pages.push('...');
    }

    // Always show last page if more than 1
    if (lastPage > 1) {
      pages.push(lastPage);
    }

    return pages;
  };

  return (
    <div className={`pagination ${className}`}>
      <button 
        className="p-btn" 
        disabled={currentPage <= 1} 
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeft size={16} />
      </button>

      {getPages().map((p, idx) => (
        <React.Fragment key={idx}>
          {typeof p === 'number' ? (
            <button
              className={`p-num ${currentPage === p ? 'active' : ''}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          ) : (
            <span className="p-dots">{p}</span>
          )}
        </React.Fragment>
      ))}

      <button 
        className="p-btn" 
        disabled={currentPage >= lastPage} 
        onClick={() => onPageChange(currentPage + 1)}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
