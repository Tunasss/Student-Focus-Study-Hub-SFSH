import { describe, expect, test, vi } from 'vitest';
import { apiFetch, analyticsApi, scheduleApi, searchApi, sessionsApi, syllabusApi, tasksApi, UNAUTHORIZED_EVENT } from './api';
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

  test('extractSyllabus throws real ApiError when backend returns error (no mock fallback)', async () => {
    mockFetch(() => [503, fail('LLM_UNAVAILABLE', 'AI service is out of quota')]);

    const fakeFile = new File(['dummy content'], 'csdl.pdf', { type: 'application/pdf' });
    await expect(syllabusApi.extractSyllabus(1, fakeFile, 'Hệ thống Cơ sở dữ liệu')).rejects.toThrow(
      'AI service is out of quota'
    );
  });
});

describe('tasksApi', () => {
  test('listTasks forwards optional course_id and status query params', async () => {
    const mockTasks = [{ id: 1, title: 'Lab 4', urgencyBadge: 'URGENT', daysLeft: 1 }];
    const fetchMock = mockFetch(() => [200, ok({ tasks: mockTasks })]);

    const result = await tasksApi.listTasks({ courseId: 5, status: 'TODO' });
    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/tasks?course_id=5&status=TODO');
    expect(result).toEqual(mockTasks);
  });

  test('createTask posts payload and returns created task', async () => {
    const payload = { title: 'Assignment 1', dueAt: '2026-11-20T23:59:00+07:00', courseId: 5, topicId: 2, status: 'TODO' };
    const created = { id: 10, ...payload, daysLeft: 8, urgencyBadge: 'LATER' };
    const fetchMock = mockFetch(() => [201, ok({ task: created })]);

    const result = await tasksApi.createTask(payload);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/tasks');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual(payload);
    expect(result).toEqual(created);
  });

  test('updateTask sends PATCH /api/tasks/:id', async () => {
    const updated = { id: 10, status: 'DONE', urgencyBadge: null };
    const fetchMock = mockFetch(() => [200, ok({ task: updated })]);

    const result = await tasksApi.updateTask(10, { status: 'DONE' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/tasks/10');
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body)).toEqual({ status: 'DONE' });
    expect(result).toEqual(updated);
  });

  test('deleteTask sends DELETE /api/tasks/:id', async () => {
    const fetchMock = mockFetch(() => [200, ok({ id: 10 })]);

    const result = await tasksApi.deleteTask(10);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/tasks/10');
    expect(init.method).toBe('DELETE');
    expect(result).toEqual({ id: 10 });
  });
});

describe('sessionsApi, analyticsApi & searchApi', () => {
  test('logSession posts to /api/sessions and unwraps session', async () => {
    const saved = { id: 10, minutes: 25, status: 'COMPLETED', courseId: 2 };
    const fetchMock = mockFetch(() => [201, ok({ session: saved })]);

    const payload = {
      startedAt: '2026-11-12T08:00:00+07:00',
      minutes: 25,
      status: 'COMPLETED',
      courseId: 2,
    };
    const result = await sessionsApi.logSession(payload);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/sessions');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual(payload);
    expect(result).toEqual(saved);
  });

  test('listSessions builds filter query parameters', async () => {
    const fetchMock = mockFetch(() => [200, ok({ sessions: [{ id: 1, minutes: 25 }] })]);

    const result = await sessionsApi.listSessions({ courseId: 3, status: 'COMPLETED', limit: 10 });
    expect(fetchMock.mock.calls[0][0]).toContain('/api/sessions?course_id=3&status=COMPLETED&limit=10');
    expect(result).toEqual([{ id: 1, minutes: 25 }]);
  });

  test('analyticsApi sends range and tz query parameters', async () => {
    const fetchMock = mockFetch((url) => {
      if (url.includes('/overview')) return [200, ok({ totalFocusMinutes: 50 })];
      return [200, ok({ days: [{ date: '2026-11-12', focusMinutes: 50, tasksCompleted: 1 }] })];
    });

    const overview = await analyticsApi.getOverview({ range: '30d', tz: 'Asia/Ho_Chi_Minh' });
    const daily = await analyticsApi.getDailyActivity({ range: 'all', tz: 'Asia/Ho_Chi_Minh' });

    expect(fetchMock.mock.calls[0][0]).toContain('/api/analytics/overview?range=30d&tz=Asia%2FHo_Chi_Minh');
    expect(fetchMock.mock.calls[1][0]).toContain('/api/analytics/daily-activity?range=7d&tz=Asia%2FHo_Chi_Minh');
    expect(overview).toEqual({ totalFocusMinutes: 50 });
    expect(daily.days).toHaveLength(1);
  });

  test('searchApi.suggest queries /api/search/suggest', async () => {
    const fetchMock = mockFetch(() => [
      200,
      ok({ query: 'web', suggestions: [{ type: 'COURSE', id: 1, label: 'Web Dev' }] }),
    ]);

    const result = await searchApi.suggest({ q: 'web', limit: 6 });
    expect(fetchMock.mock.calls[0][0]).toContain('/api/search/suggest?q=web&limit=6');
    expect(result).toEqual([{ type: 'COURSE', id: 1, label: 'Web Dev' }]);
  });
});

