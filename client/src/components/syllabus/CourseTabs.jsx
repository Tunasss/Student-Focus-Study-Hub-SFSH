import { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../../i18n/languageContext';
import { formatCourseInfo } from '../../utils/courseFormat';

export function CourseTabs({ courses = [], activeCourseId, onSelectCourse }) {
  const { lang } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef(null);

  const t = {
    en: {
      selectCourse: 'Select Course',
      switchCourse: 'Switch Course',
      searchPlaceholder: 'Search course code or name…',
      activeBadge: 'Active',
      noCourses: 'No matching courses found',
      enrolledTotal: (count) => `${count} Enrolled Courses`,
      close: 'Close',
    },
    vi: {
      selectCourse: 'Chọn môn học',
      switchCourse: 'Đổi môn học',
      searchPlaceholder: 'Tìm theo mã hoặc tên môn học…',
      activeBadge: 'Đang chọn',
      noCourses: 'Không tìm thấy môn học phù hợp',
      enrolledTotal: (count) => `${count} Môn học đang đăng ký`,
      close: 'Đóng',
    },
  }[lang] || {
    selectCourse: 'Select Course',
    switchCourse: 'Switch Course',
    searchPlaceholder: 'Search course…',
    activeBadge: 'Active',
    noCourses: 'No courses found',
    enrolledTotal: (count) => `${count} Courses`,
    close: 'Close',
  };

  const activeCourse = courses.find((c) => c.id === activeCourseId) || courses[0];
  const activeFormatted = formatCourseInfo(activeCourse);

  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return courses;
    const q = searchQuery.toLowerCase();
    return courses.filter((c) => {
      const info = formatCourseInfo(c);
      return info.code.toLowerCase().includes(q) || info.name.toLowerCase().includes(q) || c.name.toLowerCase().includes(q);
    });
  }, [courses, searchQuery]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  if (!courses || courses.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Top Bar: Active Course Showcase & Dropdown Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 sm:p-4 rounded-2xl border border-border/80 bg-surface/70 shadow-xs relative">
        <div className="flex items-center gap-3 min-w-0">
          <span className="shrink-0 rounded-xl border border-primary/50 bg-primary/20 px-3 py-1.5 text-xs font-mono font-black text-primary tracking-wide shadow-xs">
            {activeFormatted.code}
          </span>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-text truncate">
              {activeFormatted.name}
            </h3>
            <span className="text-[11px] text-muted flex items-center gap-1.5 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {t.enrolledTotal(courses.length)}
            </span>
          </div>
        </div>

        {/* Dropdown / Menu Trigger Button */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-full sm:w-auto inline-flex items-center justify-between sm:justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-xs font-bold text-text shadow-xs hover:border-primary/50 hover:bg-surface/90 transition-all cursor-pointer"
          >
            <span>{t.switchCourse}</span>
            <span className="text-primary text-xs transition-transform duration-200">
              {isMenuOpen ? '▲' : '▼'}
            </span>
          </button>

          {/* Floating Course Selector Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-full sm:w-80 sm:max-w-md rounded-2xl border border-border bg-surface p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 space-y-2">
              {/* Search input */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  autoFocus
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                />
              </div>

              {/* Course list items */}
              <div className="max-h-60 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                {filteredCourses.length === 0 ? (
                  <p className="text-xs text-muted text-center py-4">{t.noCourses}</p>
                ) : (
                  filteredCourses.map((c) => {
                    const info = formatCourseInfo(c);
                    const isSelected = c.id === activeCourseId;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          onSelectCourse(c.id);
                          setIsMenuOpen(false);
                          setSearchQuery('');
                        }}
                        className={`w-full text-left rounded-xl p-2.5 flex items-center justify-between gap-2.5 transition-all cursor-pointer border ${
                          isSelected
                            ? 'border-primary/60 bg-primary/15 text-primary shadow-xs'
                            : 'border-transparent hover:bg-surface/90 text-text'
                        }`}
                      >
                        <div className="min-w-0 flex items-center gap-2">
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 ${
                              isSelected ? 'bg-primary/20 text-primary' : 'bg-border/60 text-muted'
                            }`}
                          >
                            {info.code}
                          </span>
                          <span className="text-xs font-semibold truncate">{info.name}</span>
                        </div>
                        {isSelected && (
                          <span className="text-[11px] font-bold text-primary shrink-0">✓</span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick-Switch Horizontal Course Pills (Easy 1-click access) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {courses.map((c) => {
          const info = formatCourseInfo(c);
          const isSelected = c.id === activeCourseId;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelectCourse(c.id)}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
                isSelected
                  ? 'border-primary/70 bg-primary/20 text-primary shadow-xs ring-1 ring-primary/40'
                  : 'border-border/60 bg-surface/80 text-muted hover:text-text hover:border-border hover:bg-surface'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full shrink-0 ${
                  isSelected ? 'bg-primary animate-pulse' : 'bg-muted/40'
                }`}
              />
              <span className="font-mono">{info.code}</span>
              <span className="text-[11px] opacity-75 hidden md:inline truncate max-w-[140px]">
                {info.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
