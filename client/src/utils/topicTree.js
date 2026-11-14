import { sortChaptersNaturally } from './chapterOrder';

export function buildTopicTree(topics = []) {
  if (!Array.isArray(topics) || topics.length === 0) return [];

  // If topics are already structured with subtopics and have no parentId links, preserve them with natural sorting
  const hasParentId = topics.some((t) => t.parentId != null);
  if (!hasParentId && topics.some((t) => Array.isArray(t.subtopics) && t.subtopics.length > 0)) {
    const list = topics.map((t) => {
      const sortedSubs = [...(t.subtopics || [])].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      let derivedStatus = t.status;
      if (sortedSubs.length > 0) {
        const allDone = sortedSubs.every((s) => s.status === 'DONE');
        const anyActive = sortedSubs.some((s) => s.status === 'DOING' || s.status === 'DONE');
        derivedStatus = allDone ? 'DONE' : (anyActive ? 'DOING' : 'TODO');
      }
      return {
        ...t,
        status: derivedStatus,
        subtopics: sortedSubs,
      };
    });
    return sortChaptersNaturally(list);
  }

  const topicMap = new Map();
  for (const t of topics) {
    topicMap.set(String(t.id), {
      ...t,
      subtopics: Array.isArray(t.subtopics) ? [...t.subtopics] : [],
    });
  }

  const chapters = [];
  for (const topic of topics) {
    const parentKey = topic.parentId != null ? String(topic.parentId) : null;
    if (parentKey && topicMap.has(parentKey)) {
      const parent = topicMap.get(parentKey);
      if (!parent.subtopics.some((s) => String(s.id) === String(topic.id))) {
        parent.subtopics.push(topicMap.get(String(topic.id)));
      }
    } else if (topic.parentId == null) {
      chapters.push(topicMap.get(String(topic.id)));
    }
  }

  for (const ch of chapters) {
    ch.subtopics.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    // Derived chapter status from its subtopics if hierarchical
    if (ch.subtopics.length > 0) {
      const allDone = ch.subtopics.every((s) => s.status === 'DONE');
      const anyActive = ch.subtopics.some((s) => s.status === 'DOING' || s.status === 'DONE');
      ch.status = allDone ? 'DONE' : (anyActive ? 'DOING' : 'TODO');
    }
  }

  return sortChaptersNaturally(chapters);
}

export function updateTopicInList(list = [], topicId, newStatus) {
  return list.map((item) => {
    if (String(item.id) === String(topicId)) {
      return { ...item, status: newStatus };
    }
    if (Array.isArray(item.subtopics) && item.subtopics.length > 0) {
      const updatedSubs = updateTopicInList(item.subtopics, topicId, newStatus);
      const allDone = updatedSubs.every((s) => s.status === 'DONE');
      const anyActive = updatedSubs.some((s) => s.status === 'DOING' || s.status === 'DONE');
      return {
        ...item,
        status: allDone ? 'DONE' : (anyActive ? 'DOING' : 'TODO'),
        subtopics: updatedSubs,
      };
    }
    return item;
  });
}

