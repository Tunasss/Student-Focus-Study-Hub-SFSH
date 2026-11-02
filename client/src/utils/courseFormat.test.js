import { describe, expect, it } from 'vitest';
import {
  cleanTheoryCourseName,
  deduplicateSyllabusCourses,
  formatCourseInfo,
  getBaseTheoryCourseCode,
  isPracticeCourse,
} from './courseFormat';

describe('courseFormat utilities', () => {
  describe('getBaseTheoryCourseCode', () => {
    it('strips .1, .2 practice suffix from UIT course codes', () => {
      expect(getBaseTheoryCourseCode('MSIS4263.R11.CTTT.1')).toBe('MSIS4263.R11.CTTT');
      expect(getBaseTheoryCourseCode('MSIS4263.R11.CTTT.2')).toBe('MSIS4263.R11.CTTT');
      expect(getBaseTheoryCourseCode('CS101.N11.1')).toBe('CS101.N11');
      expect(getBaseTheoryCourseCode('IT001.TH')).toBe('IT001');
      expect(getBaseTheoryCourseCode('IT001.TH1')).toBe('IT001');
      expect(getBaseTheoryCourseCode('IT001_TH')).toBe('IT001');
    });

    it('preserves theory course codes without practice suffix', () => {
      expect(getBaseTheoryCourseCode('MSIS4263.R11.CTTT')).toBe('MSIS4263.R11.CTTT');
      expect(getBaseTheoryCourseCode('CS101.N11')).toBe('CS101.N11');
      expect(getBaseTheoryCourseCode('MSIS207')).toBe('MSIS207');
    });
  });

  describe('isPracticeCourse', () => {
    it('identifies practice classes with .1 or TH codes', () => {
      expect(isPracticeCourse({ code: 'MSIS4263.R11.CTTT.1' })).toBe(true);
      expect(isPracticeCourse({ code: 'IT001.TH' })).toBe(true);
      expect(isPracticeCourse({ name: 'Hệ thống CSDL (CS101.1)' })).toBe(true);
      expect(isPracticeCourse({ name: 'Hệ thống CSDL (Thực hành)' })).toBe(true);
    });

    it('returns false for theory classes', () => {
      expect(isPracticeCourse({ code: 'MSIS4263.R11.CTTT' })).toBe(false);
      expect(isPracticeCourse({ code: 'CS101' })).toBe(false);
      expect(isPracticeCourse({ name: 'Các ứng dụng thông minh' })).toBe(false);
    });
  });

  describe('cleanTheoryCourseName', () => {
    it('removes practice labels from course title', () => {
      expect(cleanTheoryCourseName('Các ứng dụng thông minh (Thực hành)')).toBe('Các ứng dụng thông minh');
      expect(cleanTheoryCourseName('Hệ thống Thông tin - Thực hành')).toBe('Hệ thống Thông tin');
      expect(cleanTheoryCourseName('Lập trình Web (TH)')).toBe('Lập trình Web');
      expect(cleanTheoryCourseName('CSDL')).toBe('CSDL');
    });
  });

  describe('formatCourseInfo', () => {
    it('formats course and normalizes practice code to base theory code', () => {
      const course = {
        code: 'MSIS4263.R11.CTTT.1',
        name: 'Các ứng dụng thông minh trong Kinh doanh (Thực hành)',
      };
      const info = formatCourseInfo(course);
      expect(info.code).toBe('MSIS4263.R11.CTTT');
      expect(info.name).toBe('Các ứng dụng thông minh trong Kinh doanh');
    });
  });

  describe('deduplicateSyllabusCourses', () => {
    it('deduplicates theory and practice classes, keeping only the theory class', () => {
      const courses = [
        { id: 1, code: 'MSIS4263.R11.CTTT.1', name: 'Các ứng dụng thông minh' },
        { id: 2, code: 'MSIS4263.R11.CTTT', name: 'Các ứng dụng thông minh' },
        { id: 3, code: 'CS5433.O11', name: 'Trực quan hoá dữ liệu' },
        { id: 4, code: 'CS5433.O11.1', name: 'Trực quan hoá dữ liệu (Thực hành)' },
      ];

      const result = deduplicateSyllabusCourses(courses);
      expect(result).toHaveLength(2);

      // Verify first subject kept theory class id 2 and code MSIS4263.R11.CTTT
      const msisCourse = result.find((c) => c.code === 'MSIS4263.R11.CTTT');
      expect(msisCourse).toBeDefined();
      expect(msisCourse.id).toBe(2);
      expect(msisCourse.name).toBe('Các ứng dụng thông minh');

      // Verify second subject kept theory class id 3 and code CS5433.O11
      const csCourse = result.find((c) => c.code === 'CS5433.O11');
      expect(csCourse).toBeDefined();
      expect(csCourse.id).toBe(3);
      expect(csCourse.name).toBe('Trực quan hoá dữ liệu');
    });

    it('normalizes standalone practice class when no theory class is in timetable', () => {
      const courses = [
        { id: 5, code: 'SE104.N21.PMCL.1', name: 'Nhập môn Công nghệ Phần mềm' },
      ];

      const result = deduplicateSyllabusCourses(courses);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(5);
      expect(result[0].code).toBe('SE104.N21.PMCL');
    });
  });
});

