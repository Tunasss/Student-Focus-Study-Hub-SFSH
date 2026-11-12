import { getToken } from './tokenStorage';

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');

// Fired when the API rejects our token, so AuthProvider can log the user out.
export const UNAUTHORIZED_EVENT = 'sfsh:unauthorized';

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function apiFetch(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { Accept: 'application/json' };
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body !== undefined && !isFormData) headers['Content-Type'] = 'application/json';

  const token = auth ? getToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? (isFormData ? body : JSON.stringify(body)) : undefined,
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Không kết nối được tới máy chủ');
  }

  // Every API response is the Rule 02 envelope: { success, data, error, timestamp }.
  const envelope = res.status === 204 ? null : await res.json().catch(() => null);

  if (!res.ok || envelope?.success === false) {
    const code = envelope?.error?.code || 'HTTP_ERROR';
    const message = envelope?.error?.message || `Request failed (${res.status})`;
    if (res.status === 401 && token && (code === 'UNAUTHORIZED' || code === 'TOKEN_EXPIRED')) {
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT, { detail: { code } }));
    }
    throw new ApiError(res.status, code, message);
  }

  return envelope?.data ?? null;
}

export const scheduleApi = {
  getSchedule: (from, to, tz = 'Asia/Ho_Chi_Minh') => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (tz) params.set('tz', tz);
    const query = params.toString();
    return apiFetch(`/api/schedule${query ? `?${query}` : ''}`);
  },
  getCourses: () => apiFetch('/api/courses'),
  importIcs: (file, replace = false) => {
    const formData = new FormData();
    formData.append('file', file);
    if (replace) formData.append('replace', 'true');
    const query = replace ? '?replace=true' : '';
    return apiFetch(`/api/schedule/import${query}`, {
      method: 'POST',
      body: formData,
    });
  },
};

export const syllabusApi = {
  getCourseTopics: async (courseId) => {
    const data = await apiFetch(`/api/courses/${courseId}/topics`);
    return data?.topics ?? data ?? [];
  },
  updateTopicStatus: async (topicId, status) => {
    const data = await apiFetch(`/api/topics/${topicId}`, {
      method: 'PATCH',
      body: { status },
    });
    return data?.topic ?? data;
  },
  createTopic: async (courseId, topicData) => {
    const data = await apiFetch(`/api/courses/${courseId}/topics`, {
      method: 'POST',
      body: topicData,
    });
    return data?.topic ?? data;
  },
  deleteTopic: async (topicId) => {
    const data = await apiFetch(`/api/topics/${topicId}`, {
      method: 'DELETE',
    });
    return data;
  },
  bulkSaveTopics: async (courseId, payload) => {
    const data = await apiFetch(`/api/courses/${courseId}/topics/bulk`, {
      method: 'POST',
      body: payload,
    });
    return data?.topics ?? data ?? [];
  },
  extractSyllabus: async (courseIdOrFiles, filesOrCourseName = [], _courseNameFallback = '') => {
    let files;
    let courseId = null;

    if (typeof courseIdOrFiles === 'number' || (typeof courseIdOrFiles === 'string' && /^\d+$/.test(courseIdOrFiles))) {
      courseId = courseIdOrFiles;
      files = Array.isArray(filesOrCourseName) ? filesOrCourseName : [filesOrCourseName];
    } else {
      files = Array.isArray(courseIdOrFiles) ? courseIdOrFiles : [courseIdOrFiles];
    }

    const formData = new FormData();
    for (const f of files) {
      if (f) formData.append('files', f);
    }
    if (files[0]) {
      formData.append('file', files[0]);
    }

    const endpoint = courseId ? `/api/courses/${courseId}/syllabus/extract` : '/api/syllabus/extract';

    // Directly query the API endpoint without fallback to mock data
    const data = await apiFetch(endpoint, {
      method: 'POST',
      body: formData,
    });
    if (data?.chapters) return data;
    return data?.topics || (Array.isArray(data) ? data : []);
  },
};

export const tasksApi = {
  listTasks: async ({ courseId, status } = {}) => {
    const params = new URLSearchParams();
    if (courseId) params.set('course_id', String(courseId));
    if (status) params.set('status', status);
    const query = params.toString();
    const data = await apiFetch(`/api/tasks${query ? `?${query}` : ''}`);
    return data?.tasks ?? [];
  },
  createTask: async (payload) => {
    const data = await apiFetch('/api/tasks', {
      method: 'POST',
      body: payload,
    });
    return data?.task ?? data;
  },
  updateTask: async (taskId, patch) => {
    const data = await apiFetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      body: patch,
    });
    return data?.task ?? data;
  },
  replaceTask: async (taskId, payload) => {
    const data = await apiFetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      body: payload,
    });
    return data?.task ?? data;
  },
  deleteTask: async (taskId) => {
    return apiFetch(`/api/tasks/${taskId}`, {
      method: 'DELETE',
    });
  },
};

export function getBrowserTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export const sessionsApi = {
  logSession: async (payload) => {
    const data = await apiFetch('/api/sessions', {
      method: 'POST',
      body: payload,
    });
    return data?.session ?? data;
  },
  listSessions: async ({ from, to, courseId, status, limit } = {}) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (courseId) params.set('course_id', String(courseId));
    if (status) params.set('status', status);
    if (limit) params.set('limit', String(limit));
    const query = params.toString();
    const data = await apiFetch(`/api/sessions${query ? `?${query}` : ''}`);
    return data?.sessions ?? [];
  },
};

export const analyticsApi = {
  getOverview: ({ range = '7d', tz = getBrowserTimeZone() } = {}) => {
    const params = new URLSearchParams({ range, tz });
    return apiFetch(`/api/analytics/overview?${params.toString()}`);
  },
  getDailyActivity: ({ range = '7d', tz = getBrowserTimeZone() } = {}) => {
    const safeRange = range === '30d' ? '30d' : '7d';
    const params = new URLSearchParams({ range: safeRange, tz });
    return apiFetch(`/api/analytics/daily-activity?${params.toString()}`);
  },
};

export const searchApi = {
  suggest: async ({ q, limit = 8 } = {}) => {
    const params = new URLSearchParams({ q: String(q || '').trim(), limit: String(limit) });
    const data = await apiFetch(`/api/search/suggest?${params.toString()}`);
    return data?.suggestions ?? [];
  },
};

export const recommendationApi = {
  getNextAction: ({ tz = getBrowserTimeZone() } = {}) => {
    const params = new URLSearchParams({ tz });
    return apiFetch(`/api/recommendation/next-action?${params.toString()}`);
  },
};


