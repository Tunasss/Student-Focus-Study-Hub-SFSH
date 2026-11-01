import { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useLanguage } from '../i18n/languageContext';

const PAGE_COPY = {
  en: {
    titles: {
      overview: 'Overview',
      syllabus: 'Syllabus',
      deadlines: 'Deadlines',
      focus: 'Focus Room',
    },
    descriptions: {
      overview: 'Next study recommendations and focus rhythm analytics at a glance.',
      syllabus: 'Structured chapter breakdown and course mastery tracking.',
      deadlines: 'Upcoming assignment & project submission milestones.',
      focus: 'Botanical Pomodoro timer with ambient soundscapes.',
    },
    moduleReady: 'This feature is being prepared to deliver the best experience.',
    viewTimetable: 'View Weekly Timetable',
    bioBadge: 'AI BIO-RHYTHM ACTIVE',
    pillBio: '⚡ 98% Bio-Rhythm',
    pillStreak: '🔥 7-Day Study Streak',
    focusStatusLabel: 'Focus State',
    dailyGoal: 'Daily Goal',
    hoursDone: '3.5 / 4.0 hrs completed',
    pomoDesc: 'You have completed 7 effective Pomodoro sessions today. Productivity is at peak flow.',
    openFocus: 'Open Focus Room',
    cognitiveLabel: 'Cognitive Energy Level',
    cognitiveValue: 'High (Bio-Peak)',
    nextClassLabel: 'Next Class',
    nextClassName: 'Web Application Development',
    nextClassRoom: 'Room C206 • Periods 6-9',
    timetableBtn: 'Timetable',
    deadlineLabel: 'Upcoming Deadline',
    deadlineBadge: 'Due in 24h',
    deadlineDesc: 'Submit via university portal before 20:00 tonight.',
    deadlineBtn: 'Deadline Details',
    waveLabel: '7-Day Bio-Rhythm',
    waveTitle: 'Weekly Energy Distribution',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    aiLabel: 'AI Wellness Insight',
    aiUpdated: 'Just updated',
    aiTitle: 'Golden Window for Theory: 08:30 – 10:30',
    aiDesc:
      'Based on your last 10 Pomodoro sessions, cognitive focus peaks in the morning. Schedule Distributed Databases and Statistics during this window.',
    aiCtaPrimary: 'Enter Focus Room',
    aiCtaSecondary: 'View Syllabus',
    courses: [
      {
        code: 'MSIS207.R11.CTTT',
        name: 'Web Application Development',
        room: 'Room C206',
        progress: 0.88,
        percent: '88%',
        sessions: '14/16 sessions',
      },
      {
        code: 'CS5433.R11.CTTT',
        name: 'Distributed Databases',
        room: 'Room B5.04',
        progress: 0.76,
        percent: '76%',
        sessions: '12/16 sessions',
      },
      {
        code: 'STAT3013.R11.CTTT',
        name: 'Statistical Analysis',
        room: 'Room B5.04',
        progress: 0.82,
        percent: '82%',
        sessions: '13/16 sessions',
      },
      {
        code: 'MSIS4263.R11.CTTT',
        name: 'Intelligent Decision Support Apps',
        room: 'Room C211',
        progress: 0.7,
        percent: '70%',
        sessions: '11/16 sessions',
      },
    ],
  },
  vi: {
    titles: {
      overview: 'Tổng quan',
      syllabus: 'Đề cương',
      deadlines: 'Deadline',
      focus: 'Focus Room',
    },
    descriptions: {
      overview: 'Gợi ý học tiếp theo và thống kê thời gian tập trung sẽ hiển thị ở đây.',
      syllabus: 'Đọc đề cương thành danh sách chương.',
      deadlines: 'Theo dõi các hạn nộp sắp tới.',
      focus: 'Pomodoro với âm thanh nền.',
    },
    moduleReady: 'Tính năng đang được chuẩn bị để mang lại trải nghiệm tối ưu nhất.',
    viewTimetable: 'Xem Thời khóa biểu tuần',
    bioBadge: 'AI BIO-RHYTHM ACTIVE',
    pillBio: '⚡ 98% Nhịp sinh học',
    pillStreak: '🔥 Chuỗi 7 ngày học tập',
    focusStatusLabel: 'Trạng thái tập trung',
    dailyGoal: 'Mục tiêu ngày',
    hoursDone: '3.5 / 4.0 giờ đã hoàn thành',
    pomoDesc: 'Bạn đã hoàn thành 7 phiên Pomodoro hiệu quả trong ngày hôm nay. Năng suất ghi nhận ở mức tối ưu.',
    openFocus: 'Mở Focus Room',
    cognitiveLabel: 'Mức năng lượng nhận thức',
    cognitiveValue: 'Cao (Bio-Peak)',
    nextClassLabel: 'Lịch học tiếp theo',
    nextClassName: 'Phát triển ứng dụng web',
    nextClassRoom: 'Phòng C206 • Tiết 6-9',
    timetableBtn: 'Thời khóa biểu',
    deadlineLabel: 'Deadline sắp tới',
    deadlineBadge: 'Hạn chót 24h',
    deadlineDesc: 'Nộp qua portal bài tập trường trước 20:00 tối nay.',
    deadlineBtn: 'Chi tiết Deadline',
    waveLabel: 'Nhịp sinh học 7 ngày',
    waveTitle: 'Biểu đồ phân bổ năng lượng tuần',
    days: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
    aiLabel: 'Gợi ý AI Wellness',
    aiUpdated: 'Vừa cập nhật',
    aiTitle: 'Khung giờ vàng tiếp thu lý thuyết: 08:30 – 10:30',
    aiDesc:
      'Dựa trên dữ liệu 10 phiên Pomodoro gần nhất, mức độ tập trung của bạn đạt đỉnh cao nhất vào buổi sáng. Hãy sắp xếp môn Các hệ cơ sở dữ liệu phân tán và Phân tích thống kê vào khung giờ này.',
    aiCtaPrimary: 'Vào Focus Room ngay',
    aiCtaSecondary: 'Xem đề cương',
    courses: [
      {
        code: 'MSIS207.R11.CTTT',
        name: 'Phát triển ứng dụng web',
        room: 'Phòng C206',
        progress: 0.88,
        percent: '88%',
        sessions: '14/16 buổi',
      },
      {
        code: 'CS5433.R11.CTTT',
        name: 'Các hệ cơ sở dữ liệu phân tán',
        room: 'Phòng B5.04',
        progress: 0.76,
        percent: '76%',
        sessions: '12/16 buổi',
      },
      {
        code: 'STAT3013.R11.CTTT',
        name: 'Phân tích thống kê',
        room: 'Phòng B5.04',
        progress: 0.82,
        percent: '82%',
        sessions: '13/16 buổi',
      },
      {
        code: 'MSIS4263.R11.CTTT',
        name: 'Các ứng dụng thông minh và hỗ trợ ra quyết định',
        room: 'Phòng C211',
        progress: 0.7,
        percent: '70%',
        sessions: '11/16 buổi',
      },
    ],
  },
};

export function PlaceholderPage({ pageKey = 'overview', title, description }) {
  const { lang } = useLanguage();
  const t = PAGE_COPY[lang] || PAGE_COPY.en;

  const containerRef = useRef(null);
  const isOverview = pageKey === 'overview' || title === 'Tổng quan' || title === 'Overview';

  const resolvedTitle = t.titles[pageKey] || title;
  const resolvedDesc = t.descriptions[pageKey] || description;

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        '.bento-header',
        { y: -14, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.35, clearProps: 'opacity,visibility,transform' }
      );

      tl.fromTo(
        '.bento-card',
        { y: 18, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          stagger: 0.04,
          duration: 0.35,
          ease: 'power2.out',
          clearProps: 'opacity,visibility,transform',
        },
        '-=0.2'
      );

      gsap.fromTo(
        '.bento-progress-bar',
        { scaleX: 0, transformOrigin: 'left center' },
        {
          scaleX: (i, target) => Number(target.dataset.scale || 0.85),
          duration: 0.8,
          ease: 'power2.out',
          stagger: 0.05,
          delay: 0.1,
        }
      );

      gsap.fromTo(
        '.bento-wave-bar',
        { scaleY: 0, transformOrigin: 'bottom center' },
        {
          scaleY: 1,
          duration: 0.65,
          stagger: 0.04,
          ease: 'back.out(1.3)',
          delay: 0.15,
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [pageKey, title]);

  if (!isOverview) {
    return (
      <section ref={containerRef} className="space-y-6">
        <div className="bento-header flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>SFSH MODULE</span>
            </div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-text sm:text-4xl">{resolvedTitle}</h1>
          </div>
        </div>

        <div className="bento-card glass-card relative overflow-hidden rounded-3xl p-8 sm:p-12 text-center luma-glow-sm">
          <div className="relative z-10 max-w-md mx-auto space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary text-2xl">
              🌱
            </div>
            <p className="text-base font-medium text-text">{resolvedDesc}</p>
            <p className="text-xs text-muted">{t.moduleReady}</p>
            <div className="pt-2">
              <Link
                to="/timetable"
                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-fg shadow-sm luma-glow-sm hover:opacity-90 transition-opacity"
              >
                <span>{t.viewTimetable}</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={containerRef} className="space-y-7 pb-8">
      {/* Top Header & Ambient Greeting */}
      <div className="bento-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span>{t.bioBadge}</span>
          </div>
          <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-text">
            {resolvedTitle}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {resolvedDesc}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="glass-card inline-flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-semibold shadow-xs">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-text">{t.pillBio}</span>
          </div>
          <div className="glass-card inline-flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-semibold shadow-xs">
            <span className="text-text">{t.pillStreak}</span>
          </div>
        </div>
      </div>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Bento 1: Circular Focus Rhythm (Col-span 2) */}
        <div className="bento-card lg:col-span-2 glass-card relative overflow-hidden rounded-3xl p-6 sm:p-7 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">{t.focusStatusLabel}</span>
            <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
              Optimal Flow
            </span>
          </div>

          <div className="my-5 flex flex-col sm:flex-row items-center gap-6">
            <div className="relative flex h-32 w-32 shrink-0 items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" className="stroke-border/50" strokeWidth="8" fill="transparent" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-primary"
                  strokeWidth="8"
                  strokeDasharray="251.2"
                  strokeDashoffset="37.6"
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-black tracking-tight text-text">85%</span>
                <span className="text-[10px] text-muted uppercase font-bold">{t.dailyGoal}</span>
              </div>
            </div>

            <div className="space-y-2 text-center sm:text-left">
              <h3 className="text-lg font-bold text-text">{t.hoursDone}</h3>
              <p className="text-xs text-muted leading-relaxed">{t.pomoDesc}</p>
              <div className="pt-1">
                <Link
                  to="/focus"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline underline-offset-2"
                >
                  <span>{t.openFocus}</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-muted mb-1.5">
              <span>{t.cognitiveLabel}</span>
              <span className="text-text font-bold">{t.cognitiveValue}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-border/40 overflow-hidden">
              <div
                className="bento-progress-bar h-full w-full rounded-full bg-gradient-to-r from-primary to-emerald-400 origin-left will-change-transform"
                data-scale="0.85"
              />
            </div>
          </div>
        </div>

        {/* Bento 2: Next Class (Col-span 1) */}
        <div className="bento-card glass-card rounded-3xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">{t.nextClassLabel}</span>
            <span className="h-2 w-2 rounded-full bg-primary" />
          </div>

          <div className="my-4 space-y-2">
            <span className="inline-block rounded-md bg-primary/20 px-2 py-0.5 text-xs font-bold text-primary">
              MSIS207
            </span>
            <h4 className="text-base font-bold text-text leading-snug">{t.nextClassName}</h4>
            <div className="space-y-1 text-xs text-muted">
              <div className="flex items-center gap-1.5">
                <span>🕒</span>
                <span>13:00 – 16:15</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>📍</span>
                <span>{t.nextClassRoom}</span>
              </div>
            </div>
          </div>

          <Link
            to="/timetable"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-surface-2/80 py-2.5 px-4 text-xs font-bold text-text hover:bg-primary hover:text-primary-fg transition-colors"
          >
            <span>{t.timetableBtn}</span>
            <span>→</span>
          </Link>
        </div>

        {/* Bento 3: Upcoming Deadline (Col-span 1) */}
        <div className="bento-card glass-card rounded-3xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">{t.deadlineLabel}</span>
            <span className="rounded-full bg-danger/15 px-2 py-0.5 text-[10px] font-bold text-danger">
              {t.deadlineBadge}
            </span>
          </div>

          <div className="my-4 space-y-2">
            <span className="inline-block rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-500">
              CS101 Lab 3
            </span>
            <h4 className="text-base font-bold text-text leading-snug">Functions exercises</h4>
            <p className="text-xs text-muted">{t.deadlineDesc}</p>
          </div>

          <Link
            to="/deadlines"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-surface-2/80 py-2.5 px-4 text-xs font-bold text-text hover:bg-primary hover:text-primary-fg transition-colors"
          >
            <span>{t.deadlineBtn}</span>
            <span>→</span>
          </Link>
        </div>

        {/* Bento 4: Weekly Rhythm Energy Wave (Col-span 2) */}
        <div className="bento-card lg:col-span-2 glass-card rounded-3xl p-6 sm:p-7 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted">{t.waveLabel}</span>
              <h4 className="text-base font-bold text-text mt-0.5">{t.waveTitle}</h4>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/15 text-primary">
              26/10 – 01/11
            </span>
          </div>

          <div className="grid grid-cols-7 gap-3 h-28 items-end pt-3">
            {[
              { height: '65%', active: true },
              { height: '40%', active: false },
              { height: '90%', active: true },
              { height: '80%', active: true },
              { height: '55%', active: false },
              { height: '95%', active: true, today: true },
              { height: '30%', active: false },
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end">
                <div className="relative w-full rounded-xl bg-surface-2/50 overflow-hidden flex items-end h-20">
                  <div
                    className={`bento-wave-bar w-full rounded-xl will-change-transform ${
                      item.today
                        ? 'bg-primary luma-glow-sm'
                        : item.active
                        ? 'bg-primary/70'
                        : 'bg-muted/30'
                    }`}
                    style={{ height: item.height }}
                  />
                </div>
                <span className={`text-[11px] font-semibold ${item.today ? 'text-primary' : 'text-muted'}`}>
                  {t.days[idx]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bento 5: AI Study Recommendation (Col-span 2) */}
        <div className="bento-card lg:col-span-2 glass-card relative overflow-hidden rounded-3xl p-6 sm:p-7 flex flex-col justify-between luma-glow-sm">
          <div className="relative z-10 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <span>✨</span>
              <span>{t.aiLabel}</span>
            </span>
            <span className="text-xs text-muted">{t.aiUpdated}</span>
          </div>

          <div className="relative z-10 my-4 space-y-2">
            <h4 className="text-lg font-bold text-text">{t.aiTitle}</h4>
            <p className="text-xs text-muted leading-relaxed">{t.aiDesc}</p>
          </div>

          <div className="relative z-10 flex items-center gap-3">
            <Link
              to="/focus"
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-fg shadow-sm luma-glow-sm hover:opacity-90 transition-opacity"
            >
              <span>{t.aiCtaPrimary}</span>
              <span>→</span>
            </Link>
            <Link
              to="/syllabus"
              className="inline-flex items-center gap-2 rounded-2xl border border-border px-4 py-2.5 text-xs font-bold text-text hover:bg-surface-2 transition-colors"
            >
              <span>{t.aiCtaSecondary}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Synced Courses Progress Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {t.courses.map((course) => (
          <div key={course.code} className="bento-card glass-card rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-md bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                {course.code}
              </span>
              <span className="text-[11px] text-muted">{course.room}</span>
            </div>
            <h4 className="mt-2 text-xs font-bold text-text truncate">{course.name}</h4>
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-muted">{course.sessions}</span>
                <span className="font-bold text-primary">{course.percent}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-border/50 overflow-hidden">
                <div
                  className="bento-progress-bar h-full w-full rounded-full bg-primary origin-left will-change-transform"
                  data-scale={course.progress}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
