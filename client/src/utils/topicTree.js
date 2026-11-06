export function buildTopicTree(topics = []) {
  if (!Array.isArray(topics) || topics.length === 0) return [];

  // If topics are already structured with subtopics and have no parentId links, preserve them
  const hasParentId = topics.some((t) => t.parentId != null);
  if (!hasParentId && topics.some((t) => Array.isArray(t.subtopics) && t.subtopics.length > 0)) {
    return topics.map((t) => ({ ...t, subtopics: [...(t.subtopics || [])] }));
  }

  const topicMap = new Map();
  for (const t of topics) {
    topicMap.set(t.id, {
      ...t,
      subtopics: Array.isArray(t.subtopics) ? [...t.subtopics] : [],
    });
  }

  const chapters = [];
  for (const topic of topics) {
    if (topic.parentId != null && topicMap.has(topic.parentId)) {
      const parent = topicMap.get(topic.parentId);
      if (!parent.subtopics.some((s) => s.id === topic.id)) {
        parent.subtopics.push(topicMap.get(topic.id));
      }
    } else {
      chapters.push(topicMap.get(topic.id));
    }
  }

  for (const ch of chapters) {
    ch.subtopics.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  chapters.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  return chapters;
}

export function updateTopicInList(list = [], topicId, newStatus) {
  return list.map((item) => {
    if (item.id === topicId) {
      return { ...item, status: newStatus };
    }
    if (Array.isArray(item.subtopics) && item.subtopics.length > 0) {
      return {
        ...item,
        subtopics: updateTopicInList(item.subtopics, topicId, newStatus),
      };
    }
    return item;
  });
}

