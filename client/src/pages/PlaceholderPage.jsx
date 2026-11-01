import { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';

const COURSE_MASTERY = [
  {
    code: 'MSIS207.R11.CTTT',
    name: 'Phát triển ứng dụng web',
    room: 'Phòng C206',
    progress: 0.88,
    percent: '88%',
    sessions: '14/16 buổi',
    status: 'Đạt chuẩn cao',
  },
  {
    code: 'CS5433.R11.CTTT',
    name: 'Các hệ cơ sở dữ liệu phân tán',
    room: 'Phòng B5.04',
    progress: 0.76,
    percent: '76%',
    sessions: '12/16 buổi',
    status: 'Đang tăng tốc',
  },
  {
    code: 'STAT3013.R11.CTTT',
    name: 'Phân tích thống kê',
    room: 'Phòng B5.04',
    progress: 0.82,
    percent: '82%',
    sessions: '13/16 buổi',
    status: 'Ổn định',
  },
  {
    code: 'MSIS4263.R11.CTTT',
    name: 'Các ứng dụng thông minh và hỗ trợ ra quyết định',
    room: 'Phòng C211',
    progress: 0.7,
    percent: '70%',
    sessions: '11/16 buổi',
    status: 'Đúng tiến độ',
  },
];

export function PlaceholderPage({ title, description }) {
  const containerRef = useRef(null);
  const isOverview = title === 'Tổng quan';

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        '.bento-header',
        { y: -16, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.4, clearProps: 'opacity,visibility,transform' }
      );

      tl.fromTo(
        '.bento-card',
        { y: 22, autoAlpha: 0, scale: 0.98 },
        {
          y: 0,
          autoAlpha: 1,
          scale: 1,
          stagger: 0.05,
          duration: 0.42,
          ease: 'power2.out',
          clearProps: 'opacity,visibility,transform',
        },
        '-=0.2'
      );

      // GPU-composited progress bars using scaleX (never animate width)
      gsap.fromTo(
        '.bento-progress-bar',
        { scaleX: 0, transformOrigin: 'left center' },
        {
          scaleX: (i, target) => Number(target.dataset.scale || 0.85),
          duration: 0.9,
          ease: 'power2.out',
          stagger: 0.06,
          delay: 0.15,
        }
      );

      // GPU-composited weekly wave bars using scaleY
      gsap.fromTo(
        '.bento-wave-bar',
        { scaleY: 0, transformOrigin: 'bottom center' },
        {
          scaleY: 1,
          duration: 0.7,
          stagger: 0.04,
          ease: 'back.out(1.4)',
          delay: 0.2,
        }
      );

      // Subtle floating HUD pills
      gsap.to('.bento-float-1', {
        y: -5,
        duration: 3.2,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
      });
      gsap.to('.bento-float-2', {
        y: 5,
        duration: 3.8,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
        delay: 0.3,
      });
    }, containerRef);

    return () => ctx.revert();
  }, [title]);

  if (!isOverview) {
    return (
      <section ref={containerRef} className="space-y-6">
        <div className="bento-header flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>SFSH MODULE</span>
            </div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-text sm:text-4xl">{title}</h1>
          </div>
        </div>

        <div className="bento-card glass-card relative overflow-hidden rounded-3xl p-8 sm:p-12 text-center luma-glow-sm">
          <div className="relative z-10 max-w-md mx-auto space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary text-2xl">
              🌱
            </div>
            <p className="text-base font-medium text-text">{description}</p>
            <p className="text-xs text-muted">Tính năng đang được chuẩn bị để mang lại trải nghiệm tối ưu nhất.</p>
            <div className="pt-2">
              <Link
                to="/timetable"
                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-fg shadow-sm luma-glow-sm hover:opacity-90 transition-opacity"
              >
                <span>Xem Thời khóa biểu tuần</span>
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
            <span>AI BIO-RHYTHM ACTIVE</span>
          </div>
          <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-text">
            {title}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {description}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="bento-float-1 will-change-transform glass-card inline-flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-semibold shadow-xs">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-text">⚡ 98% Nhịp sinh học</span>
          </div>
          <div className="bento-float-2 will-change-transform glass-card inline-flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-semibold shadow-xs">
            <span>🔥</span>
            <span className="text-text">Chuỗi 7 ngày học tập</span>
          </div>
        </div>
      </div>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Bento 1: Circular Focus Rhythm (Col-span 2) */}
        <div className="bento-card lg:col-span-2 glass-card relative overflow-hidden rounded-3xl p-6 sm:p-7 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Trạng thái tập trung</span>
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
                <span className="text-[10px] text-muted uppercase font-bold">Mục tiêu ngày</span>
              </div>
            </div>

            <div className="space-y-2 text-center sm:text-left">
              <h3 className="text-lg font-bold text-text">3.5 / 4.0 giờ đã hoàn thành</h3>
              <p className="text-xs text-muted leading-relaxed">
                Bạn đã hoàn thành 7 phiên Pomodoro hiệu quả trong ngày hôm nay. Năng suất ghi nhận ở mức tối ưu.
              </p>
              <div className="pt-1">
                <Link
                  to="/focus"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline underline-offset-2"
                >
                  <span>Mở Focus Room</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-muted mb-1.5">
              <span>Mức năng lượng nhận thức</span>
              <span className="text-text font-bold">Cao (Bio-Peak)</span>
            </div>
            <div className="h-2 w-full rounded-full bg-border/40 overflow-hidden">
              <div
                className="bento-progress-bar h-full w-full rounded-full bg-gradient-to-r from-primary to-emerald-400 origin-left will-change-transform"
                data-scale="0.85"
              />
            </div>
          </div>
        </div>

        {/* Bento 2: Ca học tiếp theo (Col-span 1) */}
        <div className="bento-card glass-card rounded-3xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Lịch học tiếp theo</span>
            <span className="h-2 w-2 rounded-full bg-primary" />
          </div>

          <div className="my-4 space-y-2">
            <span className="inline-block rounded-md bg-primary/20 px-2 py-0.5 text-xs font-bold text-primary">
              MSIS207
            </span>
            <h4 className="text-base font-bold text-text leading-snug">Phát triển ứng dụng web</h4>
            <div className="space-y-1 text-xs text-muted">
              <div className="flex items-center gap-1.5">
                <span>🕒</span>
                <span>13:00 – 16:15</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>📍</span>
                <span>Phòng C206 • Tiết 6-9</span>
              </div>
            </div>
          </div>

          <Link
            to="/timetable"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-surface-2/80 py-2.5 px-4 text-xs font-bold text-text hover:bg-primary hover:text-primary-fg transition-colors"
          >
            <span>Thời khóa biểu</span>
            <span>→</span>
          </Link>
        </div>

        {/* Bento 3: Deadline quan trọng (Col-span 1) */}
        <div className="bento-card glass-card rounded-3xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Deadline sắp tới</span>
            <span className="rounded-full bg-danger/15 px-2 py-0.5 text-[10px] font-bold text-danger">
              Hạn chót 24h
            </span>
          </div>

          <div className="my-4 space-y-2">
            <span className="inline-block rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-500">
              CS101 Lab 3
            </span>
            <h4 className="text-base font-bold text-text leading-snug">Functions exercises</h4>
            <p className="text-xs text-muted">Nộp qua portal bài tập trường trước 20:00 tối nay.</p>
          </div>

          <Link
            to="/deadlines"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-surface-2/80 py-2.5 px-4 text-xs font-bold text-text hover:bg-primary hover:text-primary-fg transition-colors"
          >
            <span>Chi tiết Deadline</span>
            <span>→</span>
          </Link>
        </div>

        {/* Bento 4: Weekly Rhythm Energy Wave (Col-span 2) */}
        <div className="bento-card lg:col-span-2 glass-card rounded-3xl p-6 sm:p-7 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted">Nhịp sinh học 7 ngày</span>
              <h4 className="text-base font-bold text-text mt-0.5">Biểu đồ phân bổ năng lượng tuần</h4>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/15 text-primary">
              26/10 – 01/11
            </span>
          </div>

          <div className="grid grid-cols-7 gap-3 h-28 items-end pt-3">
            {[
              { day: 'T2', height: '65%', active: true },
              { day: 'T3', height: '40%', active: false },
              { day: 'T4', height: '90%', active: true },
              { day: 'T5', height: '80%', active: true },
              { day: 'T6', height: '55%', active: false },
              { day: 'T7', height: '95%', active: true, today: true },
              { day: 'CN', height: '30%', active: false },
            ].map((item) => (
              <div key={item.day} className="flex flex-col items-center gap-1.5 h-full justify-end">
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
                  {item.day}
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
              <span>Gợi ý AI Wellness</span>
            </span>
            <span className="text-xs text-muted">Vừa cập nhật</span>
          </div>

          <div className="relative z-10 my-4 space-y-2">
            <h4 className="text-lg font-bold text-text">
              Khung giờ vàng tiếp thu lý thuyết: 08:30 – 10:30
            </h4>
            <p className="text-xs text-muted leading-relaxed">
              Dựa trên dữ liệu 10 phiên Pomodoro gần nhất, mức độ tập trung của bạn đạt đỉnh cao nhất vào buổi sáng. Hãy
              sắp xếp môn <strong>Các hệ cơ sở dữ liệu phân tán</strong> và <strong>Phân tích thống kê</strong> vào khung giờ này.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-3">
            <Link
              to="/focus"
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-fg shadow-sm luma-glow-sm hover:opacity-90 transition-opacity"
            >
              <span>Vào Focus Room ngay</span>
              <span>→</span>
            </Link>
            <Link
              to="/syllabus"
              className="inline-flex items-center gap-2 rounded-2xl border border-border px-4 py-2.5 text-xs font-bold text-text hover:bg-surface-2 transition-colors"
            >
              <span>Xem đề cương</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Synced Courses Progress Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {COURSE_MASTERY.map((course) => (
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
