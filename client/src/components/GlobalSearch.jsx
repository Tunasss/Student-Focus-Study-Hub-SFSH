import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/languageContext';
import { searchApi } from '../lib/api';

const TYPE_META = {
  COURSE: {
    en: 'Course',
    vi: 'Môn học',
    badgeClass: 'border-primary/40 bg-primary/15 text-primary',
  },
  TASK: {
    en: 'Task',
    vi: 'Deadline',
    badgeClass: 'border-amber-400/40 bg-amber-400/15 text-amber-400',
  },
  TOPIC: {
    en: 'Topic',
    vi: 'Chủ đề',
    badgeClass: 'border-sky-400/40 bg-sky-400/15 text-sky-400',
  },
};

export function GlobalSearch() {
  const { lang } = useLanguage();
  const isVi = lang === 'vi';
  const navigate = useNavigate();

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const t = isVi
    ? {
        placeholder: 'Tìm môn, bài tập, chủ đề…',
        searching: 'Đang tìm kiếm…',
        noResults: 'Không tìm thấy kết quả phù hợp.',
        searchLabel: 'Tìm kiếm nhanh',
      }
    : {
        placeholder: 'Search courses, tasks, topics…',
        searching: 'Searching…',
        noResults: 'No matching courses, tasks, or topics.',
        searchLabel: 'Quick search',
      };

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    function handleGlobalKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    }
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search-as-you-type
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) return undefined;

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const list = await searchApi.suggest({ q: trimmed, limit: 8 });
        if (!cancelled) {
          setSuggestions(Array.isArray(list) ? list : []);
          setActiveIndex(-1);
        }
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  function handleSelect(item) {
    if (!item) return;
    setIsOpen(false);
    setQuery('');
    setSuggestions([]);

    if (item.courseId && typeof localStorage !== 'undefined') {
      localStorage.setItem('sfsh_active_course_id', String(item.courseId));
    }

    if (item.type === 'TASK') {
      navigate('/deadlines');
    } else {
      navigate('/syllabus');
    }
  }

  function handleKeyDown(e) {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setIsOpen(true);
    }

    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
      return;
    }

    if (suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0 && suggestions[activeIndex]) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    }
  }

  const showDropdown = isOpen && query.trim().length > 0;

  return (
    <div ref={containerRef} className="relative hidden xl:block w-56 2xl:w-64">
      <div className="relative flex items-center">
        <svg
          className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 18a7.5 7.5 0 006.15-3.35z" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          aria-label={t.searchLabel}
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            const val = e.target.value;
            setQuery(val);
            setIsOpen(true);
            if (!val.trim()) {
              setSuggestions([]);
              setLoading(false);
              setActiveIndex(-1);
            } else {
              setLoading(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={t.placeholder}
          className="w-full rounded-full border border-border bg-surface/90 pl-8 pr-10 py-1.5 text-xs text-text placeholder:text-muted/70 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
        />
        {!query && (
          <kbd className="pointer-events-none absolute right-2.5 hidden 2xl:inline-flex items-center rounded border border-border/80 bg-surface-2 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-muted">
            Ctrl K
          </kbd>
        )}
      </div>

      {showDropdown && (
        <div
          role="listbox"
          className="absolute right-0 mt-2 w-80 rounded-2xl border border-border bg-surface/95 backdrop-blur-xl shadow-2xl overflow-hidden z-50"
        >
          {loading ? (
            <div className="px-4 py-3 text-xs text-muted">{t.searching}</div>
          ) : suggestions.length === 0 ? (
            <div className="px-4 py-3 text-xs text-muted">{t.noResults}</div>
          ) : (
            <ul className="max-h-72 overflow-y-auto divide-y divide-border/40">
              {suggestions.map((item, idx) => {
                const meta = TYPE_META[item.type] || TYPE_META.COURSE;
                const isActive = idx === activeIndex;
                return (
                  <li key={`${item.type}-${item.id}`} role="option" aria-selected={isActive}>
                    <button
                      type="button"
                      onClick={() => handleSelect(item)}
                      className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between gap-2.5 transition-colors cursor-pointer ${
                        isActive ? 'bg-primary/15' : 'hover:bg-surface-2/80'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-text truncate">{item.label}</p>
                        {item.courseCode && (
                          <p className="text-[10px] font-mono text-muted truncate mt-0.5">
                            {item.courseCode}
                            {item.courseName && item.type !== 'COURSE' ? ` · ${item.courseName}` : ''}
                          </p>
                        )}
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${meta.badgeClass}`}
                      >
                        {isVi ? meta.vi : meta.en}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
