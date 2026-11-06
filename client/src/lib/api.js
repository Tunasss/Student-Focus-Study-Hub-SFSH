import { getToken } from './tokenStorage';
import { simulateSyllabusExtraction } from '../utils/syllabusMock';

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
  bulkSaveTopics: async (courseId, payload) => {
    const data = await apiFetch(`/api/courses/${courseId}/topics/bulk`, {
      method: 'POST',
      body: payload,
    });
    return data?.topics ?? data ?? [];
  },
  extractSyllabus: async (courseIdOrFiles, filesOrCourseName = [], courseNameFallback = '') => {
    let files;
    let courseName;
    let courseId = null;

    if (typeof courseIdOrFiles === 'number' || (typeof courseIdOrFiles === 'string' && /^\d+$/.test(courseIdOrFiles))) {
      courseId = courseIdOrFiles;
      files = Array.isArray(filesOrCourseName) ? filesOrCourseName : [filesOrCourseName];
      courseName = courseNameFallback || '';
    } else {
      files = Array.isArray(courseIdOrFiles) ? courseIdOrFiles : [courseIdOrFiles];
      courseName = typeof filesOrCourseName === 'string' ? filesOrCourseName : courseNameFallback || '';
    }

    const formData = new FormData();
    for (const f of files) {
      if (f) formData.append('files', f);
    }
    if (files[0]) {
      formData.append('file', files[0]);
    }

    const endpoint = courseId ? `/api/courses/${courseId}/syllabus/extract` : '/api/syllabus/extract';

    try {
      const data = await apiFetch(endpoint, {
        method: 'POST',
        body: formData,
      });
      if (data?.chapters) return data;
      return data?.topics || (Array.isArray(data) ? data : []);
    } catch (err) {
      if (
        err?.status === 404 ||
        err?.code === 'NETWORK_ERROR' ||
        err?.status === 501 ||
        err?.status === 502 ||
        err?.status === 503 ||
        err?.code === 'LLM_NOT_CONFIGURED' ||
        err?.code === 'LLM_UNAVAILABLE' ||
        err?.code === 'LLM_SCHEMA_INVALID'
      ) {
        if (courseId) {
          try {
            const fallbackData = await apiFetch('/api/syllabus/extract', {
              method: 'POST',
              body: formData,
            });
            if (fallbackData?.chapters) return fallbackData;
            return fallbackData?.topics || (Array.isArray(fallbackData) ? fallbackData : []);
          } catch {
            // fallback to simulation
          }
        }
        return simulateSyllabusExtraction(courseName, files);
      }
      throw err;
    }
  },
};

