import { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  gsap.registerPlugin(ScrollTrigger);
}

export function PlaceholderPage({ title, description }) {
  const containerRef = useRef(null);
  const isOverview = title === 'Tổng quan';

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Intro timeline
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        '.bento-header',
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, clearProps: 'opacity,transform' }
      );

      tl.fromTo(
        '.bento-card',
        { y: 30, opacity: 0, scale: 0.96 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          stagger: 0.08,
          duration: 0.5,
          ease: 'power2.out',
          clearProps: 'opacity,transform',
        },
        '-=0.25'
      );

      // Animate progress bars & rings
      gsap.fromTo(
        '.bento-progress-bar',
        { width: '0%' },
        {
          width: (i, target) => target.dataset.width || '75%',
          duration: 1.2,
          ease: 'power2.out',
          stagger: 0.1,
          delay: 0.3,
        }
      );

      // Animate weekly wave bars
      gsap.fromTo(
        '.bento-wave-bar',
        { scaleY: 0, transformOrigin: 'bottom center' },
        {
          scaleY: 1,
          duration: 0.8,
          stagger: 0.05,
          ease: 'back.out(1.5)',
          delay: 0.4,
        }
      );

      // Floating badges continuous subtle animation
      gsap.to('.bento-float-1', {
        y: -7,
        duration: 3.5,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
      });
      gsap.to('.bento-float-2', {
        y: 7,
        duration: 4.2,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
        delay: 0.4,
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
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span>SFSH MODULE</span>
            </div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-text sm:text-4xl">{title}</h1>
          </div>
        </div>

        <div className="bento-card glass-card relative overflow-hidden rounded-3xl p-8 sm:p-12 text-center luma-glow-sm">
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
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
    <section ref={containerRef} className="space-y-8">
      {/* Top Header & Ambient Greeting */}
      <div className="bento-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span>AI BIO-RHYTHM ACTIVE</span>
          </div>
          <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-text">
            Tổng quan
          </h1>
          <p className="mt-1 text-sm text-muted">
            {description}
          </p>
        </div>

        {/* Floating Health Metric Pills */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bento-float-1 glass-card inline-flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-semibold shadow-xs">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-ping" />
            <span className="text-text">⚡ 98% Nhịp sinh học</span>
          </div>
          <div className="bento-float-2 glass-card inline-flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-semibold shadow-xs">
            <span className="text-emerald-400">🔥</span>
            <span className="text-text">Chuỗi 7 ngày học tập</span>
          </div>
        </div>
      </div>

      {/* Bento Grid Layout (Inspired by Luma AI Wellness Behance) */}
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
            {/* SVG Circular Progress Ring */}
            <div className="relative flex h-32 w-32 shrink-0 items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-border/40"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-primary transition-all duration-1000"
                  strokeWidth="8"
                  strokeDasharray="251.2"
                  strokeDashoffset="37.6" /* 85% filled */
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

          {/* Linear Meter */}
          <div>
            <div className="flex justify-between text-xs font-medium text-muted mb-1.5">
              <span>Mức năng lượng nhận thức</span>
              <span className="text-text font-bold">Cao (Bio-Peak)</span>
            </div>
            <div className="h-2 w-full rounded-full bg-border/40 overflow-hidden">
              <div className="bento-progress-bar h-full rounded-full bg-gradient-to-r from-primary to-emerald-400" data-width="85%" />
            </div>
          </div>
        </div>

        {/* Bento 2: Ca học tiếp theo (Col-span 1) */}
        <div className="bento-card glass-card rounded-3xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Lịch học tiếp theo</span>
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          </div>

          <div className="my-4 space-y-2">
            <span className="inline-block rounded-md bg-primary/20 px-2 py-0.5 text-xs font-bold text-primary">
              MSIS207
            </span>
            <h4 className="text-base font-bold text-text leading-snug">Phát triển ứng dụng web</h4>
            <div className="space-y-1 text-xs text-muted">
              <div className="flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>13:00 – 16:15</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span>Phòng C206 • Tiết 6-9</span>
              </div>
            </div>
          </div>

          <Link
            to="/timetable"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-surface-2/80 py-2.5 px-4 text-xs font-bold text-text hover:bg-primary hover:text-primary-fg transition-all"
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
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-surface-2/80 py-2.5 px-4 text-xs font-bold text-text hover:bg-primary hover:text-primary-fg transition-all"
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

          {/* 7-day wave bars */}
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
                    className={`bento-wave-bar w-full rounded-xl transition-all ${
                      item.today
                        ? 'bg-primary shadow-xs luma-glow-sm'
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
          <div className="pointer-events-none absolute -bottom-16 -right-16 h-40 w-40 rounded-full bg-primary/15 blur-2xl" />
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
              sắp xếp môn <strong>Các hệ cơ sở dữ liệu phân tán</strong> và <strong>Toán</strong> vào khung giờ này.
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
    </section>
  );
}
