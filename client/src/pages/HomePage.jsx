import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLanguage } from '../i18n/languageContext';
import { LanguageToggle } from '../i18n/LanguageToggle';
import { ThemeToggle } from '../theme/ThemeToggle';
import { LotusIcon } from '../components/AppShell';
import { HomeToolIcon, CalendarIcon, ClockIcon, TargetIcon, BookOpenIcon, ZapIcon, MapPinIcon, FileTextIcon } from '../components/icons/AppIcons';

if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  gsap.registerPlugin(ScrollTrigger);
}

const HOME_COPY = {
  en: {
    announcement: {
      badge: 'NEW',
      text: 'Introducing Luma Focus & Timetable Studio — Automate your semester schedule in seconds.',
      cta: 'Explore Workspace',
    },
    hero: {
      eyebrowPrefix: 'Smart Workspace For Every',
      eyebrowHighlight: 'Student',
      titleLine1: 'One experience.',
      titleLine2: 'Tailored to Your Semester.',
      subtitle:
        'Synchronize your university .ics timetable, structure daily active study hours, and master course assignments with a distraction-free Pomodoro studio.',
      ctaPrimary: 'Explore Workspace',
      ctaSecondary: 'Create Free Account',
      trustedLabel: 'Built for modern university students & high-output academic workflows.',
      profileCard: {
        title: 'Academic Schedule Engine',
        badge: 'Active Semester',
        descLabel: 'Description',
        desc: 'Specialized in university timetable parsing. Resolves lecture halls, laboratory sessions, and study blocks with zero overlap.',
        coursesLabel: 'Active Courses (Live Sync)',
        courses: [
          { code: 'MSIS207 · Web Dev', room: 'Room E32 · Wed 13:00 – 16:15' },
          { code: 'CS5433 · Distributed DB', room: 'Room C206 · Thu 13:00 – 17:00' },
          { code: 'STAT3013 · Statistics', room: 'Lab B5.04 · Sat 07:30 – 11:30' },
        ],
        toolsLabel: 'Connected Modules',
      },
    },
    carouselSection: {
      tag: 'CORE WORKFLOWS',
      title: 'Academic Tools, Adapted to Your Daily Rhythm.',
      subtitle: 'Luma automates schedule parsing and study tracking to keep your semester running smoothly.',
      exploreCta: 'Explore Detail',
      cards: [
        {
          id: 'timetable',
          title: 'Smart Timetable Sync',
          desc: 'Automatically parse university portal & Google Calendar .ics feeds with zero room or hour collisions.',
          metricLabel: 'Classes Mapped',
          metricValue: '11',
          metricDelta: '↑ 0 Conflicts',
        },
        {
          id: 'focus',
          title: 'Pomodoro Focus Studio',
          desc: 'Accelerate deep coursework, exam prep, and coding labs with 25/5 intervals and ambient soundscapes.',
          metricLabel: 'Focus Sprint Flow',
          metricValue: '94%',
        },
        {
          id: 'deadlines',
          title: 'Deadline & Syllabus Radar',
          desc: 'Manage course syllabi, priority lab submissions, and weekly academic milestones ahead of time.',
          metricLabel: 'On-Time Submissions',
          metricValue: '94.2%',
        },
      ],
    },
    bentoSection: {
      tag: 'UNIFIED WORKSPACE',
      title: 'Your Courses. Your Schedule. Your Focus Studio.',
      subtitle: 'Luma connects your class timetable, course syllabi, deadlines, and focus timer into one cohesive system.',
      card1: {
        hubLabel: 'Timetable Engine',
        title: 'Shared Schedule Context',
        desc: 'Give your workspace the full context of your lecture halls, lab rooms, and weekly class times.',
      },
      card2: {
        windowTitle: 'Syllabus & Coursework',
        files: [
          { name: 'MSIS207_Web_App_Syllabus.pdf', status: 'Synced', pct: 100 },
          { name: 'CS5433_Distributed_DB_Labs.docx', status: 'Indexing', pct: 78 },
          { name: 'STAT3013_Hypothesis_Testing.pptx', status: 'Verified', pct: 94 },
        ],
        title: 'Structured Course Context',
        desc: 'Align grading rubrics, weekly readings, and project milestones so every study block stays on track.',
      },
      card3: {
        source: '.ICS Schedule',
        target1: 'Focus Room',
        target2: 'Deadlines',
        title: 'Connected Study Data',
        desc: 'Link your live class schedule and upcoming assignment deadlines directly into your daily focus sessions.',
      },
      card4: {
        tags: [
          { label: 'Morning Lectures', window: '07:30 – 11:30 · High Alertness' },
          { label: 'Afternoon Labs', window: '13:00 – 16:15 · Practical Coding' },
          { label: 'Active Hours', window: '08:00 – 17:00 · Core Schedule' },
          { label: 'Deep Focus', window: '19:30 – 21:30 · 25/5 Pomodoro' },
          { label: 'Evening Review', window: '21:30 – 22:30 · Syllabus Recap' },
          { label: 'Custom Blocks', window: 'Flexible · Personal Rhythm' },
        ],
        title: 'Adaptive Active Hours',
        desc: 'Capture when you perform best and structure independent study blocks around your natural energy peaks.',
      },
    },
    impactSection: {
      tag: 'ACADEMIC IMPACT',
      title: 'More Study Done. Less Chaos to Manage.',
      callouts: {
        topLeftTitle: '.ICS Auto-Parser',
        topLeftSub: '0.18s Sync · 11 Classes Mapped',
        topRightVal: '24.5 hrs',
        topRightLabel: 'Focused study time / week.',
        topRightBadge: '↑ +18% Flow',
        midLeftTitle: 'Active Hours Engine',
        midLeftSub: '08:00 – 17:00 Protected',
        midRightTitle: '432Hz Focus Studio',
        midRightSub: 'Pomodoro 25/5 Active',
        bottomLeftVal: '3.2x',
        bottomLeftLabel: 'Faster Schedule Organization',
        bottomLeftBadge: '0 Collisions',
        bottomRightVal: '94.2%',
        bottomRightLabel: 'On-Time Submission Pace',
      },
      telemetryStrip: [
        { label: 'Room Collision Check', val: '100% Clear', pct: 100 },
        { label: 'Weekly Focus Quota', val: '92% Achieved', pct: 92 },
        { label: 'Syllabus Checkpoints', val: '15/15 Indexed', pct: 100 },
        { label: 'Deadline Early Radar', val: 'Active 24/7', pct: 95 },
      ],
      pillars: [
        {
          title: 'Less Manual Scheduling',
          desc: 'Automate recurring weekly class mapping and room lookups to save hours every semester.',
        },
        {
          title: 'Faster Assignment Turnaround',
          desc: 'Move coursework forward with priority triage queues instead of last-minute midnight rushes.',
        },
        {
          title: 'Always In Sync',
          desc: 'Keep your timetable, syllabus checkpoints, and Pomodoro streaks running 24/7 without friction.',
        },
      ],
    },
    useCaseSection: {
      tag: 'WORKFLOW MODES',
      title: 'Built for Every Academic Stage',
      subtitle: 'Luma boosts student performance by unifying schedules and eliminating distraction across the semester.',
      tabs: [
        {
          id: 'timetable',
          label: 'Weekly Classes',
          topStatTitle: "Today's Schedule",
          topStatNum: '5 Classes',
          topStatSub: 'Mapped',
          listTitle: 'Active Courses',
          listItems: [
            { name: 'MSIS207 · Web App Dev', status: 'Running', active: true },
            { name: 'CS5433 · Distributed DB', status: 'Running', active: true },
            { name: 'STAT3013 · Statistics Lab', status: 'Running', active: true },
            { name: 'PE231 · Physical Ed', status: '15:25', active: false },
          ],
          bannerLabel: 'SEMESTER PACE',
          bannerBrand: 'LUMA · ZERO COLLISION',
          metric1Val: '24.5 hrs',
          metric1Title: 'Active Study Window / Week.',
          metric1Desc: 'Automated time-blocking around your university lectures.',
          metric2Val: '100%',
          metric2Title: 'Conflict-Free Timetable.',
          metric2Desc: 'Instant room & hour deduplication across all imported courses.',
          quote: '"Luma turned my cluttered portal .ics file into a crystal-clear weekly dashboard in two seconds."',
          author: 'Minh Khôi',
          role: 'Information Systems · Year 3',
        },
        {
          id: 'focus',
          label: 'Focus Studio',
          topStatTitle: 'Current Sprint',
          topStatNum: '25:00',
          topStatSub: 'Flow Mode',
          listTitle: 'Acoustic Channels',
          listItems: [
            { name: 'Library Silence (432Hz)', status: 'Active', active: true },
            { name: 'Gentle Campus Rain', status: 'Ready', active: true },
            { name: 'Quiet Study Cafe', status: 'Ready', active: true },
            { name: 'Break Chime Notification', status: '5m Rest', active: false },
          ],
          bannerLabel: 'DEEP IMMERSION',
          bannerBrand: 'LUMA · POMODORO 25/5',
          metric1Val: '4.8 hrs',
          metric1Title: 'Average Deep Focus / Day.',
          metric1Desc: 'Sustained cognitive flow without notification fatigue.',
          metric2Val: '94%',
          metric2Title: 'Sprint Completion Rate.',
          metric2Desc: 'Structured 25-minute intervals paired with 5-minute recovery.',
          quote: '"Pairing the built-in ambient rain audio with 25-minute sprints completely fixed my exam week procrastination."',
          author: 'Thảo Vy',
          role: 'Computer Science · Year 4',
        },
        {
          id: 'deadlines',
          label: 'Deadlines',
          topStatTitle: 'Priority Queue',
          topStatNum: '3 Tasks',
          topStatSub: 'On Track',
          listTitle: 'Upcoming Deliverables',
          listItems: [
            { name: 'Lab 4 · Express CRUD API', status: 'Tonight', active: true },
            { name: 'Assignment 2 · 2PC Protocol', status: 'In 2d', active: true },
            { name: 'Quiz 3 · Hypothesis Test', status: 'Sat 08:00', active: true },
            { name: 'Final Project Proposal', status: 'Next Wk', active: false },
          ],
          bannerLabel: 'EARLY WARNING',
          bannerBrand: 'LUMA · MILESTONE RADAR',
          metric1Val: '94.2%',
          metric1Title: 'On-Time Submission Pace.',
          metric1Desc: 'Proactive triage alerts before deadlines turn critical.',
          metric2Val: '0 Late',
          metric2Title: 'Missed Lab Deliverables.',
          metric2Desc: 'Every programming lab and report tracked to the minute.',
          quote: '"Having Critical and Warning badges right next to my timetable means I never get surprised by a midnight lab."',
          author: 'Hoàng Nam',
          role: 'Software Engineering · Year 3',
        },
        {
          id: 'syllabus',
          label: 'Syllabus',
          topStatTitle: 'Course Modules',
          topStatNum: '15 Weeks',
          topStatSub: 'Structured',
          listTitle: 'Tracked Syllabi',
          listItems: [
            { name: 'Ch.4 RESTful Architecture', status: 'Completed', active: true },
            { name: 'Ch.5 JWT Authentication', status: 'In Progress', active: true },
            { name: 'Distributed Consensus 2PC', status: 'In Progress', active: true },
            { name: 'ANOVA Statistical Models', status: 'Upcoming', active: false },
          ],
          bannerLabel: 'CURRICULUM MAP',
          bannerBrand: 'LUMA · SYLLABUS SYNC',
          metric1Val: '6 / 6',
          metric1Title: 'Courses Fully Indexed.',
          metric1Desc: 'Lecture topics and lab weights mapped week by week.',
          metric2Val: '82%',
          metric2Title: 'Midterm Syllabus Mastery.',
          metric2Desc: 'Clear visibility into completed chapters before exams.',
          quote: '"Instead of digging through 6 different PDF syllabi, I see every week’s topic right inside my workspace."',
          author: 'Gia Hân',
          role: 'Data Science · Year 2',
        },
      ],
    },
    faqSection: {
      tag: 'FREQUENTLY ASKED QUESTIONS',
      title: 'All About Luma',
      groups: [
        {
          category: 'GENERAL',
          items: [
            {
              q: 'What is Luma Workspace?',
              a: 'is an all-in-one academic schedule and deep focus studio designed for university students. It unifies .ICS timetable parsing, custom active hours, course syllabus tracking, and Pomodoro study sprints in a single interface.',
              hasBadge: true,
            },
            {
              q: 'How does automatic .ICS timetable sync work?',
              a: 'Simply export your schedule (.ics file) from Google Calendar or your university portal and upload it to Luma. The engine automatically extracts course codes, lecture times, and classroom locations with zero overlap.',
            },
          ],
        },
        {
          category: 'TIMETABLE & FOCUS STUDIO',
          items: [
            {
              q: 'Can I customize my daily active study hours?',
              a: 'Yes. Luma is built around your personal active hours. You can organize fixed lectures alongside flexible self-study blocks tailored to your morning, afternoon, or evening productivity peaks.',
            },
            {
              q: 'How do Pomodoro sprints and ambient soundscapes work?',
              a: 'Inside the Focus Studio, you can launch 25-minute focus sprints paired with built-in acoustic environments (Library Silence, Gentle Rain, or Campus Cafe) to block out distractions and sustain flow state.',
            },
          ],
        },
        {
          category: 'DEADLINES & ACCESS',
          items: [
            {
              q: 'How does Luma help me stay ahead of course deadlines?',
              a: 'Luma categorizes your deliverables into Critical, Warning, and Scheduled priority queues, showing real-time progress bars and completion rates so no assignment slips through the cracks.',
            },
            {
              q: 'Can I start using Luma for free?',
              a: 'Yes! You can create a free student account in seconds, import your current semester .ics timetable immediately, and switch seamlessly between Light and Dark themes.',
            },
          ],
        },
      ],
    },
    finale: {
      tag: 'GET STARTED',
      title: 'Ready to Master Your Academic Semester?',
      subtitle:
        'Synchronize your timetable, eliminate deadline stress, and accomplish more every single study session.',
      ctaPrimary: 'Sign In Now',
      ctaSecondary: 'Create Free Account',
    },
  },
  vi: {
    announcement: {
      badge: 'MỚI',
      text: 'Ra mắt Luma Focus & Timetable Studio — Tự động hóa lịch trình học kỳ của bạn trong vài giây.',
      cta: 'Khám phá ngay',
    },
    hero: {
      eyebrowPrefix: 'Không gian Học tập cho Mọi',
      eyebrowHighlight: 'Sinh viên',
      titleLine1: 'Một trải nghiệm.',
      titleLine2: 'Thiết kế Riêng cho Học kỳ của bạn.',
      subtitle:
        'Đồng bộ thời khóa biểu .ics từ cổng trường, thiết lập khung giờ hoạt động hiệu quả và làm chủ mọi hạn nộp bài tập với phòng tập trung Pomodoro không xao nhãng.',
      ctaPrimary: 'Khám phá Không gian',
      ctaSecondary: 'Tạo tài khoản miễn phí',
      trustedLabel: 'Thiết kế tối ưu cho sinh viên đại học & quy trình học tập hiệu suất cao.',
      profileCard: {
        title: 'Bộ Điều phối Lịch học',
        badge: 'Học kỳ Đang mở',
        descLabel: 'Mô tả hệ thống',
        desc: 'Chuyên biệt cho việc bóc tách lịch học đại học. Tự động chuẩn hóa giảng đường, phòng Lab và khung giờ tự học không trùng lặp.',
        coursesLabel: 'Môn học Đang theo dõi (Trực tiếp)',
        courses: [
          { code: 'MSIS207 · Phát triển Web', room: 'Phòng E32 · Thứ 4 13:00 – 16:15' },
          { code: 'CS5433 · CSDL Phân tán', room: 'Phòng C206 · Thứ 5 13:00 – 17:00' },
          { code: 'STAT3013 · Thống kê', room: 'Phòng B5.04 · Thứ 7 07:30 – 11:30' },
        ],
        toolsLabel: 'Phân hệ Kết nối',
      },
    },
    carouselSection: {
      tag: 'QUY TRÌNH CỐT LÕI',
      title: 'Công cụ Học tập, Thích ứng theo Nhịp sinh hoạt của bạn.',
      subtitle: 'Luma tự động hóa việc xếp lịch và theo dõi tiến độ để học kỳ của bạn luôn vận hành trơn tru.',
      exploreCta: 'Xem chi tiết',
      cards: [
        {
          id: 'timetable',
          title: 'Đồng bộ Thời khóa biểu .ICS',
          desc: 'Tự động đọc file lịch từ cổng đào tạo & Google Calendar với 0 ca trùng phòng hay chồng chéo giờ.',
          metricLabel: 'Ca học Đã xếp',
          metricValue: '11',
          metricDelta: '↑ 0 Trùng lịch',
        },
        {
          id: 'focus',
          title: 'Phòng Tập trung Pomodoro',
          desc: 'Tăng tốc làm bài tập lớn, ôn thi và lập trình Lab với chu kỳ 25/5 cùng âm thanh nền tự nhiên.',
          metricLabel: 'Hiệu suất Tập trung',
          metricValue: '94%',
        },
        {
          id: 'deadlines',
          title: 'Radar Hạn nộp & Đề cương',
          desc: 'Quản lý đề cương môn học, bài nộp ưu tiên và các cột mốc quan trọng trong tuần trước hạn chót.',
          metricLabel: 'Nộp bài Đúng hạn',
          metricValue: '94.2%',
        },
      ],
    },
    bentoSection: {
      tag: 'KHÔNG GIAN HỢP NHẤT',
      title: 'Môn học của bạn. Lịch trình của bạn. Phòng Tập trung của bạn.',
      subtitle: 'Luma kết nối thời khóa biểu, đề cương, hạn nộp bài tập và đồng hồ Pomodoro vào một hệ sinh thái duy nhất.',
      card1: {
        hubLabel: 'Lõi Thời khóa biểu',
        title: 'Đồng bộ Ngữ cảnh Lịch học',
        desc: 'Cung cấp bức tranh toàn diện về giảng đường, phòng Lab và thời gian biểu từng ngày trong tuần.',
      },
      card2: {
        windowTitle: 'Đề cương & Tài liệu Môn học',
        files: [
          { name: 'MSIS207_De_Cuong_Web_App.pdf', status: 'Đã đồng bộ', pct: 100 },
          { name: 'CS5433_Bai_Tap_Thuc_Hanh_DB.docx', status: 'Đang quét', pct: 78 },
          { name: 'STAT3013_Kiem_Dinh_Thong_Ke.pptx', status: 'Đã chuẩn hóa', pct: 94 },
        ],
        title: 'Cấu trúc Đề cương Rõ ràng',
        desc: 'Gắn kết tiêu chí chấm điểm, tài liệu đọc và hạn nộp đồ án để mọi buổi học đều đi đúng hướng.',
      },
      card3: {
        source: 'Lịch .ICS',
        target1: 'Phòng Focus',
        target2: 'Hạn nộp',
        title: 'Dữ liệu Học tập Liên thông',
        desc: 'Kết nối trực tiếp lịch học trên lớp với danh sách deadline để mỗi phiên Pomodoro đều giải quyết đúng việc cần nhất.',
      },
      card4: {
        tags: [
          { label: 'Ca học Sáng', window: '07:30 – 11:30 · Tỉnh táo Cao độ' },
          { label: 'Thực hành Lab', window: '13:00 – 16:15 · Lập trình Thực chiến' },
          { label: 'Khung giờ Vàng', window: '08:00 – 17:00 · Lịch trình Chính' },
          { label: 'Tập trung Sâu', window: '19:30 – 21:30 · Pomodoro 25/5' },
          { label: 'Ôn bài Tối', window: '21:30 – 22:30 · Hệ thống Đề cương' },
          { label: 'Tùy chỉnh Lịch', window: 'Linh hoạt · Nhịp Sinh học Riêng' },
        ],
        title: 'Tùy biến Khung giờ Hoạt động',
        desc: 'Thiết kế lịch trình dựa theo khung giờ hoạt động chung và linh hoạt tùy chỉnh riêng theo nhịp năng lượng của bạn.',
      },
    },
    impactSection: {
      tag: 'HIỆU QUẢ THỰC TẾ',
      title: 'Học tập Hiệu quả hơn. Giảm thiểu Rối loạn Lịch trình.',
      callouts: {
        topLeftTitle: 'Bộ Quét .ICS Tự Động',
        topLeftSub: '0.18s Đồng bộ · 11 Ca học',
        topRightVal: '24.5 giờ',
        topRightLabel: 'Giờ học tập trung / tuần.',
        topRightBadge: '↑ +18% Hiệu suất',
        midLeftTitle: 'Khung Giờ Hoạt Động',
        midLeftSub: '08:00 – 17:00 Tối ưu hóa',
        midRightTitle: 'Sóng Âm 432Hz Focus',
        midRightSub: 'Pomodoro 25/5 Đang chạy',
        bottomLeftVal: '3.2x',
        bottomLeftLabel: 'Tốc độ Sắp xếp Lịch học',
        bottomLeftBadge: '0 Trùng lịch',
        bottomRightVal: '94.2%',
        bottomRightLabel: 'Tỷ lệ Nộp bài Đúng hạn',
      },
      telemetryStrip: [
        { label: 'Kiểm tra Trùng phòng', val: '100% Chuẩn', pct: 100 },
        { label: 'Mục tiêu Focus Tuần', val: 'Đạt 92%', pct: 92 },
        { label: 'Cột mốc Đề cương', val: '15/15 Tuần', pct: 100 },
        { label: 'Radar Cảnh báo Sớm', val: 'Hoạt động 24/7', pct: 95 },
      ],
      pillars: [
        {
          title: 'Xóa bỏ Nhập lịch Thủ công',
          desc: 'Tự động hóa việc phân bổ ca học hàng tuần và tra cứu phòng học, tiết kiệm hàng giờ mỗi đầu học kỳ.',
        },
        {
          title: 'Hoàn thành Bài tập Nhanh hơn',
          desc: 'Giải quyết bài tập theo hàng đợi ưu tiên rõ ràng thay vì chạy deadline sát giờ nửa đêm.',
        },
        {
          title: 'Luôn Đồng bộ 24/7',
          desc: 'Giữ cho thời khóa biểu, cột mốc đề cương và chuỗi Pomodoro vận hành mượt mà mọi lúc.',
        },
      ],
    },
    useCaseSection: {
      tag: 'CHẾ ĐỘ VẬN HÀNH',
      title: 'Thiết kế cho Mọi Giai đoạn trong Học kỳ',
      subtitle: 'Luma nâng tầm hiệu suất học tập bằng cách hợp nhất lịch trình và loại bỏ xao nhãng.',
      tabs: [
        {
          id: 'timetable',
          label: 'Lịch học Tuần',
          topStatTitle: 'Lịch học Hôm nay',
          topStatNum: '5 Ca học',
          topStatSub: 'Đã xếp lịch',
          listTitle: 'Môn học Trong tuần',
          listItems: [
            { name: 'MSIS207 · Phát triển Web', status: 'Đang học', active: true },
            { name: 'CS5433 · CSDL Phân tán', status: 'Đang học', active: true },
            { name: 'STAT3013 · Thống kê', status: 'Đang học', active: true },
            { name: 'PE231 · Giáo dục thể chất', status: '15:25', active: false },
          ],
          bannerLabel: 'NHỊP ĐỘ HỌC KỲ',
          bannerBrand: 'LUMA · 0 TRÙNG LỊCH',
          metric1Val: '24.5 giờ',
          metric1Title: 'Khung giờ Hoạt động / Tuần.',
          metric1Desc: 'Tự động phân bổ thời gian tự học xoay quanh giờ lên lớp.',
          metric2Val: '100%',
          metric2Title: 'Chuẩn hóa Phòng học & Giờ.',
          metric2Desc: 'Loại bỏ hoàn toàn xung đột lịch giữa các môn lý thuyết và thực hành.',
          quote: '"Luma biến file .ics rối rắm từ cổng trường của tôi thành bảng thời khóa biểu trực quan chỉ trong 2 giây."',
          author: 'Minh Khôi',
          role: 'Hệ thống Thông tin · Năm 3',
        },
        {
          id: 'focus',
          label: 'Phòng Focus',
          topStatTitle: 'Phiên Hiện tại',
          topStatNum: '25:00',
          topStatSub: 'Trạng thái Flow',
          listTitle: 'Kênh Âm thanh Nền',
          listItems: [
            { name: 'Thư viện Tĩnh lặng (432Hz)', status: 'Đang bật', active: true },
            { name: 'Tiếng mưa Khuôn viên', status: 'Sẵn sàng', active: true },
            { name: 'Góc Cafe Học bài', status: 'Sẵn sàng', active: true },
            { name: 'Chuông báo Nghỉ ngắn', status: '5 phút', active: false },
          ],
          bannerLabel: 'TẬP TRUNG SÂU',
          bannerBrand: 'LUMA · POMODORO 25/5',
          metric1Val: '4.8 giờ',
          metric1Title: 'Trung bình Tập trung / Ngày.',
          metric1Desc: 'Duy trì sự tỉnh táo cao độ không bị mệt mỏi vì thông báo.',
          metric2Val: '94%',
          metric2Title: 'Tỷ lệ Hoàn thành Phiên.',
          metric2Desc: 'Chu kỳ 25 phút học chuyên sâu kết hợp 5 phút nghỉ hồi phục.',
          quote: '"Kết hợp âm thanh mưa rơi nhẹ nhàng với đồng hồ 25 phút giúp tôi chấm dứt hoàn toàn việc trì hoãn mùa thi."',
          author: 'Thảo Vy',
          role: 'Khoa học Máy tính · Năm 4',
        },
        {
          id: 'deadlines',
          label: 'Hạn nộp bài',
          topStatTitle: 'Hàng đợi Ưu tiên',
          topStatNum: '3 Bài tập',
          topStatSub: 'Đúng tiến độ',
          listTitle: 'Bài tập Sắp tới hạn',
          listItems: [
            { name: 'Lab 4 · Express CRUD API', status: 'Tối nay', active: true },
            { name: 'Bài tập 2 · Giao thức 2PC', status: 'Còn 2 ngày', active: true },
            { name: 'Quiz 3 · Kiểm định ANOVA', status: 'Thứ 7', active: true },
            { name: 'Đề tài Đồ án Cuối kỳ', status: 'Tuần sau', active: false },
          ],
          bannerLabel: 'CẢNH BÁO SỚM',
          bannerBrand: 'LUMA · RADAR TIẾN ĐỘ',
          metric1Val: '94.2%',
          metric1Title: 'Tỷ lệ Nộp bài Đúng hạn.',
          metric1Desc: 'Cảnh báo phân tầng ưu tiên trước khi bài tập trở nên quá hạn.',
          metric2Val: '0 Trễ',
          metric2Title: 'Bài thực hành & Đồ án.',
          metric2Desc: 'Mọi bài Lab và báo cáo đều được theo dõi sát sao từng giờ.',
          quote: '"Nhờ nhãn Khẩn cấp nằm ngay cạnh thời khóa biểu, tôi không bao giờ còn bị bất ngờ bởi các bài Lab nộp lúc nửa đêm."',
          author: 'Hoàng Nam',
          role: 'Kỹ thuật Phần mềm · Năm 3',
        },
        {
          id: 'syllabus',
          label: 'Đề cương',
          topStatTitle: 'Tiến trình Học kỳ',
          topStatNum: '15 Tuần',
          topStatSub: 'Đã cấu trúc',
          listTitle: 'Chuyên đề Đang học',
          listItems: [
            { name: 'Ch.4 Kiến trúc RESTful API', status: 'Hoàn tất', active: true },
            { name: 'Ch.5 Xác thực JWT & Phân quyền', status: 'Đang học', active: true },
            { name: 'Đồng thuận Phân tán 2PC', status: 'Đang học', active: true },
            { name: 'Mô hình Thống kê ANOVA', status: 'Sắp tới', active: false },
          ],
          bannerLabel: 'BẢN ĐỒ HỌC PHẦN',
          bannerBrand: 'LUMA · ĐỀ CƯƠNG SỐ',
          metric1Val: '6 / 6',
          metric1Title: 'Môn học Đã số hóa.',
          metric1Desc: 'Nội dung từng tuần và trọng số điểm được gắn kết rõ ràng.',
          metric2Val: '82%',
          metric2Title: 'Hoàn thành Đề cương Giữa kỳ.',
          metric2Desc: 'Nắm bắt chính xác các chương đã nắm vững trước kỳ thi.',
          quote: '"Thay vì phải mở 6 file PDF đề cương khác nhau, tôi xem được ngay chủ đề học của từng tuần ngay trong Luma."',
          author: 'Gia Hân',
          role: 'Khoa học Dữ liệu · Năm 2',
        },
      ],
    },
    faqSection: {
      tag: 'CÂU HỎI THƯỜNG GẶP',
      title: 'All About Luma',
      groups: [
        {
          category: 'TỔNG QUAN',
          items: [
            {
              q: 'Luma Workspace là gì?',
              a: 'là không gian quản lý lịch trình học tập và tập trung chuyên sâu dành cho sinh viên đại học. Hệ thống hợp nhất việc đọc file lịch .ICS, phân bổ khung giờ hoạt động, theo dõi đề cương và đồng hồ Pomodoro trong một giao diện duy nhất.',
              hasBadge: true,
            },
            {
              q: 'Cơ chế đồng bộ thời khóa biểu .ICS hoạt động như thế nào?',
              a: 'Bạn chỉ cần tải file lịch (.ics) từ Google Calendar hoặc cổng thông tin đào tạo của trường và đưa vào Luma. Hệ thống sẽ tự động nhận diện mã môn, giờ học và phòng học mà không bị trùng lịch.',
            },
          ],
        },
        {
          category: 'THỜI KHÓA BIỂU & PHÒNG TẬP TRUNG',
          items: [
            {
              q: 'Tôi có thể tùy chỉnh khung giờ hoạt động riêng của mình không?',
              a: 'Hoàn toàn được. Luma giúp bạn thiết kế lịch trình dựa theo khung giờ hoạt động chung trên trường và linh hoạt tùy chỉnh các khoảng thời gian tự học riêng theo nhịp sinh hoạt cá nhân.',
            },
            {
              q: 'Phiên Pomodoro và âm thanh nền hỗ trợ việc học ra sao?',
              a: 'Trong Phòng Focus, bạn có thể kích hoạt các phiên học 25 phút kết hợp cùng âm thanh nền tự nhiên (Thư viện tĩnh lặng, Mưa êm dịu, Cafe học bài) để loại bỏ tiếng ồn và duy trì sự tập trung tối đa.',
            },
          ],
        },
        {
          category: 'HẠN NỘP & TRẢI NGHIỆM',
          items: [
            {
              q: 'Làm sao Luma giúp tôi không bao giờ trễ hạn nộp bài tập?',
              a: 'Luma phân loại bài tập theo mức độ ưu tiên (Khẩn cấp, Cận kề, Dự kiến) kèm thanh đo tiến độ trực quan, giúp bạn luôn chủ động xử lý các bài Lab và đồ án trước hạn chót.',
            },
            {
              q: 'Tôi có thể bắt đầu sử dụng Luma miễn phí không?',
              a: 'Có! Bạn có thể tạo tài khoản miễn phí ngay lập tức, nhập thời khóa biểu .ics của học kỳ hiện tại và chuyển đổi linh hoạt giữa giao diện Sáng (Light) và Tối (Dark).',
            },
          ],
        },
      ],
    },
    finale: {
      tag: 'BẮT ĐẦU NGAY',
      title: 'Sẵn sàng Làm chủ Học kỳ của bạn?',
      subtitle:
        'Đồng bộ thời khóa biểu, xóa bỏ áp lực trễ deadline và đạt hiệu suất cao hơn trong từng giờ tự học.',
      ctaPrimary: 'Đăng nhập ngay',
      ctaSecondary: 'Tạo tài khoản miễn phí',
    },
  },
};

const MARQUEE_PARTNERS = [
  { iconType: 'calendar', name: 'Google Calendar .ICS' },
  { iconType: 'building', name: 'University Portal Sync' },
  { iconType: 'clock', name: 'Pomodoro 25/5 Studio' },
  { iconType: 'book', name: 'Syllabus Tracker' },
  { iconType: 'target', name: 'Deadline Priority Radar' },
  { iconType: 'zap', name: 'Active Hours Engine' },
];

const MINI_TIMETABLE_SLOTS = [
  { code: 'MSIS207', room: 'E32', time: '07:30' },
  { code: 'CS5433', room: 'C206', time: '09:45' },
  { code: 'STAT3013', room: 'B5.04', time: '13:00' },
  { code: 'MATH201', room: 'C302', time: '14:30' },
  { code: 'PE231', room: 'Field', time: '15:25' },
  { code: 'FOCUS', room: '25m', time: '19:30' },
];

function AnimatedWords({ text, className = '' }) {
  const words = text.split(' ');
  return (
    <span className={className}>
      {words.map((word, idx) => (
        <span key={idx} className="gsap-word inline-block mr-[0.26em] last:mr-0">
          {word}
        </span>
      ))}
    </span>
  );
}

export function HomePage() {
  const { lang } = useLanguage();
  const t = HOME_COPY[lang] || HOME_COPY.en;
  const rootRef = useRef(null);
  const useCaseStageRef = useRef(null);
  const impactStageRef = useRef(null);

  // Interactive states
  const [activeCarouselIdx, setActiveCarouselIdx] = useState(1);
  const [activeUseCaseIdx, setActiveUseCaseIdx] = useState(0);
  const [openFaqKey, setOpenFaqKey] = useState('0-0');

  // Single unified pulse step (0..5) driving all live micro-simulations cleanly
  const [pulseStep, setPulseStep] = useState(0);
  const [pomoSeconds, setPomoSeconds] = useState(24 * 60 + 48);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      setPulseStep((s) => (s + 1) % 6);
      setPomoSeconds((sec) => (sec > 1200 ? sec - 1 : 25 * 60));
    }, 1400);
    return () => window.clearInterval(interval);
  }, []);

  const formattedPomo = `${String(Math.floor(pomoSeconds / 60)).padStart(2, '0')}:${String(
    pomoSeconds % 60
  ).padStart(2, '0')}`;

  // Re-animate the Use Case Bento Stage whenever the user switches tabs
  useEffect(() => {
    if (!useCaseStageRef.current) return undefined;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.usecase-bento-card',
        { y: 16, scale: 0.985, autoAlpha: 0 },
        {
          y: 0,
          scale: 1,
          autoAlpha: 1,
          duration: 0.38,
          stagger: 0.055,
          ease: 'power3.out',
          clearProps: 'opacity,visibility,transform',
        }
      );
    }, useCaseStageRef);
    return () => ctx.revert();
  }, [activeUseCaseIdx]);

  // Master GSAP Timelines & Viewport-Aware ScrollTriggers (GPU-optimized)
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Hero Entrance Timeline
      const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      heroTl
        .fromTo(
          '.hero-eyebrow',
          { y: 12, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.32, clearProps: 'opacity,visibility,transform' }
        )
        .fromTo(
          '.hero-title .gsap-word',
          { opacity: 0.18, y: 10 },
          { opacity: 1, y: 0, duration: 0.42, stagger: 0.05, clearProps: 'opacity,transform' },
          '-=0.15'
        )
        .fromTo(
          '.hero-subtitle',
          { y: 12, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.35, clearProps: 'opacity,visibility,transform' },
          '-=0.22'
        )
        .fromTo(
          '.hero-cta-group',
          { y: 12, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.32, clearProps: 'opacity,visibility,transform' },
          '-=0.22'
        )
        .fromTo(
          '.hero-profile-shell',
          { y: 20, scale: 0.98, autoAlpha: 0 },
          { y: 0, scale: 1, autoAlpha: 1, duration: 0.45, clearProps: 'opacity,visibility,transform' },
          '-=0.4'
        )
        .fromTo(
          '.hero-profile-item',
          { y: 12, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.32, stagger: 0.06, clearProps: 'opacity,visibility,transform' },
          '-=0.28'
        )
        .fromTo(
          '.hero-trusted-bar',
          { y: 10, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.35, clearProps: 'opacity,visibility,transform' },
          '-=0.18'
        );

      // 2. Section Headings Word-by-Word Scroll Lighting Reveal
      gsap.utils.toArray('.section-word-reveal').forEach((heading) => {
        const words = heading.querySelectorAll('.gsap-word');
        if (!words.length) return;
        gsap.fromTo(
          words,
          { opacity: 0.2, y: 8 },
          {
            opacity: 1,
            y: 0,
            duration: 0.42,
            stagger: 0.04,
            ease: 'power2.out',
            clearProps: 'opacity,transform',
            scrollTrigger: {
              trigger: heading,
              start: 'top 86%',
              once: true,
            },
          }
        );
      });

      // 3. Staggered Card Batches on Scroll
      gsap.utils.toArray('.gsap-reveal-group').forEach((group) => {
        const items = group.querySelectorAll('.gsap-reveal-item');
        if (!items.length) return;
        gsap.fromTo(
          items,
          { y: 24, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.45,
            stagger: 0.08,
            ease: 'power3.out',
            clearProps: 'opacity,visibility,transform',
            scrollTrigger: {
              trigger: group,
              start: 'top 85%',
              once: true,
            },
          }
        );
      });

      // 4. Viewport-gated Orbital & Callout Timeline (Automatically PAUSES when off-screen to save GPU!)
      if (impactStageRef.current) {
        const impactLoopTl = gsap.timeline({
          paused: true,
          scrollTrigger: {
            trigger: impactStageRef.current,
            start: 'top bottom',
            end: 'bottom top',
            toggleActions: 'play pause resume pause',
          },
        });

        impactLoopTl
          .to(
            '.orbital-ring-spin',
            {
              rotation: 360,
              duration: 36,
              repeat: -1,
              ease: 'none',
            },
            0
          )
          .to(
            '.orbital-ring-spin-reverse',
            {
              rotation: -360,
              duration: 44,
              repeat: -1,
              ease: 'none',
            },
            0
          )
          .to(
            '.float-callout-a',
            {
              y: -6,
              duration: 2.8,
              repeat: -1,
              yoyo: true,
              ease: 'sine.inOut',
              stagger: 0.4,
            },
            0
          )
          .to(
            '.float-callout-b',
            {
              y: 6,
              duration: 3.2,
              repeat: -1,
              yoyo: true,
              ease: 'sine.inOut',
              stagger: 0.5,
            },
            0
          );
      }
    }, rootRef);

    return () => ctx.revert();
  }, []);

  const currentUseCase = t.useCaseSection.tabs[activeUseCaseIdx] || t.useCaseSection.tabs[0];
  const activeCourseIdx = pulseStep % 3;
  const activeCourseObj =
    t.hero.profileCard.courses[activeCourseIdx] || t.hero.profileCard.courses[0];
  const activeTagObj =
    t.bentoSection.card4.tags[pulseStep % t.bentoSection.card4.tags.length] ||
    t.bentoSection.card4.tags[0];

  return (
    <div
      ref={rootRef}
      className="min-h-screen bg-bg text-text selection:bg-primary/30 selection:text-text overflow-x-hidden font-sans"
    >
      {/* Top Announcement Bar */}
      <div className="w-full border-b border-border bg-surface-2/80 px-4 py-2 text-center">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-2 text-xs">
          <span className="rounded-md bg-primary/20 border border-primary/40 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-primary">
            {t.announcement.badge}
          </span>
          <span className="font-medium text-muted">{t.announcement.text}</span>
          <Link
            to="/login"
            className="inline-flex items-center gap-1 font-bold text-text hover:text-primary transition-colors"
          >
            <span>{t.announcement.cta}</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

      {/* Top Navbar (Preserved layout, single lightweight blur layer) */}
      <header className="sticky top-0 z-50 w-full px-4 sm:px-8 py-3.5 flex items-center justify-between border-b border-border floating-pill-nav">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/15 text-primary group-hover:scale-105 transition-transform shadow-xs">
            <LotusIcon className="h-5 w-5" />
          </div>
          <span className="text-base font-extrabold tracking-tight text-text">Luma</span>
        </Link>

        {/* Right action controls */}
        <div className="flex items-center gap-2.5">
          <LanguageToggle />
          <ThemeToggle />
          <Link
            to="/login"
            className="rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-semibold text-text hover:border-primary/50 transition-colors"
          >
            {lang === 'vi' ? 'Đăng nhập' : 'Sign In'}
          </Link>
          <Link
            to="/register"
            className="rounded-full bg-text text-bg dark:bg-white dark:text-black px-4 py-1.5 text-xs font-extrabold shadow-sm hover:bg-primary hover:text-black transition-colors"
          >
            {lang === 'vi' ? 'Bắt đầu' : 'Get Started'}
          </Link>
        </div>
      </header>

      <main className="space-y-24 sm:space-y-32 pb-16">
        {/* =====================================================================
            SECTION 1: 2-COLUMN SPLIT HERO + LIVE PROFILE ENGINE CARD
           ===================================================================== */}
        <section className="relative mx-auto max-w-6xl px-4 pt-10 sm:px-8 sm:pt-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <div className="hero-eyebrow inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-muted">
                <span>{t.hero.eyebrowPrefix}</span>
                <span className="relative font-extrabold text-text pb-0.5">
                  {t.hero.eyebrowHighlight}
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-gradient-to-r from-primary to-emerald-400" />
                </span>
              </div>

              <h1
                aria-label={`${t.hero.titleLine1} ${t.hero.titleLine2}`}
                className="hero-title text-4xl sm:text-5xl lg:text-[56px] font-extrabold tracking-tight text-text leading-[1.08]"
              >
                <AnimatedWords text={t.hero.titleLine1} className="block" />
                <AnimatedWords
                  text={t.hero.titleLine2}
                  className="block mt-1 text-transparent bg-clip-text bg-gradient-to-r from-text via-primary to-emerald-400"
                />
              </h1>

              <p className="hero-subtitle max-w-xl text-sm sm:text-base text-muted leading-relaxed">
                {t.hero.subtitle}
              </p>

              <div className="hero-cta-group pt-2 flex flex-wrap items-center gap-3.5">
                <Link
                  to="/login"
                  className="rounded-xl bg-gradient-to-r from-accent-deep via-primary to-accent-lime px-7 py-3.5 text-xs sm:text-sm font-extrabold text-primary-fg shadow-lg luma-glow-sm hover:opacity-95 transition-all"
                >
                  {t.hero.ctaPrimary} →
                </Link>
                <Link
                  to="/register"
                  className="rounded-xl border border-border bg-surface px-6 py-3.5 text-xs sm:text-sm font-bold text-text hover:border-primary/50 transition-colors"
                >
                  {t.hero.ctaSecondary}
                </Link>
              </div>
            </div>

            {/* Right Column: Dynamic Schedule Profile Card */}
            <div className="lg:col-span-6">
              <div className="hero-profile-shell rounded-[2rem] border border-border bg-surface-2/50 p-3 sm:p-4 shadow-xl">
                <div className="glass-card rounded-3xl p-6 sm:p-7 space-y-5 border border-border text-left">
                  {/* Top Icon + Title + Live Pulse Badge */}
                  <div className="hero-profile-item flex items-start justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/35 bg-primary/15 text-primary">
                        <LotusIcon className="h-6 w-6" />
                      </div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h2 className="text-xl sm:text-2xl font-extrabold text-text tracking-tight">
                          {t.hero.profileCard.title}
                        </h2>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/35 bg-primary/10 px-3 py-0.5 text-[11px] font-bold text-primary">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
                          <span>{t.hero.profileCard.badge}</span>
                        </span>
                      </div>
                    </div>
                    <span className="rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-[10px] font-mono font-bold text-emerald-400">
                      0.18s SYNC
                    </span>
                  </div>

                  {/* Description Block */}
                  <div className="hero-profile-item space-y-1 border-t border-border pt-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                      {t.hero.profileCard.descLabel}
                    </p>
                    <p className="text-xs sm:text-sm text-text/90 leading-relaxed">
                      {t.hero.profileCard.desc}
                    </p>
                  </div>

                  {/* Dynamic Cycling Active Courses Pills + Live Room Readout */}
                  <div className="hero-profile-item space-y-2.5 border-t border-border pt-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                        {t.hero.profileCard.coursesLabel}
                      </p>
                      <span className="text-[11px] font-mono font-bold text-primary transition-all inline-flex items-center gap-1">
                        <MapPinIcon className="w-3 h-3 text-primary" />
                        <span>{activeCourseObj.room}</span>
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {t.hero.profileCard.courses.map((course, idx) => {
                        const isCurrent = idx === activeCourseIdx;
                        return (
                          <span
                            key={course.code}
                            className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition-all duration-300 ${
                              isCurrent
                                ? 'border-primary bg-primary/15 text-primary luma-glow-sm scale-[1.03]'
                                : 'border-border bg-surface-2 text-muted'
                            }`}
                          >
                            {course.code}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Connected Modules with Active Pulse Ring */}
                  <div className="hero-profile-item space-y-2 border-t border-border pt-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                        {t.hero.profileCard.toolsLabel}
                      </p>
                      <span className="text-[10px] font-semibold text-emerald-400">
                        ● 4/4 Modules Online
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      {[
                        { iconType: 'calendar', label: 'ICS Sync', bg: 'bg-primary/20 border-primary/40 text-primary' },
                        { iconType: 'clock', label: 'Pomodoro', bg: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' },
                        { iconType: 'target', label: 'Deadlines', bg: 'bg-amber-500/20 border-amber-500/40 text-amber-400' },
                        { iconType: 'book', label: 'Syllabus', bg: 'bg-sky-500/20 border-sky-500/40 text-sky-400' },
                      ].map((tool, i) => (
                        <span
                          key={tool.label}
                          title={tool.label}
                          className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm transition-transform duration-300 ${
                            pulseStep % 4 === i ? 'scale-115 ring-2 ring-primary/50' : ''
                          } ${tool.bg}`}
                        >
                          <HomeToolIcon type={tool.iconType} className="w-4 h-4" />
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Trusted Ticker Bar */}
          <div className="hero-trusted-bar mt-14 pt-8 border-t border-border grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <p className="md:col-span-4 text-xs font-semibold text-muted text-left">
              {t.hero.trustedLabel}
            </p>
            <div className="md:col-span-8 flex flex-wrap items-center justify-start md:justify-end gap-6 sm:gap-8">
              {MARQUEE_PARTNERS.map((item, idx) => (
                <div
                  key={item.name}
                  className={`flex items-center gap-2 text-xs sm:text-sm font-extrabold transition-colors duration-300 ${
                    pulseStep === idx ? 'text-primary' : 'text-muted/80 hover:text-text'
                  }`}
                >
                  <HomeToolIcon type={item.iconType} className="w-4 h-4 text-primary shrink-0" />
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =====================================================================
            SECTION 2: 3-CARD WORKFLOW CAROUSEL WITH LIVE DYNAMIC WIDGETS
           ===================================================================== */}
        <section className="mx-auto max-w-6xl px-4 sm:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="inline-block rounded-lg border border-border bg-surface px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-widest text-primary">
              {t.carouselSection.tag}
            </span>
            <h2 className="section-word-reveal text-3xl sm:text-5xl font-extrabold tracking-tight text-text leading-tight">
              <AnimatedWords text={t.carouselSection.title} />
            </h2>
            <p className="text-xs sm:text-sm text-muted max-w-lg mx-auto leading-relaxed">
              {t.carouselSection.subtitle}
            </p>
          </div>

          {/* 3-Card Interactive Grid */}
          <div className="gsap-reveal-group grid grid-cols-1 md:grid-cols-3 gap-6">
            {t.carouselSection.cards.map((card, idx) => {
              const isSelected = activeCarouselIdx === idx;
              return (
                <div
                  key={card.id}
                  onClick={() => setActiveCarouselIdx(idx)}
                  className={`gsap-reveal-item glass-card rounded-3xl p-4 sm:p-5 flex flex-col justify-between text-left cursor-pointer transition-all duration-300 ${
                    isSelected
                      ? 'border-primary/55 luma-glow-sm scale-[1.01]'
                      : 'border-border opacity-90 hover:opacity-100'
                  }`}
                >
                  {/* Live Dynamic Visual Box + Floating Metric Overlay */}
                  <div className="relative h-56 w-full rounded-2xl border border-border bg-surface-2 overflow-hidden p-4 flex flex-col justify-between">
                    {/* Card 1 Live Timetable Scanner Simulation */}
                    {idx === 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {MINI_TIMETABLE_SLOTS.map((slot, sIdx) => {
                          const isScanning = pulseStep === sIdx;
                          return (
                            <div
                              key={slot.code}
                              className={`rounded-xl border px-2.5 py-2 transition-all duration-300 ${
                                isScanning
                                  ? 'border-primary bg-primary/20 text-primary scale-[1.04]'
                                  : 'border-border bg-bg/70 text-muted'
                              }`}
                            >
                              <div className="flex items-center justify-between text-[9px] font-mono">
                                <span>{slot.time}</span>
                                <span className={isScanning ? 'text-primary font-bold' : ''}>●</span>
                              </div>
                              <p className="text-[10px] font-extrabold text-text truncate mt-0.5">
                                {slot.code}
                              </p>
                              <p className="text-[9px] opacity-80 inline-flex items-center gap-1">
                                <MapPinIcon className="w-2.5 h-2.5 text-primary" />
                                <span>{slot.room}</span>
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Card 2 Live Ticking Pomodoro + Equalizer Wave */}
                    {idx === 1 && (
                      <div className="flex items-center justify-between px-2 pt-1">
                        <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-4 border-primary/45 bg-bg/80 luma-glow-sm">
                          <div className="text-center">
                            <span className="text-base font-black text-text font-mono">
                              {formattedPomo}
                            </span>
                            <span className="block text-[8px] font-bold uppercase text-primary">
                              LIVE FLOW
                            </span>
                          </div>
                        </div>
                        {/* 8-Bar Live Equalizer */}
                        <div className="flex items-end gap-1.5 h-16 pr-2">
                          {['h-8', 'h-14', 'h-10', 'h-16', 'h-9', 'h-12', 'h-15', 'h-7'].map(
                            (hClass, bIdx) => (
                              <span
                                key={bIdx}
                                className={`w-1.5 rounded-full bg-gradient-to-t from-accent-deep to-primary animate-equalizer ${hClass}`}
                                style={{ animationDelay: `${bIdx * 0.14}s` }}
                              />
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* Card 3 Live Priority Deadline Radar */}
                    {idx === 2 && (
                      <div className="space-y-2">
                        {[
                          { label: 'Lab 4 · Express CRUD API', tag: 'TONIGHT', pct: '92%', col: 'border-rose-500/40 bg-rose-500/10 text-rose-400' },
                          { label: 'Assign 2 · 2PC Protocol', tag: 'IN 2 DAYS', pct: '64%', col: 'border-amber-500/40 bg-amber-500/10 text-amber-400' },
                        ].map((d, dIdx) => (
                          <div
                            key={d.label}
                            className={`rounded-xl border px-3 py-2 flex items-center justify-between text-[10px] font-bold transition-transform duration-300 ${
                              pulseStep % 2 === dIdx ? ' translate-x-1' : ''
                            } ${d.col}`}
                          >
                            <span className="truncate pr-2 text-text">{d.label}</span>
                            <span className="shrink-0 font-mono">{d.tag} · {d.pct}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Floating Overlay Metric Card */}
                    <div className="mt-auto self-end w-[86%] rounded-2xl border border-primary/40 bg-bg/95 p-3.5 shadow-lg">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold text-muted">{card.metricLabel}</p>
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
                      </div>
                      {idx === 0 && (
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-2xl font-black text-text">{card.metricValue}</span>
                          <span className="text-[11px] font-bold text-emerald-400">{card.metricDelta}</span>
                        </div>
                      )}
                      {idx === 1 && (
                        <div className="mt-1.5 space-y-1.5">
                          <div className="flex justify-between text-xs font-extrabold">
                            <span className="text-primary">432Hz Resonance</span>
                            <span className="text-text">{card.metricValue}</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-accent-deep to-primary transition-all duration-500"
                              style={{ width: pulseStep % 2 === 0 ? '94%' : '89%' }}
                            />
                          </div>
                        </div>
                      )}
                      {idx === 2 && (
                        <div className="mt-1 flex items-end justify-between">
                          <span className="text-xl font-black text-primary">{card.metricValue}</span>
                          <svg className="h-7 w-24 text-primary" viewBox="0 0 90 28" fill="none">
                            <path
                              d="M2 24C18 22 26 10 42 14C56 17 68 4 86 3"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              className="animate-dash-flow"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Text Footer */}
                  <div className="pt-5 space-y-2">
                    <h3 className="text-lg font-extrabold text-text">{card.title}</h3>
                    <p className="text-xs sm:text-sm text-muted leading-relaxed">{card.desc}</p>
                    <div className="pt-2">
                      <Link
                        to="/login"
                        className="inline-flex items-center gap-1 text-xs font-extrabold text-text hover:text-primary transition-colors"
                      >
                        <span>{t.carouselSection.exploreCta}</span>
                        <span aria-hidden="true">↗</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Carousel Controls Bar */}
          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              type="button"
              aria-label="Previous workflow"
              onClick={() => setActiveCarouselIdx((i) => (i - 1 + 3) % 3)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-xs font-bold text-text hover:border-primary/50 transition-colors cursor-pointer"
            >
              ←
            </button>
            <div className="flex items-center gap-1.5">
              {[0, 1, 2].map((idx) => (
                <button
                  key={idx}
                  type="button"
                  aria-label={`Slide ${idx + 1}`}
                  onClick={() => setActiveCarouselIdx(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    activeCarouselIdx === idx ? 'w-12 bg-primary' : 'w-6 bg-border'
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              aria-label="Next workflow"
              onClick={() => setActiveCarouselIdx((i) => (i + 1) % 3)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-xs font-bold text-text hover:border-primary/50 transition-colors cursor-pointer"
            >
              →
            </button>
          </div>
        </section>

        {/* =====================================================================
            SECTION 3: 2x2 BENTO INTELLIGENCE GRID WITH LIVE ANIMATED DIAGRAMS
           ===================================================================== */}
        <section className="mx-auto max-w-6xl px-4 sm:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="inline-block rounded-lg border border-border bg-surface px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-widest text-primary">
              {t.bentoSection.tag}
            </span>
            <h2 className="section-word-reveal text-3xl sm:text-5xl font-extrabold tracking-tight text-text leading-tight">
              <AnimatedWords text={t.bentoSection.title} />
            </h2>
            <p className="text-xs sm:text-sm text-muted max-w-lg mx-auto leading-relaxed">
              {t.bentoSection.subtitle}
            </p>
          </div>

          <div className="gsap-reveal-group grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bento 1: Shared Schedule Context (Live Hub & Spoke Signal Flow) */}
            <div className="gsap-reveal-item glass-card rounded-3xl p-6 sm:p-8 flex flex-col justify-between text-left border border-border">
              <div className="relative h-56 w-full rounded-2xl border border-border bg-surface-2 overflow-hidden flex flex-col items-center justify-center p-4">
                {/* Animated SVG Spokes */}
                <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 400 220" fill="none">
                  <line x1="200" y1="100" x2="75" y2="42" stroke="currentColor" className="text-primary/35 animate-dash-flow" strokeWidth="1.5" />
                  <line x1="200" y1="100" x2="325" y2="42" stroke="currentColor" className="text-primary/35 animate-dash-flow" strokeWidth="1.5" />
                  <line x1="200" y1="100" x2="75" y2="175" stroke="currentColor" className="text-primary/35 animate-dash-flow" strokeWidth="1.5" />
                  <line x1="200" y1="100" x2="325" y2="175" stroke="currentColor" className="text-primary/35 animate-dash-flow" strokeWidth="1.5" />
                </svg>

                {/* 4 Corner Nodes lighting up in sequence */}
                {[
                  { label: 'MSIS207 · E32', pos: 'top-4 left-5', idx: 0 },
                  { label: 'CS5433 · C206', pos: 'top-4 right-5', idx: 1 },
                  { label: 'STAT3013 · B5.04', pos: 'bottom-4 left-5', idx: 2 },
                  { label: '07:30 – 16:15', pos: 'bottom-4 right-5', idx: 3 },
                ].map((node) => {
                  const activeNode = pulseStep % 4 === node.idx;
                  return (
                    <span
                      key={node.label}
                      className={`absolute ${node.pos} z-10 rounded-xl border px-3 py-1.5 text-[10px] font-extrabold transition-all duration-300 ${
                        activeNode
                          ? 'border-primary bg-bg text-primary luma-glow-sm scale-105'
                          : 'border-border bg-surface text-muted'
                      }`}
                    >
                      {node.label}
                    </span>
                  );
                })}

                {/* Central Hub Icon */}
                <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/50 bg-bg text-primary shadow-xl luma-glow">
                  <LotusIcon className="h-8 w-8" />
                </div>
                <span className="relative z-10 mt-2.5 rounded-xl border border-primary/40 bg-bg px-4 py-1 text-xs font-extrabold text-text shadow-md">
                  {t.bentoSection.card1.hubLabel}
                </span>
              </div>

              <div className="pt-6 space-y-1.5">
                <h3 className="text-lg font-extrabold text-text">{t.bentoSection.card1.title}</h3>
                <p className="text-xs sm:text-sm text-muted leading-relaxed">{t.bentoSection.card1.desc}</p>
              </div>
            </div>

            {/* Bento 2: Structured Course Context (Live Indexing Syllabus Window) */}
            <div className="gsap-reveal-item glass-card rounded-3xl p-6 sm:p-8 flex flex-col justify-between text-left border border-border">
              <div className="relative h-56 w-full rounded-2xl border border-border bg-surface-2 overflow-hidden flex items-center justify-center p-4">
                <div className="w-full max-w-sm rounded-2xl border border-border bg-bg p-4 shadow-lg space-y-2.5">
                  <div className="flex items-center justify-between border-b border-border pb-2 text-xs font-bold text-muted">
                    <span>{t.bentoSection.card2.windowTitle}</span>
                    <span className="text-[10px] font-mono text-primary">● LIVE INDEX</span>
                  </div>
                  {t.bentoSection.card2.files.map((file, fIdx) => {
                    const isScanning = pulseStep % 3 === fIdx;
                    return (
                      <div
                        key={file.name}
                        className={`rounded-xl border px-3 py-2 transition-all duration-300 ${
                          isScanning
                            ? 'border-primary/50 bg-primary/10'
                            : 'border-border bg-surface'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 text-xs font-bold">
                          <span className="truncate text-text inline-flex items-center gap-1.5">
                            <FileTextIcon className="w-3.5 h-3.5 text-muted shrink-0" />
                            <span className="truncate">{file.name}</span>
                          </span>
                          <span className="shrink-0 text-[10px] font-mono text-primary">
                            {file.status}
                          </span>
                        </div>
                        <div className="mt-1.5 h-1 w-full rounded-full bg-border overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-accent-deep to-primary transition-all duration-500"
                            style={{ width: isScanning ? '100%' : `${file.pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-6 space-y-1.5">
                <h3 className="text-lg font-extrabold text-text">{t.bentoSection.card2.title}</h3>
                <p className="text-xs sm:text-sm text-muted leading-relaxed">{t.bentoSection.card2.desc}</p>
              </div>
            </div>

            {/* Bento 3: Connected Study Data (Animated SVG Bezier Stream) */}
            <div className="gsap-reveal-item glass-card rounded-3xl p-6 sm:p-8 flex flex-col justify-between text-left border border-border">
              <div className="relative h-56 w-full rounded-2xl border border-border bg-surface-2 overflow-hidden flex items-center justify-between px-6 sm:px-10">
                {/* Left Source Node */}
                <div className="relative z-10 flex flex-col items-center gap-1.5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-deep to-primary text-primary-fg font-black shadow-lg luma-glow-sm">
                    <LotusIcon className="h-7 w-7" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-primary">
                    {t.bentoSection.card3.source}
                  </span>
                </div>

                {/* Animated SVG Connecting Bezier Curves */}
                <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 400 220" fill="none">
                  <path
                    d="M95 105 C 175 105, 190 65, 255 65"
                    stroke="currentColor"
                    className="text-primary/25"
                    strokeWidth="2"
                  />
                  <path
                    d="M95 105 C 175 105, 190 65, 255 65"
                    stroke="currentColor"
                    className="text-primary animate-dash-flow"
                    strokeWidth="2.5"
                  />
                  <path
                    d="M95 105 C 175 105, 190 155, 255 155"
                    stroke="currentColor"
                    className="text-primary/25"
                    strokeWidth="2"
                  />
                  <path
                    d="M95 105 C 175 105, 190 155, 255 155"
                    stroke="currentColor"
                    className="text-emerald-400 animate-dash-flow"
                    strokeWidth="2.5"
                  />
                  <circle cx="255" cy="65" r="4" className="fill-primary" />
                  <circle cx="255" cy="155" r="4" className="fill-emerald-400" />
                </svg>

                {/* Right Target Pills */}
                <div className="relative z-10 space-y-6">
                  <div
                    className={`flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-xs font-extrabold transition-all duration-300 ${
                      pulseStep % 2 === 0
                        ? 'border-primary bg-bg text-primary luma-glow-sm scale-105'
                        : 'border-border bg-bg text-text'
                    }`}
                  >
                    <ClockIcon className="w-3.5 h-3.5 text-primary" />
                    <span>{t.bentoSection.card3.target1}</span>
                    <span className="ml-1 rounded bg-primary/20 px-1.5 py-0.5 text-[9px] font-mono text-primary">
                      25m
                    </span>
                  </div>
                  <div
                    className={`flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-xs font-extrabold transition-all duration-300 ${
                      pulseStep % 2 === 1
                        ? 'border-emerald-400 bg-bg text-emerald-400 luma-glow-sm scale-105'
                        : 'border-border bg-bg text-text'
                    }`}
                  >
                    <TargetIcon className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{t.bentoSection.card3.target2}</span>
                    <span className="ml-1 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-mono text-emerald-400">
                      94%
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-6 space-y-1.5">
                <h3 className="text-lg font-extrabold text-text">{t.bentoSection.card3.title}</h3>
                <p className="text-xs sm:text-sm text-muted leading-relaxed">{t.bentoSection.card3.desc}</p>
              </div>
            </div>

            {/* Bento 4: Adaptive Active Hours (Auto-Cycling Interactive Time Blocks) */}
            <div className="gsap-reveal-item glass-card rounded-3xl p-6 sm:p-8 flex flex-col justify-between text-left border border-border">
              <div className="relative h-56 w-full rounded-2xl border border-border bg-surface-2 overflow-hidden flex flex-col items-center justify-between p-4">
                <div className="flex flex-wrap items-center justify-center gap-2 max-w-sm my-auto">
                  {t.bentoSection.card4.tags.map((tag, i) => {
                    const isTagActive = pulseStep % t.bentoSection.card4.tags.length === i;
                    return (
                      <span
                        key={tag.label}
                        className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all duration-300 ${
                          isTagActive
                            ? 'border border-primary bg-bg text-primary shadow-md luma-glow-sm scale-105'
                            : 'border border-border bg-surface text-muted'
                        }`}
                      >
                        {tag.label}
                      </span>
                    );
                  })}
                </div>

                {/* Live Active Window Readout Bar */}
                <div className="w-full rounded-xl border border-primary/35 bg-bg px-3.5 py-2 flex items-center justify-between text-[11px]">
                  <span className="font-extrabold text-primary flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
                    <span>{activeTagObj.label}</span>
                  </span>
                  <span className="font-mono text-muted">{activeTagObj.window}</span>
                </div>
              </div>

              <div className="pt-6 space-y-1.5">
                <h3 className="text-lg font-extrabold text-text">{t.bentoSection.card4.title}</h3>
                <p className="text-xs sm:text-sm text-muted leading-relaxed">{t.bentoSection.card4.desc}</p>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            SECTION 4: EXPANDED ACADEMIC IMPACT & LIVE TELEMETRY BARS
           ===================================================================== */}
        <section ref={impactStageRef} className="mx-auto max-w-6xl px-4 sm:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="inline-block rounded-lg border border-border bg-surface px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-widest text-primary">
              {t.impactSection.tag}
            </span>
            <h2 className="section-word-reveal text-3xl sm:text-5xl font-extrabold tracking-tight text-text leading-tight">
              <AnimatedWords text={t.impactSection.title} />
            </h2>
          </div>

          {/* Orbital Concentric Rings Visual Stage with 6 Floating Telemetry Info Bars */}
          <div className="relative mx-auto flex h-[390px] sm:h-[430px] max-w-5xl items-center justify-center overflow-hidden">
            {/* Outer Ring */}
            <div className="orbital-ring-spin gpu-layer pointer-events-none absolute h-[330px] w-[330px] sm:h-[380px] sm:w-[380px] rounded-full border border-border">
              <span className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-primary" />
              <span className="absolute bottom-10 right-6 h-2 w-2 rounded-full bg-emerald-400" />
            </div>
            {/* Middle Ring */}
            <div className="orbital-ring-spin-reverse gpu-layer pointer-events-none absolute h-[230px] w-[230px] sm:h-[270px] sm:w-[270px] rounded-full border border-primary/30">
              <span className="absolute -bottom-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-emerald-400" />
            </div>
            {/* Inner Ring */}
            <div className="pointer-events-none absolute h-[140px] w-[140px] sm:h-[165px] sm:w-[165px] rounded-full border border-primary/45 bg-primary/5" />

            {/* Center 3D Squircle Badge */}
            <div className="relative z-20 flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl border border-primary/50 bg-surface shadow-2xl luma-radiant-glow text-primary">
              <LotusIcon className="h-10 w-10 sm:h-12 sm:w-12" />
            </div>

            {/* 1. Top-Left Floating Info Bar */}
            <div className="float-callout-a gpu-layer absolute top-4 left-2 sm:left-10 z-20 glass-card rounded-2xl px-4 py-3 border border-primary/35 text-left shadow-lg max-w-[210px]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <ZapIcon className="w-3.5 h-3.5 text-primary shrink-0" />
                  <p className="text-xs font-extrabold text-text truncate">{t.impactSection.callouts.topLeftTitle}</p>
                </div>
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
              </div>
              <p className="text-[10px] font-semibold text-muted mt-0.5">{t.impactSection.callouts.topLeftSub}</p>
              <div className="mt-2 h-1 w-full rounded-full bg-border overflow-hidden">
                <div className="h-full w-full rounded-full bg-gradient-to-r from-accent-deep to-primary" />
              </div>
            </div>

            {/* 2. Top-Right Floating Info Bar */}
            <div className="float-callout-b gpu-layer absolute top-4 right-2 sm:right-10 z-20 glass-card rounded-2xl px-4 py-3 border border-primary/40 text-left shadow-lg">
              <div className="flex items-baseline gap-2">
                <p className="text-xl sm:text-2xl font-black text-text">{t.impactSection.callouts.topRightVal}</p>
                <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                  {t.impactSection.callouts.topRightBadge}
                </span>
              </div>
              <p className="text-[11px] font-semibold text-muted">{t.impactSection.callouts.topRightLabel}</p>
            </div>

            {/* 3. Mid-Left Floating Info Bar */}
            <div className="float-callout-b gpu-layer hidden md:flex absolute top-1/2 -translate-y-1/2 left-2 lg:left-6 z-20 glass-card rounded-2xl px-4 py-2.5 border border-border items-center gap-3 text-left shadow-md">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 text-primary text-xs font-bold">
                <CalendarIcon className="w-4 h-4 text-primary" />
              </span>
              <div>
                <p className="text-xs font-extrabold text-text">{t.impactSection.callouts.midLeftTitle}</p>
                <p className="text-[10px] font-mono text-primary">{t.impactSection.callouts.midLeftSub}</p>
              </div>
            </div>

            {/* 4. Mid-Right Floating Info Bar */}
            <div className="float-callout-a gpu-layer hidden md:flex absolute top-1/2 -translate-y-1/2 right-2 lg:right-6 z-20 glass-card rounded-2xl px-4 py-2.5 border border-border items-center gap-3 text-left shadow-md">
              <div className="flex items-end gap-0.5 h-5">
                {['h-2', 'h-4', 'h-3', 'h-5', 'h-2.5'].map((h, i) => (
                  <span
                    key={i}
                    className={`w-1 rounded-full bg-primary animate-equalizer ${h}`}
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <div>
                <p className="text-xs font-extrabold text-text">{t.impactSection.callouts.midRightTitle}</p>
                <p className="text-[10px] font-mono text-emerald-400">{t.impactSection.callouts.midRightSub}</p>
              </div>
            </div>

            {/* 5. Bottom-Left Floating Info Bar */}
            <div className="float-callout-b gpu-layer absolute bottom-4 left-2 sm:left-12 z-20 glass-card rounded-2xl px-4 py-3 border border-primary/40 text-left shadow-lg">
              <div className="flex items-baseline gap-2">
                <p className="text-xl sm:text-2xl font-black text-text">{t.impactSection.callouts.bottomLeftVal}</p>
                <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                  {t.impactSection.callouts.bottomLeftBadge}
                </span>
              </div>
              <p className="text-[11px] font-semibold text-muted">{t.impactSection.callouts.bottomLeftLabel}</p>
            </div>

            {/* 6. Bottom-Right Floating Info Bar */}
            <div className="float-callout-a gpu-layer absolute bottom-4 right-2 sm:right-12 z-20 glass-card rounded-2xl px-4 py-3 border border-primary/35 text-left shadow-lg min-w-[190px]">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xl sm:text-2xl font-black text-primary">{t.impactSection.callouts.bottomRightVal}</p>
                <span className="text-[10px] font-mono font-bold text-emerald-400">GRADE A</span>
              </div>
              <p className="text-[11px] font-semibold text-muted">{t.impactSection.callouts.bottomRightLabel}</p>
            </div>
          </div>

          {/* Live 4-Column Academic Telemetry Strip */}
          <div className="gsap-reveal-group grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {t.impactSection.telemetryStrip.map((bar, idx) => (
              <div
                key={bar.label}
                className="gsap-reveal-item glass-card rounded-2xl p-4 border border-border text-left space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-muted truncate pr-2">{bar.label}</span>
                  <span className="font-mono font-extrabold text-primary shrink-0">{bar.val}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent-deep via-primary to-emerald-400 transition-all duration-500"
                    style={{ width: pulseStep === idx ? '100%' : `${bar.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* 3 Impact Pillar Cards */}
          <div className="gsap-reveal-group grid grid-cols-1 md:grid-cols-3 gap-6">
            {t.impactSection.pillars.map((pillar, i) => (
              <div
                key={pillar.title}
                className="gsap-reveal-item glass-card rounded-3xl p-6 text-left space-y-3 border border-border"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface-2 text-primary">
                  {i === 0 ? (
                    <ZapIcon className="w-5 h-5 text-primary" />
                  ) : i === 1 ? (
                    <TargetIcon className="w-5 h-5 text-primary" />
                  ) : (
                    <ClockIcon className="w-5 h-5 text-primary" />
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-text">{pillar.title}</h3>
                <p className="text-xs sm:text-sm text-muted leading-relaxed">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* =====================================================================
            SECTION 5: INTERACTIVE TABBED USE-CASE BENTO STAGE
           ===================================================================== */}
        <section className="mx-auto max-w-6xl px-4 sm:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="inline-block rounded-lg border border-border bg-surface px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-widest text-primary">
              {t.useCaseSection.tag}
            </span>
            <h2 className="section-word-reveal text-3xl sm:text-5xl font-extrabold tracking-tight text-text leading-tight">
              <AnimatedWords text={t.useCaseSection.title} />
            </h2>
            <p className="text-xs sm:text-sm text-muted max-w-lg mx-auto leading-relaxed">
              {t.useCaseSection.subtitle}
            </p>
          </div>

          {/* Interactive Mode Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {t.useCaseSection.tabs.map((tab, idx) => {
              const active = activeUseCaseIdx === idx;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveUseCaseIdx(idx)}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
                    active
                      ? 'border border-primary/60 bg-surface text-text shadow-md luma-glow-sm'
                      : 'border border-border bg-surface/50 text-muted hover:text-text'
                  }`}
                >
                  {tab.id === 'timetable' ? (
                    <CalendarIcon className="w-3.5 h-3.5 text-primary" />
                  ) : tab.id === 'focus' ? (
                    <ClockIcon className="w-3.5 h-3.5 text-primary" />
                  ) : tab.id === 'deadlines' ? (
                    <TargetIcon className="w-3.5 h-3.5 text-primary" />
                  ) : (
                    <BookOpenIcon className="w-3.5 h-3.5 text-primary" />
                  )}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Multi-Card Asymmetric Bento Container */}
          <div
            ref={useCaseStageRef}
            className="rounded-[2.25rem] border border-border bg-surface-2/60 p-4 sm:p-6 shadow-xl"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              {/* Left Tall Dotted-Matrix Status Card */}
              <div
                className="usecase-bento-card lg:col-span-5 rounded-3xl border border-border bg-surface p-5 sm:p-6 flex flex-col justify-between space-y-5 text-left"
                style={{
                  backgroundImage: 'radial-gradient(rgba(219, 239, 144, 0.14) 1px, transparent 1px)',
                  backgroundSize: '14px 14px',
                }}
              >
                <div className="relative rounded-2xl border border-border bg-bg p-4 shadow-sm">
                  <p className="text-xs font-bold text-text">{currentUseCase.topStatTitle}</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-primary">{currentUseCase.topStatNum}</span>
                    <span className="text-xs font-semibold text-muted">{currentUseCase.topStatSub}</span>
                  </div>
                  <div className="absolute -bottom-3 right-4 flex h-9 w-9 items-center justify-center rounded-xl border border-primary/40 bg-surface text-primary shadow-sm">
                    <LotusIcon className="h-5 w-5" />
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-bg p-4 shadow-sm space-y-3">
                  <p className="text-xs font-extrabold text-text border-b border-border pb-2">
                    {currentUseCase.listTitle}
                  </p>
                  <div className="space-y-2.5">
                    {currentUseCase.listItems.map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-text/90 truncate pr-2">{item.name}</span>
                        <span
                          className={`inline-flex items-center gap-1.5 font-bold shrink-0 ${
                            item.active ? 'text-emerald-400' : 'text-muted'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              item.active ? 'bg-emerald-400 animate-pulse' : 'bg-muted'
                            }`}
                          />
                          <span>{item.status}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Middle Column */}
              <div className="lg:col-span-3 flex flex-col gap-5">
                <div className="usecase-bento-card flex-1 rounded-3xl p-5 flex flex-col justify-between text-left bg-accent-gradient text-black shadow-md">
                  <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest opacity-80">
                    {currentUseCase.bannerLabel}
                  </span>
                  <p className="text-lg font-black tracking-tight mt-8">{currentUseCase.bannerBrand}</p>
                </div>

                <div className="usecase-bento-card flex-1 glass-card rounded-3xl p-5 flex flex-col justify-between text-left border border-border">
                  <p className="text-2xl sm:text-3xl font-black text-text">{currentUseCase.metric1Val}</p>
                  <div className="mt-4 space-y-1">
                    <p className="text-xs font-extrabold text-text">{currentUseCase.metric1Title}</p>
                    <p className="text-[11px] text-muted leading-relaxed">{currentUseCase.metric1Desc}</p>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="lg:col-span-4 flex flex-col gap-5">
                <div className="usecase-bento-card glass-card rounded-3xl p-5 text-left space-y-2 border border-border">
                  <p className="text-2xl sm:text-3xl font-black text-primary">{currentUseCase.metric2Val}</p>
                  <p className="text-xs font-extrabold text-text">{currentUseCase.metric2Title}</p>
                  <p className="text-[11px] text-muted leading-relaxed">{currentUseCase.metric2Desc}</p>
                </div>

                <div className="usecase-bento-card flex-1 rounded-3xl border border-primary/30 bg-gradient-to-br from-surface via-surface-2 to-primary/15 p-5 flex flex-col justify-between text-left shadow-md">
                  <p className="text-xs sm:text-sm font-semibold text-text/95 italic leading-relaxed">
                    {currentUseCase.quote}
                  </p>
                  <div className="mt-4 pt-3 border-t border-border flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-fg text-xs font-black">
                      {currentUseCase.author.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-text">{currentUseCase.author}</p>
                      <p className="text-[10px] text-muted">{currentUseCase.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            SECTION 6: "All About Luma" CATEGORIZED FAQ ACCORDION
           ===================================================================== */}
        <section className="mx-auto max-w-3xl px-4 sm:px-8 space-y-10">
          <div className="text-center space-y-3">
            <span className="inline-block rounded-lg border border-border bg-surface px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-widest text-primary">
              {t.faqSection.tag}
            </span>
            <h2 className="section-word-reveal text-3xl sm:text-5xl font-extrabold tracking-tight text-text">
              <AnimatedWords text={t.faqSection.title} />
            </h2>
          </div>

          <div className="space-y-8 text-left">
            {t.faqSection.groups.map((group, gIdx) => (
              <div key={group.category} className="space-y-3">
                <p className="text-[11px] font-mono font-extrabold uppercase tracking-widest text-muted px-1">
                  {group.category}
                </p>
                <div className="space-y-2.5">
                  {group.items.map((item, iIdx) => {
                    const key = `${gIdx}-${iIdx}`;
                    const isOpen = openFaqKey === key;
                    return (
                      <div
                        key={item.q}
                        className={`glass-card rounded-2xl border transition-colors ${
                          isOpen ? 'border-primary/45 bg-surface' : 'border-border'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setOpenFaqKey(isOpen ? '' : key)}
                          className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left cursor-pointer"
                        >
                          <span className="text-xs sm:text-sm font-extrabold text-text">{item.q}</span>
                          <span
                            className={`text-xs text-muted transition-transform duration-200 ${
                              isOpen ? 'rotate-180 text-primary' : ''
                            }`}
                          >
                            ⌄
                          </span>
                        </button>
                        {isOpen && (
                          <div className="px-5 pb-4 pt-1 text-xs sm:text-sm text-muted leading-relaxed border-t border-border/60">
                            {item.hasBadge && (
                              <span className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/15 px-2 py-0.5 text-xs font-extrabold text-primary mr-1.5 align-middle">
                                <LotusIcon className="h-3.5 w-3.5" />
                                <span>Luma</span>
                              </span>
                            )}
                            <span>{item.a}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* =====================================================================
            SECTION 7: GET STARTED CTA + GIANT WATERMARK (Footer card removed per user request)
           ===================================================================== */}
        <section className="mx-auto max-w-6xl px-4 sm:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-5">
            <span className="inline-block rounded-lg border border-border bg-surface px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-widest text-primary">
              {t.finale.tag}
            </span>
            <h2 className="section-word-reveal text-3xl sm:text-5xl font-extrabold tracking-tight text-text leading-tight">
              <AnimatedWords text={t.finale.title} />
            </h2>
            <p className="text-xs sm:text-sm text-muted max-w-md mx-auto leading-relaxed">
              {t.finale.subtitle}
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3.5">
              <Link
                to="/login"
                className="rounded-xl bg-gradient-to-r from-accent-deep via-primary to-accent-lime px-7 py-3.5 text-xs sm:text-sm font-extrabold text-primary-fg shadow-lg luma-glow-sm hover:opacity-95 transition-all"
              >
                {t.finale.ctaPrimary} ↗
              </Link>
              <Link
                to="/register"
                className="rounded-xl border border-border bg-surface px-7 py-3.5 text-xs sm:text-sm font-bold text-text hover:border-primary/50 transition-colors"
              >
                {t.finale.ctaSecondary}
              </Link>
            </div>
          </div>

          {/* Giant Faded Watermark Brand Text at Bottom */}
          <div className="relative pt-4 pb-2 text-center select-none pointer-events-none overflow-hidden">
            <p className="text-[15vw] sm:text-[13vw] font-black tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-b from-text/15 via-primary/10 to-transparent">
              Luma Studio
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
