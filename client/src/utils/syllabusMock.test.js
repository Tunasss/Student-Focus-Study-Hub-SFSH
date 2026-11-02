import { describe, expect, it } from 'vitest';
import { simulateSyllabusExtraction } from './syllabusMock';

describe('simulateSyllabusExtraction', () => {
  it('extracts database chapters when course contains database keywords', () => {
    const chapters = simulateSyllabusExtraction('Hệ thống Cơ sở dữ liệu', 'de_cuong_csdl.pdf');
    expect(chapters).toHaveLength(5);
    expect(chapters[0].title).toContain('CSDL');
    expect(chapters[0].status).toBe('TODO');
    expect(chapters[1].title).toContain('Mô hình ER');
  });

  it('extracts web development chapters when course contains web keywords', () => {
    const chapters = simulateSyllabusExtraction('Web Application Development', 'syllabus_web.docx');
    expect(chapters).toHaveLength(5);
    expect(chapters[0].title).toContain('Web');
    expect(chapters[1].title).toContain('React');
  });

  it('extracts erp chapters when course contains enterprise/erp keywords', () => {
    const chapters = simulateSyllabusExtraction('Enterprise Resource Planning (ERP)', 'erp_course.pdf');
    expect(chapters).toHaveLength(5);
    expect(chapters[0].title).toContain('ERP');
    expect(chapters[2].title).toContain('SCM');
  });

  it('extracts ai/ml chapters when course contains ai or machine learning keywords', () => {
    const chapters = simulateSyllabusExtraction('Machine Learning & AI', 'ml_syllabus.txt');
    expect(chapters).toHaveLength(5);
    expect(chapters[0].title).toContain('Học máy');
  });

  it('falls back to academic structured chapters for unknown courses', () => {
    const chapters = simulateSyllabusExtraction('Philosophy 101', 'triet_hoc.pdf');
    expect(chapters).toHaveLength(5);
    expect(chapters[0].title).toContain('Chương 1: Tổng quan');
  });
});

