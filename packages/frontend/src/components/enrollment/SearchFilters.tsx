import { Search, Filter } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import './SearchFilters.css';

interface SearchFiltersProps {
  onSearch: (q: string) => void;
  onFilterChange: (filters: any) => void;
}

export default function SearchFilters({ onSearch, onFilterChange }: SearchFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="search-filters-bar card">
      <div className="search-input-wrapper">
        <Search className="search-icon" size={20} />
        <input
          type="text"
          className="search-input"
          placeholder={t('common.search')}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      <div className="filters-row">
        <div className="filter-group">
          <label className="filter-label"><Filter size={14} /> {t('nav.faculties')}</label>
          <select className="filter-select" onChange={(e) => onFilterChange({ facultyId: e.target.value })}>
            <option value="">All Faculties</option>
            {/* ... Options will be fetched in Page ... */}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label"><Filter size={14} /> {t('nav.departments')}</label>
          <select className="filter-select" onChange={(e) => onFilterChange({ deptId: e.target.value })}>
            <option value="">All Departments</option>
          </select>
        </div>
      </div>
    </div>
  );
}
