import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLanguage } from '../i18n/languageContext';
import { LanguageToggle } from '../i18n/LanguageToggle';
import { ThemeToggle } from '../theme/ThemeToggle';
import { LotusIcon } from '../components/AppShell';

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
        coursesLabel: 'Active Courses',
        courses: ['MSIS207 · Web Dev', 'CS5433 · Distributed DB', 'STAT3013 · Statistics'],
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
          { name: 'MSIS207_Web_App_Syllabus.pdf', color: 'text-rose-400' },
          { name: 'CS5433_Distributed_DB_Labs.docx', color: 'text-sky-400' },
          { name: 'STAT3013_Hypothesis_Testing.pptx', color: 'text-amber-400' },
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
        tags: ['Morning Lectures', 'Afternoon Labs', 'Active Hours', 'Deep Focus', 'Evening Review', 'Custom Blocks'],
        title: 'Adaptive Active Hours',
        desc: 'Capture when you perform best and structure independent study blocks around your natural energy peaks.',
      },
    },
    impactSection: {
      tag: 'ACADEMIC IMPACT',
      title: 'More Study Done. Less Chaos to Manage.',
      callouts: {
        topRightVal: '24.5 hrs',
        topRightLabel: 'Focused study time / week.',
        bottomLeftVal: '3.2x',
        bottomLeftLabel: 'Faster Schedule Organization',
        leftPill: 'Zero Class Collisions',
        rightPill: 'Peak Focus Rhythm',
      },
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
          icon: '📅',
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
          icon: '⏱️',
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
          icon: '🎯',
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
          icon: '📚',
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
    footer: {
      tagline: 'One academic experience. Built around your daily rhythm.',
      stayConnected: 'Built for university performance.',
      col1Title: 'Workspace',
      col1Links: ['Overview Dashboard', 'Weekly Timetable', 'Pomodoro Focus Studio', 'Priority Deadlines', 'Course Syllabi'],
      col2Title: 'Capabilities',
      col2Links: ['.ICS Calendar Parser', 'Active Hours Engine', 'Ambient Soundscapes', 'Milestone Radar', 'Bilingual EN / VI'],
      col3Title: 'Account',
      col3Links: ['Sign In', 'Create Account', 'Light / Dark Mode', 'Student Guide'],
      copyright: '© 2026 Luma Academic Studio. All rights reserved.',
      legal: ['Privacy Policy', 'Terms of Service', 'Cookie Policy'],
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
        coursesLabel: 'Môn học Đang theo dõi',
        courses: ['MSIS207 · Phát triển Web', 'CS5433 · CSDL Phân tán', 'STAT3013 · Thống kê'],
        toolsLabel: ' Phân hệ Kết nối',
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
          { name: 'MSIS207_De_Cuong_Web_App.pdf', color: 'text-rose-400' },
          { name: 'CS5433_Bai_Tap_Thuc_Hanh_DB.docx', color: 'text-sky-400' },
          { name: 'STAT3013_Kiem_Dinh_Thong_Ke.pptx', color: 'text-amber-400' },
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
        tags: ['Ca học Sáng', 'Thực hành Lab', 'Khung giờ Vàng', 'Tập trung Sâu', 'Ôn bài Tối', 'Tùy chỉnh Lịch'],
        title: 'Tùy biến Khung giờ Hoạt động',
        desc: 'Thiết kế lịch trình dựa theo khung giờ hoạt động chung và linh hoạt tùy chỉnh riêng theo nhịp năng lượng của bạn.',
      },
    },
    impactSection: {
      tag: 'HIỆU QUẢ THỰC TẾ',
      title: 'Học tập Hiệu quả hơn. Giảm thiểu Rối loạn Lịch trình.',
      callouts: {
        topRightVal: '24.5 giờ',
        topRightLabel: 'Giờ học tập trung / tuần.',
        bottomLeftVal: '3.2x',
        bottomLeftLabel: 'Tốc độ Sắp xếp Lịch học',
        leftPill: 'Không Trùng Ca Học',
        rightPill: 'Nhịp Tập Trung Bền Bỉ',
      },
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
          icon: '📅',
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
          icon: '⏱️',
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
          icon: '🎯',
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
          icon: '📚',
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
    footer: {
      tagline: 'Một trải nghiệm học tập thống nhất. Xoay quanh nhịp độ của bạn.',
      stayConnected: 'Thiết kế cho hiệu suất đại học.',
      col1Title: 'Phân hệ',
      col1Links: ['Tổng quan (Overview)', 'Thời khóa biểu Tuần', 'Phòng Tập trung Focus', 'Hàng đợi Deadline', 'Đề cương Môn học'],
      col2Title: 'Tính năng',
      col2Links: ['Bóc tách Lịch .ICS', 'Khung giờ Hoạt động', 'Âm thanh Nền 432Hz', 'Radar Tiến độ', 'Song ngữ Anh / Việt'],
      col3Title: 'Tài khoản',
      col3Links: ['Đăng nhập', 'Đăng ký Miễn phí', 'Giao diện Sáng / Tối', 'Hướng dẫn Sử dụng'],
      copyright: '© 2026 Luma Academic Studio. Bảo lưu mọi quyền.',
      legal: ['Chính sách Bảo mật', 'Điều khoản Sử dụng', 'Chính sách Cookie'],
    },
  },
};

const MARQUEE_PARTNERS = [
  { icon: '📅', name: 'Google Calendar .ICS' },
  { icon: '🏛️', name: 'University Portal Sync' },
  { icon: '⏱️', name: 'Pomodoro 25/5 Studio' },
  { icon: '📚', name: 'Syllabus Tracker' },
  { icon: '🎯', name: 'Deadline Priority Radar' },
  { icon: '⚡', name: 'Active Hours Engine' },
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

  // Interactive states matching the video interactions
  const [activeCarouselIdx, setActiveCarouselIdx] = useState(1);
  const [activeUseCaseIdx, setActiveUseCaseIdx] = useState(0);
  const [openFaqKey, setOpenFaqKey] = useState('0-0');

  // Re-animate the Use Case Bento Stage whenever the user switches tabs (like 00:13 -> 00:15 in video)
  useEffect(() => {
    if (!useCaseStageRef.current) return undefined;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.usecase-bento-card',
        { y: 18, scale: 0.985, autoAlpha: 0 },
        {
          y: 0,
          scale: 1,
          autoAlpha: 1,
          duration: 0.42,
          stagger: 0.06,
          ease: 'power3.out',
          clearProps: 'opacity,visibility,transform',
        }
      );
    }, useCaseStageRef);
    return () => ctx.revert();
  }, [activeUseCaseIdx]);

  // Master GSAP Timelines & ScrollTriggers (GPU-accelerated transforms & autoAlpha only)
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Hero Entrance Timeline (00:01 - 00:03 in video)
      const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      heroTl
        .fromTo(
          '.hero-eyebrow',
          { y: 12, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.35, clearProps: 'opacity,visibility,transform' }
        )
        .fromTo(
          '.hero-title .gsap-word',
          { opacity: 0.18, y: 10 },
          { opacity: 1, y: 0, duration: 0.45, stagger: 0.055, clearProps: 'opacity,transform' },
          '-=0.15'
        )
        .fromTo(
          '.hero-subtitle',
          { y: 14, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.4, clearProps: 'opacity,visibility,transform' },
          '-=0.25'
        )
        .fromTo(
          '.hero-cta-group',
          { y: 12, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.35, clearProps: 'opacity,visibility,transform' },
          '-=0.25'
        )
        .fromTo(
          '.hero-profile-shell',
          { y: 24, scale: 0.97, autoAlpha: 0 },
          { y: 0, scale: 1, autoAlpha: 1, duration: 0.5, clearProps: 'opacity,visibility,transform' },
          '-=0.45'
        )
        .fromTo(
          '.hero-profile-item',
          { y: 14, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.35, stagger: 0.07, clearProps: 'opacity,visibility,transform' },
          '-=0.3'
        )
        .fromTo(
          '.hero-trusted-bar',
          { y: 12, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.4, clearProps: 'opacity,visibility,transform' },
          '-=0.2'
        );

      // 2. Section Headings Word-by-Word Scroll Lighting Reveal (00:05, 00:07, 00:11, 00:13, 00:18 in video)
      gsap.utils.toArray('.section-word-reveal').forEach((heading) => {
        const words = heading.querySelectorAll('.gsap-word');
        if (!words.length) return;
        gsap.fromTo(
          words,
          { opacity: 0.2, y: 8 },
          {
            opacity: 1,
            y: 0,
            duration: 0.45,
            stagger: 0.045,
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
          { y: 26, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.5,
            stagger: 0.09,
            ease: 'power3.out',
            clearProps: 'opacity,visibility,transform',
            scrollTrigger: {
              trigger: group,
              start: 'top 84%',
              once: true,
            },
          }
        );
      });

      // 4. Continuous Ambient GPU Animations (Orbital Rings & Floating Callouts at 00:11-00:12)
      gsap.to('.orbital-ring-spin', {
        rotation: 360,
        duration: 38,
        repeat: -1,
        ease: 'none',
      });

      gsap.to('.orbital-ring-spin-reverse', {
        rotation: -360,
        duration: 46,
        repeat: -1,
        ease: 'none',
      });

      gsap.to('.float-callout-a', {
        y: -7,
        duration: 3.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      gsap.to('.float-callout-b', {
        y: 7,
        duration: 3.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  const currentUseCase = t.useCaseSection.tabs[activeUseCaseIdx] || t.useCaseSection.tabs[0];

  return (
    <div
      ref={rootRef}
      className="min-h-screen bg-bg text-text selection:bg-primary/30 selection:text-text overflow-x-hidden font-sans"
    >
      {/* Top Announcement Bar (From 00:01 in video) */}
      <div className="w-full border-b border-border bg-surface-2/70 backdrop-blur-md px-4 py-2 text-center">
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

      {/* Top Navbar (Preserved layout as requested) */}
      <header className="sticky top-0 z-50 w-full px-4 sm:px-8 py-3.5 flex items-center justify-between border-b border-border bg-surface/75 backdrop-blur-2xl">
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
            SECTION 1: 2-COLUMN SPLIT HERO + PROFILE CARD + PARTNER MARQUEE (00:01 - 00:03)
           ===================================================================== */}
        <section className="relative mx-auto max-w-6xl px-4 pt-10 sm:px-8 sm:pt-16">
          {/* Ambient radial glow behind hero */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-10 left-1/4 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/12 blur-[110px]"
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Eyebrow + Word-by-Word Title + Subtitle + CTA */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <div className="hero-eyebrow inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-muted">
                <span>{t.hero.eyebrowPrefix}</span>
                <span className="relative font-extrabold text-text pb-0.5">
                  {t.hero.eyebrowHighlight}
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-gradient-to-r from-primary to-emerald-400 shadow-[0_0_8px_#dbef90]" />
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
                  className="rounded-xl border border-border bg-surface/80 px-6 py-3.5 text-xs sm:text-sm font-bold text-text hover:border-primary/50 transition-colors"
                >
                  {t.hero.ctaSecondary}
                </Link>
              </div>
            </div>

            {/* Right Column: Layered Glass Role/Schedule Profile Card (Matches 00:01-00:03 right side) */}
            <div className="lg:col-span-6">
              <div className="hero-profile-shell rounded-[2rem] border border-border bg-surface/40 p-3 sm:p-4 shadow-2xl backdrop-blur-xl">
                <div className="glass-card rounded-3xl p-6 sm:p-7 space-y-6 border border-border text-left">
                  {/* Top Icon + Title + Status Pill */}
                  <div className="hero-profile-item space-y-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/15 text-primary shadow-inner">
                      <LotusIcon className="h-6 w-6" />
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="text-xl sm:text-2xl font-extrabold text-text tracking-tight">
                        {t.hero.profileCard.title}
                      </h2>
                      <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-0.5 text-[11px] font-bold text-primary">
                        {t.hero.profileCard.badge}
                      </span>
                    </div>
                  </div>

                  {/* Description Block */}
                  <div className="hero-profile-item space-y-1.5 border-t border-border pt-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                      {t.hero.profileCard.descLabel}
                    </p>
                    <p className="text-xs sm:text-sm text-text/90 leading-relaxed">
                      {t.hero.profileCard.desc}
                    </p>
                  </div>

                  {/* Active Courses Pills (Matches "Knowledge" pills in video) */}
                  <div className="hero-profile-item space-y-2 border-t border-border pt-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                      {t.hero.profileCard.coursesLabel}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {t.hero.profileCard.courses.map((course) => (
                        <span
                          key={course}
                          className="rounded-xl border border-border bg-surface-2/90 px-3 py-1.5 text-xs font-bold text-text shadow-2xs"
                        >
                          {course}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Connected Modules Icons (Matches "Connected Tools" avatars in video) */}
                  <div className="hero-profile-item space-y-2 border-t border-border pt-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                      {t.hero.profileCard.toolsLabel}
                    </p>
                    <div className="flex items-center gap-2">
                      {[
                        { icon: '📅', label: 'ICS Sync', bg: 'bg-primary/20 border-primary/40 text-primary' },
                        { icon: '⏱️', label: 'Pomodoro', bg: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' },
                        { icon: '🎯', label: 'Deadlines', bg: 'bg-amber-500/20 border-amber-500/40 text-amber-400' },
                        { icon: '📚', label: 'Syllabus', bg: 'bg-sky-500/20 border-sky-500/40 text-sky-400' },
                      ].map((tool) => (
                        <span
                          key={tool.label}
                          title={tool.label}
                          className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm shadow-sm transition-transform hover:scale-110 ${tool.bg}`}
                        >
                          {tool.icon}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Trusted Ticker Bar (00:02 - 00:03 in video) */}
          <div className="hero-trusted-bar mt-14 pt-8 border-t border-border grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <p className="md:col-span-4 text-xs font-semibold text-muted text-left">
              {t.hero.trustedLabel}
            </p>
            <div className="md:col-span-8 flex flex-wrap items-center justify-start md:justify-end gap-6 sm:gap-8">
              {MARQUEE_PARTNERS.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-muted/80 hover:text-text transition-colors"
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =====================================================================
            SECTION 2: 3-CARD WORKFLOW CAROUSEL WITH FLOATING METRICS (00:04 - 00:06)
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
                      ? 'border-primary/50 luma-glow-sm scale-[1.01]'
                      : 'border-border opacity-90 hover:opacity-100'
                  }`}
                >
                  {/* Visual Illustration Box + Floating Metric Overlay */}
                  <div className="relative h-52 w-full rounded-2xl border border-border bg-surface-2/80 overflow-hidden p-4 flex flex-col justify-between">
                    {/* Background visual pattern per card */}
                    {idx === 0 && (
                      <div className="grid grid-cols-3 gap-2 opacity-65">
                        {['MSIS207 · E32', 'CS5433 · C206', 'STAT3013 · B5.04', 'MATH201 · C302', 'PE231 · Field', 'Active · 08:00'].map((c) => (
                          <div key={c} className="rounded-lg border border-primary/25 bg-primary/10 px-2 py-2 text-[10px] font-bold text-primary truncate">
                            {c}
                          </div>
                        ))}
                      </div>
                    )}
                    {idx === 1 && (
                      <div className="flex items-center justify-center h-full opacity-50">
                        <div className="h-28 w-28 rounded-full border-4 border-primary/40 flex items-center justify-center luma-radiant-glow">
                          <span className="text-xl font-black text-primary">25:00</span>
                        </div>
                      </div>
                    )}
                    {idx === 2 && (
                      <div className="space-y-2 opacity-65">
                        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-[10px] font-bold text-rose-400">
                          CRITICAL · Lab 4 CRUD API (Tonight)
                        </div>
                        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-[10px] font-bold text-amber-400">
                          WARNING · 2PC Protocol (In 2 days)
                        </div>
                      </div>
                    )}

                    {/* Floating Glass Overlay Metric Card (Matches 00:05-00:06 in video) */}
                    <div className="mt-auto self-end w-4/5 rounded-2xl border border-primary/35 bg-bg/90 backdrop-blur-xl p-3.5 shadow-xl">
                      <p className="text-[10px] font-bold text-muted">{card.metricLabel}</p>
                      {idx === 0 && (
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-2xl font-black text-text">{card.metricValue}</span>
                          <span className="text-[11px] font-bold text-emerald-400">{card.metricDelta}</span>
                        </div>
                      )}
                      {idx === 1 && (
                        <div className="mt-1.5 space-y-1.5">
                          <div className="flex justify-between text-xs font-extrabold">
                            <span className="text-primary">Flow State</span>
                            <span className="text-text">{card.metricValue}</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                            <div className="h-full w-[94%] rounded-full bg-gradient-to-r from-accent-deep to-primary" />
                          </div>
                        </div>
                      )}
                      {idx === 2 && (
                        <div className="mt-1 flex items-end justify-between">
                          <span className="text-xl font-black text-primary">{card.metricValue}</span>
                          <svg className="h-7 w-20 text-primary" viewBox="0 0 80 28" fill="none">
                            <path
                              d="M2 24C18 22 26 10 42 14C56 17 64 4 78 3"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
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

          {/* Carousel Controls Bar (Prev / Progress Segments / Next from 00:06 in video) */}
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
            SECTION 3: 2x2 BENTO INTELLIGENCE GRID (00:07 - 00:10 in video)
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
            {/* Bento 1: Shared Schedule Context (Hub & Spoke Nodes) */}
            <div className="gsap-reveal-item glass-card rounded-3xl p-6 sm:p-8 flex flex-col justify-between text-left border border-border">
              <div className="relative h-56 w-full rounded-2xl border border-border bg-surface-2/60 overflow-hidden flex flex-col items-center justify-center p-4">
                {/* Floating background course chips */}
                <span className="absolute top-4 left-6 rounded-lg border border-border bg-surface px-2.5 py-1 text-[10px] font-bold text-muted">
                  MSIS207 · E32
                </span>
                <span className="absolute top-5 right-6 rounded-lg border border-border bg-surface px-2.5 py-1 text-[10px] font-bold text-muted">
                  CS5433 · C206
                </span>
                <span className="absolute bottom-5 left-8 rounded-lg border border-border bg-surface px-2.5 py-1 text-[10px] font-bold text-muted">
                  STAT3013 · B5.04
                </span>
                <span className="absolute bottom-5 right-8 rounded-lg border border-border bg-surface px-2.5 py-1 text-[10px] font-bold text-muted">
                  07:30 – 16:15
                </span>

                {/* Central Hub Icon */}
                <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/50 bg-bg text-primary shadow-xl luma-glow">
                  <LotusIcon className="h-8 w-8" />
                </div>
                <span className="relative z-10 mt-3 rounded-xl border border-primary/40 bg-bg/90 px-4 py-1.5 text-xs font-extrabold text-text shadow-md">
                  {t.bentoSection.card1.hubLabel}
                </span>
              </div>

              <div className="pt-6 space-y-1.5">
                <h3 className="text-lg font-extrabold text-text">{t.bentoSection.card1.title}</h3>
                <p className="text-xs sm:text-sm text-muted leading-relaxed">{t.bentoSection.card1.desc}</p>
              </div>
            </div>

            {/* Bento 2: Structured Course Context (Document Window List) */}
            <div className="gsap-reveal-item glass-card rounded-3xl p-6 sm:p-8 flex flex-col justify-between text-left border border-border">
              <div className="relative h-56 w-full rounded-2xl border border-border bg-surface-2/60 overflow-hidden flex items-center justify-center p-4">
                <div className="w-full max-w-sm rounded-2xl border border-border bg-bg/90 p-4 shadow-xl space-y-2.5">
                  <div className="flex items-center justify-between border-b border-border pb-2 text-xs font-bold text-muted">
                    <span>{t.bentoSection.card2.windowTitle}</span>
                    <span>•••</span>
                  </div>
                  {t.bentoSection.card2.files.map((file) => (
                    <div
                      key={file.name}
                      className="flex items-center gap-2.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-text"
                    >
                      <span className={`text-sm ${file.color}`}>📄</span>
                      <span className="truncate">{file.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 space-y-1.5">
                <h3 className="text-lg font-extrabold text-text">{t.bentoSection.card2.title}</h3>
                <p className="text-xs sm:text-sm text-muted leading-relaxed">{t.bentoSection.card2.desc}</p>
              </div>
            </div>

            {/* Bento 3: Connected Study Data (SVG Bezier Flow Diagram from 00:09-00:10) */}
            <div className="gsap-reveal-item glass-card rounded-3xl p-6 sm:p-8 flex flex-col justify-between text-left border border-border">
              <div className="relative h-56 w-full rounded-2xl border border-border bg-surface-2/60 overflow-hidden flex items-center justify-between px-6 sm:px-10">
                {/* Left Source Node */}
                <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-deep to-primary text-primary-fg font-black shadow-lg luma-glow-sm">
                  <LotusIcon className="h-7 w-7" />
                </div>

                {/* SVG Connecting Bezier Curves */}
                <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 400 220" fill="none">
                  <path
                    d="M95 110 C 180 110, 190 65, 260 65"
                    stroke="currentColor"
                    className="text-primary/45"
                    strokeWidth="2"
                  />
                  <path
                    d="M95 110 C 180 110, 190 155, 260 155"
                    stroke="currentColor"
                    className="text-primary/45"
                    strokeWidth="2"
                  />
                  <circle cx="260" cy="65" r="3.5" className="fill-primary" />
                  <circle cx="260" cy="155" r="3.5" className="fill-primary" />
                </svg>

                {/* Right Target Pills */}
                <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-2.5 rounded-xl border border-border bg-bg/95 px-4 py-2.5 text-xs font-extrabold text-text shadow-lg">
                    <span>⏱️</span>
                    <span>{t.bentoSection.card3.target1}</span>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-xl border border-border bg-bg/95 px-4 py-2.5 text-xs font-extrabold text-text shadow-lg">
                    <span>🎯</span>
                    <span>{t.bentoSection.card3.target2}</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 space-y-1.5">
                <h3 className="text-lg font-extrabold text-text">{t.bentoSection.card3.title}</h3>
                <p className="text-xs sm:text-sm text-muted leading-relaxed">{t.bentoSection.card3.desc}</p>
              </div>
            </div>

            {/* Bento 4: Adaptive Active Hours (Floating Schedule Pills + Glowing Badge from 00:10) */}
            <div className="gsap-reveal-item glass-card rounded-3xl p-6 sm:p-8 flex flex-col justify-between text-left border border-border">
              <div className="relative h-56 w-full rounded-2xl border border-border bg-surface-2/60 overflow-hidden flex flex-col items-center justify-center p-5 gap-3">
                <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-sm">
                  {t.bentoSection.card4.tags.map((tag, i) => (
                    <span
                      key={tag}
                      className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                        i === 2
                          ? 'border border-primary/60 bg-bg text-primary shadow-lg luma-glow-sm scale-105'
                          : 'border border-border bg-surface/70 text-muted'
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-2 flex h-12 w-12 items-center justify-center rounded-full border border-primary/40 bg-primary/15 text-primary shadow-md">
                  ⚡
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
            SECTION 4: ORBITAL RADAR RINGS & IMPACT METRICS (00:11 - 00:12 in video)
           ===================================================================== */}
        <section className="mx-auto max-w-6xl px-4 sm:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="inline-block rounded-lg border border-border bg-surface px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-widest text-primary">
              {t.impactSection.tag}
            </span>
            <h2 className="section-word-reveal text-3xl sm:text-5xl font-extrabold tracking-tight text-text leading-tight">
              <AnimatedWords text={t.impactSection.title} />
            </h2>
          </div>

          {/* Orbital Concentric Rings Visual Stage */}
          <div className="relative mx-auto flex h-[340px] sm:h-[380px] max-w-4xl items-center justify-center overflow-hidden">
            {/* Outer Ring */}
            <div className="orbital-ring-spin pointer-events-none absolute h-[320px] w-[320px] sm:h-[360px] sm:w-[360px] rounded-full border border-border/80">
              <span className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_12px_#dbef90]" />
            </div>
            {/* Middle Ring */}
            <div className="orbital-ring-spin-reverse pointer-events-none absolute h-[230px] w-[230px] sm:h-[260px] sm:w-[260px] rounded-full border border-primary/25">
              <span className="absolute -bottom-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-emerald-400" />
            </div>
            {/* Inner Ring */}
            <div className="pointer-events-none absolute h-[140px] w-[140px] sm:h-[160px] sm:w-[160px] rounded-full border border-primary/40 bg-primary/5" />

            {/* Center 3D Squircle Badge */}
            <div className="relative z-20 flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl border border-primary/50 bg-surface shadow-2xl luma-radiant-glow text-primary">
              <LotusIcon className="h-10 w-10 sm:h-12 sm:w-12" />
            </div>

            {/* Floating Callout Top-Right (Matches "40+hrs" card at 00:11-00:12) */}
            <div className="float-callout-a gpu-layer absolute top-6 right-4 sm:right-16 z-20 glass-card rounded-2xl px-4 py-3 border border-primary/40 text-left shadow-xl">
              <p className="text-xl sm:text-2xl font-black text-text">{t.impactSection.callouts.topRightVal}</p>
              <p className="text-[11px] font-semibold text-muted">{t.impactSection.callouts.topRightLabel}</p>
            </div>

            {/* Floating Callout Bottom-Left (Matches "3.2x" card at 00:11-00:12) */}
            <div className="float-callout-b gpu-layer absolute bottom-8 left-4 sm:left-16 z-20 glass-card rounded-2xl px-4 py-3 border border-primary/40 text-left shadow-xl">
              <p className="text-xl sm:text-2xl font-black text-text">{t.impactSection.callouts.bottomLeftVal}</p>
              <p className="text-[11px] font-semibold text-muted">{t.impactSection.callouts.bottomLeftLabel}</p>
            </div>

            {/* Subtle Side Pills */}
            <div className="hidden md:block absolute top-1/3 left-4 rounded-xl border border-border bg-surface/60 px-3.5 py-2 text-xs font-semibold text-muted">
              {t.impactSection.callouts.leftPill}
            </div>
            <div className="hidden md:block absolute bottom-1/4 right-4 rounded-xl border border-border bg-surface/60 px-3.5 py-2 text-xs font-semibold text-muted">
              {t.impactSection.callouts.rightPill}
            </div>
          </div>

          {/* 3 Impact Pillar Cards (Bottom of 00:12 in video) */}
          <div className="gsap-reveal-group grid grid-cols-1 md:grid-cols-3 gap-6">
            {t.impactSection.pillars.map((pillar, i) => (
              <div
                key={pillar.title}
                className="gsap-reveal-item glass-card rounded-3xl p-6 text-left space-y-3 border border-border"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface-2 text-primary font-bold">
                  {i === 0 ? '⚡' : i === 1 ? '🎯' : '🔄'}
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-text">{pillar.title}</h3>
                <p className="text-xs sm:text-sm text-muted leading-relaxed">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* =====================================================================
            SECTION 5: INTERACTIVE TABBED USE-CASE BENTO STAGE (00:13 - 00:15 in video)
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

          {/* Interactive Mode Tabs (Matches Finance / Healthcare / Retail / Edutech tabs at 00:13) */}
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
                      : 'border border-border bg-surface/40 text-muted hover:text-text'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Multi-Card Asymmetric Bento Container (Matches 00:14-00:15 in video) */}
          <div
            ref={useCaseStageRef}
            className="rounded-[2.25rem] border border-border bg-surface/40 p-4 sm:p-6 shadow-2xl backdrop-blur-xl"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              {/* Left Tall Dotted-Matrix Status Card (5 cols) */}
              <div
                className="usecase-bento-card lg:col-span-5 rounded-3xl border border-border bg-surface-2/90 p-5 sm:p-6 flex flex-col justify-between space-y-5 text-left"
                style={{
                  backgroundImage: 'radial-gradient(rgba(219, 239, 144, 0.14) 1px, transparent 1px)',
                  backgroundSize: '14px 14px',
                }}
              >
                {/* Top Sub-Card */}
                <div className="relative rounded-2xl border border-border bg-bg/90 p-4 shadow-md">
                  <p className="text-xs font-bold text-text">{currentUseCase.topStatTitle}</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-primary">{currentUseCase.topStatNum}</span>
                    <span className="text-xs font-semibold text-muted">{currentUseCase.topStatSub}</span>
                  </div>
                  <div className="absolute -bottom-3 right-4 flex h-9 w-9 items-center justify-center rounded-xl border border-primary/40 bg-surface text-primary shadow-md">
                    <LotusIcon className="h-5 w-5" />
                  </div>
                </div>

                {/* Bottom Sub-Card: Active List with Running green dots */}
                <div className="rounded-2xl border border-border bg-bg/90 p-4 shadow-md space-y-3">
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

              {/* Middle Column: Gradient Brand Card + Hours Stat Card (3.5 -> 3 cols) */}
              <div className="lg:col-span-3 flex flex-col gap-5">
                <div className="usecase-bento-card flex-1 rounded-3xl p-5 flex flex-col justify-between text-left bg-accent-gradient text-black shadow-lg">
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

              {/* Right Column: Percentage Stat Card + Student Testimonial Card (4 cols) */}
              <div className="lg:col-span-4 flex flex-col gap-5">
                <div className="usecase-bento-card glass-card rounded-3xl p-5 text-left space-y-2 border border-border">
                  <p className="text-2xl sm:text-3xl font-black text-primary">{currentUseCase.metric2Val}</p>
                  <p className="text-xs font-extrabold text-text">{currentUseCase.metric2Title}</p>
                  <p className="text-[11px] text-muted leading-relaxed">{currentUseCase.metric2Desc}</p>
                </div>

                <div className="usecase-bento-card flex-1 rounded-3xl border border-primary/30 bg-gradient-to-br from-surface via-surface-2 to-primary/15 p-5 flex flex-col justify-between text-left shadow-lg">
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
            SECTION 6: "All About Luma" CATEGORIZED FAQ ACCORDION (00:16 - 00:17 in video)
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
            SECTION 7: GET STARTED CTA + ROUNDED FOOTER + GIANT WATERMARK (00:18 - 00:21)
           ===================================================================== */}
        <section className="mx-auto max-w-6xl px-4 sm:px-8 space-y-14">
          {/* Centered Get Started CTA Block (00:18) */}
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

          {/* Rounded Multi-Column Footer Card (00:19 - 00:20) */}
          <footer className="glass-card rounded-[2rem] p-8 sm:p-12 border border-border text-left space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Brand Column */}
              <div className="md:col-span-5 space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                    <LotusIcon className="h-5 w-5" />
                  </div>
                  <span className="text-lg font-extrabold tracking-tight text-text">Luma</span>
                </div>
                <p className="text-xs sm:text-sm text-muted max-w-xs leading-relaxed">
                  {t.footer.tagline}
                </p>
                <div className="pt-4 space-y-2">
                  <p className="text-[11px] font-semibold text-muted">{t.footer.stayConnected}</p>
                  <div className="flex items-center gap-2">
                    {['📅', '⏱️', '🎯', '📚'].map((ic) => (
                      <span
                        key={ic}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface-2 text-xs"
                      >
                        {ic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Links Columns */}
              <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <p className="text-xs font-extrabold text-text">{t.footer.col1Title}</p>
                  <ul className="space-y-2 text-xs text-muted">
                    {t.footer.col1Links.map((item) => (
                      <li key={item}>
                        <Link to="/login" className="hover:text-primary transition-colors">
                          {item}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-extrabold text-text">{t.footer.col2Title}</p>
                  <ul className="space-y-2 text-xs text-muted">
                    {t.footer.col2Links.map((item) => (
                      <li key={item} className="hover:text-text transition-colors">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-extrabold text-text">{t.footer.col3Title}</p>
                  <ul className="space-y-2 text-xs text-muted">
                    {t.footer.col3Links.map((item) => (
                      <li key={item}>
                        <Link to="/login" className="hover:text-primary transition-colors">
                          {item}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border flex flex-wrap items-center justify-between gap-4 text-[11px] text-muted">
              <span>{t.footer.copyright}</span>
              <div className="flex items-center gap-5">
                {t.footer.legal.map((item) => (
                  <span key={item} className="hover:text-text cursor-pointer transition-colors">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </footer>

          {/* Giant Faded Watermark Brand Text at Bottom (Matches giant watermark at 00:20 - 00:21) */}
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
