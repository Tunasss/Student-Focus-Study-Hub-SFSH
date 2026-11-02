import { describe, expect, test, vi } from 'vitest';
import { apiFetch, scheduleApi, syllabusApi, UNAUTHORIZED_EVENT } from './api';
import { setToken } from './tokenStorage';
import { fail, mockFetch, ok } from '../test/utils';

describe('apiFetch', () => {
  test('sends the stored JWT as a bearer token', async () => {
    setToken('abc.def.ghi');
    const fetchMock = mockFetch(() => [200, ok({})]);

    await apiFetch('/api/auth/me');

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBe('Bearer abc.def.ghi');
  });

  test('omits the token when auth is false', async () => {
    setToken('abc.def.ghi');
    const fetchMock = mockFetch(() => [200, ok({})]);

    await apiFetch('/api/auth/login', { method: 'POST', body: {}, auth: false });

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  test('unwraps data from the response envelope', async () => {
    mockFetch(() => [200, ok({ user: { id: 1 } })]);
    await expect(apiFetch('/api/auth/me')).resolves.toEqual({ user: { id: 1 } });
  });

  test('throws ApiError with the server error code', async () => {
    mockFetch(() => [409, fail('EMAIL_TAKEN', 'taken')]);
    await expect(apiFetch('/api/auth/register', { method: 'POST', body: {}, auth: false })).rejects.toMatchObject({
      status: 409,
      code: 'EMAIL_TAKEN',
    });
  });

  test('dispatches an unauthorized event on TOKEN_EXPIRED', async () => {
    setToken('expired');
    mockFetch(() => [401, fail('TOKEN_EXPIRED', 'expired')]);
    const listener = vi.fn();
    window.addEventListener(UNAUTHORIZED_EVENT, listener);

    await expect(apiFetch('/api/auth/me')).rejects.toMatchObject({ code: 'TOKEN_EXPIRED' });

    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0][0].detail.code).toBe('TOKEN_EXPIRED');
    window.removeEventListener(UNAUTHORIZED_EVENT, listener);
  });

  test('supports FormData without overriding Content-Type', async () => {
    setToken('valid.token');
    const fetchMock = mockFetch(() => [201, ok({ coursesCreated: 1 })]);

    const formData = new FormData();
    formData.append('test', '123');

    await apiFetch('/api/schedule/import', { method: 'POST', body: formData });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers['Content-Type']).toBeUndefined();
    expect(init.body).toBe(formData);
  });
});

describe('scheduleApi', () => {
  test('getSchedule calls GET /api/schedule with formatted query parameters', async () => {
    const fetchMock = mockFetch(() => [200, ok({ events: [] })]);
    await scheduleApi.getSchedule('2026-10-26', '2026-11-02', 'Asia/Ho_Chi_Minh');

    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/schedule?from=2026-10-26&to=2026-11-02&tz=Asia%2FHo_Chi_Minh');
  });

  test('getCourses calls GET /api/courses', async () => {
    const fetchMock = mockFetch(() => [200, ok({ courses: [] })]);
    await scheduleApi.getCourses();

    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/courses');
  });
});

describe('syllabusApi', () => {
  test('getCourseTopics calls GET /api/courses/:id/topics', async () => {
    const mockTopics = [
      { id: 1, courseId: 1, sortOrder: 1, title: 'Chapter 1: Intro', status: 'DONE' },
      { id: 2, courseId: 1, sortOrder: 2, title: 'Chapter 2: Methods', status: 'TODO' },
    ];
    const fetchMock = mockFetch(() => [200, ok({ topics: mockTopics })]);

    const result = await syllabusApi.getCourseTopics(1);
    expect(fetchMock.mock.calls[0][0]).toContain('/api/courses/1/topics');
    expect(result).toEqual(mockTopics);
  });

  test('updateTopicStatus calls PATCH /api/topics/:id with status body', async () => {
    const updated = { id: 2, status: 'DOING' };
    const fetchMock = mockFetch(() => [200, ok({ topic: updated })]);

    const result = await syllabusApi.updateTopicStatus(2, 'DOING');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/topics/2');
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body)).toEqual({ status: 'DOING' });
    expect(result).toEqual(updated);
  });

  test('createTopic calls POST /api/courses/:id/topics with topicData', async () => {
    const newTopic = { title: 'Chapter 3: Advanced', description: 'Deep dive', sortOrder: 3 };
    const created = { id: 3, courseId: 1, ...newTopic, status: 'TODO' };
    const fetchMock = mockFetch(() => [201, ok({ topic: created })]);

    const result = await syllabusApi.createTopic(1, newTopic);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/courses/1/topics');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual(newTopic);
    expect(result).toEqual(created);
  });

  test('extractSyllabus calls POST /api/courses/:id/syllabus/extract with FormData file', async () => {
    const mockExtracted = [
      { title: 'Chapter 1: Intro', description: 'Basics', sortOrder: 1, status: 'TODO' },
    ];
    const fetchMock = mockFetch(() => [200, ok({ topics: mockExtracted })]);

    const fakeFile = new File(['dummy content'], 'syllabus.pdf', { type: 'application/pdf' });
    const result = await syllabusApi.extractSyllabus(1, fakeFile, 'Database');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/courses/1/syllabus/extract');
    expect(init.method).toBe('POST');
    expect(init.body).toBeInstanceOf(FormData);
    expect(result).toEqual(mockExtracted);
  });

  test('extractSyllabus falls back to simulation when backend returns 404', async () => {
    mockFetch(() => [404, fail('NOT_FOUND', 'Endpoint not implemented yet')]);

    const fakeFile = new File(['dummy content'], 'csdl.pdf', { type: 'application/pdf' });
    const result = await syllabusApi.extractSyllabus(1, fakeFile, 'Hệ thống Cơ sở dữ liệu');

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].title).toContain('CSDL');
  });
});

