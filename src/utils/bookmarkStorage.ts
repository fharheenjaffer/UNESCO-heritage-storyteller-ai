import { BookmarkItem } from '../types';

const STORAGE_KEY = 'heritage_storyteller_bookmarks_v1';

/**
 * Retrieve all bookmarks stored in local browser storage.
 */
export function getStoredBookmarks(): BookmarkItem[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to parse bookmarks from localStorage:', err);
    return [];
  }
}

/**
 * Save a new bookmark or return existing if already saved.
 */
export function saveBookmarkToStorage(
  item: Omit<BookmarkItem, 'id' | 'savedAt'> & { id?: string }
): BookmarkItem {
  const bookmarks = getStoredBookmarks();

  // Check if identical content or messageId already exists
  const existing = bookmarks.find(
    (b) =>
      (item.messageId && b.messageId === item.messageId) ||
      b.content.trim() === item.content.trim()
  );

  if (existing) {
    return existing;
  }

  const newBookmark: BookmarkItem = {
    id: item.id || `bm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    messageId: item.messageId,
    monumentName: item.monumentName || 'Monument Heritage Story',
    monumentLocation: item.monumentLocation || 'India',
    mode: item.mode,
    title: item.title || `${item.monumentName || 'Historical Monument'} Story`,
    content: item.content,
    savedAt: Date.now(),
  };

  const updated = [newBookmark, ...bookmarks];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save bookmark to localStorage:', err);
  }

  return newBookmark;
}

/**
 * Remove a bookmark by its unique ID.
 */
export function removeBookmarkFromStorage(bookmarkId: string): BookmarkItem[] {
  const bookmarks = getStoredBookmarks();
  const updated = bookmarks.filter((b) => b.id !== bookmarkId);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to remove bookmark from localStorage:', err);
  }
  return updated;
}

/**
 * Remove a bookmark by its message ID.
 */
export function removeBookmarkByMessageId(messageId: string): BookmarkItem[] {
  const bookmarks = getStoredBookmarks();
  const updated = bookmarks.filter((b) => b.messageId !== messageId);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to remove bookmark by message ID from localStorage:', err);
  }
  return updated;
}

/**
 * Check if a message or content is currently bookmarked.
 */
export function isMessageBookmarked(
  bookmarks: BookmarkItem[],
  messageId?: string,
  content?: string
): boolean {
  if (!bookmarks || bookmarks.length === 0) return false;
  return bookmarks.some(
    (b) =>
      (Boolean(messageId) && b.messageId === messageId) ||
      (Boolean(content) && b.content.trim() === content!.trim())
  );
}

/**
 * Clear all bookmarks from local storage.
 */
export function clearAllBookmarksFromStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear bookmarks from localStorage:', err);
  }
}
