import { useCallback, useEffect, useRef, useState } from 'react';
import { scheduleApi } from '../../lib/api';

export function IcsUploadModal({ isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleClose = useCallback(() => {
    setFile(null);
    setError(null);
    setLoading(false);
    setIsDragging(false);
    onClose();
  }, [onClose]);

  // Handle ESC key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen && !loading) {
        handleClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, handleClose]);

  if (!isOpen) return null;

  function validateAndSetFile(candidate) {
    if (!candidate) return;
    if (!candidate.name.toLowerCase().endsWith('.ics')) {
      setError('Vui lòng chọn file lịch học có định dạng .ics');
      setFile(null);
      return;
    }
    if (candidate.size > 2 * 1024 * 1024) {
      setError('Kích thước file không được vượt quá 2MB');
      setFile(null);
      return;
    }
    setError(null);
    setFile(candidate);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    validateAndSetFile(droppedFile);
  }

  function handleDragOver(e) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file || loading) return;

    setLoading(true);
    setError(null);

    try {
      const result = await scheduleApi.importIcs(file, replaceExisting);
      onSuccess?.(result);
      handleClose();
    } catch (err) {
      const msg = err.code === 'INVALID_ICS_FORMAT'
        ? err.message || 'File .ics không đúng định dạng hoặc không có sự kiện môn học'
        : err.message || 'Có lỗi xảy ra khi nhập file thời khóa biểu';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        data-testid="modal-backdrop"
        className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => !loading && handleClose()}
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-border/80 bg-surface/90 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl luma-glow-sm transition-all">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Google Calendar / iCalendar</span>
            </div>
            <h2 id="upload-modal-title" className="mt-2 text-xl font-semibold tracking-tight">
              Nhập thời khóa biểu (.ics)
            </h2>
            <p className="mt-1 text-sm text-muted">
              Tải file lịch học từ Google Calendar, Canvas hoặc Edmodo để tự động đồng bộ tuần học.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            aria-label="Đóng"
            className="rounded-full p-1.5 text-muted hover:bg-surface-2 hover:text-text transition-colors disabled:opacity-50"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div role="alert" className="mt-4 flex items-center gap-2 rounded-xl bg-danger/10 border border-danger/20 p-3 text-sm text-danger">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Dropzone */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => inputRef.current?.click()}
            className={`group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center transition-all ${
              isDragging
                ? 'border-primary bg-primary/5 scale-[0.99]'
                : file
                ? 'border-success/50 bg-success/5'
                : 'border-border hover:border-primary/50 hover:bg-surface-2/60'
            }`}
          >
            <input
              ref={inputRef}
              data-testid="ics-file-input"
              type="file"
              accept=".ics,text/calendar"
              className="hidden"
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => validateAndSetFile(e.target.files?.[0])}
            />

            <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl transition-transform group-hover:scale-110 ${
              file ? 'bg-success/20 text-success' : 'bg-primary/10 text-primary'
            }`}>
              {file ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              )}
            </div>

            {file ? (
              <div className="space-y-1">
                <p className="font-semibold text-text text-sm sm:text-base break-all">{file.name}</p>
                <p className="text-xs text-muted">{(file.size / 1024).toFixed(1)} KB • Nhấn để đổi file khác</p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="font-medium text-text text-sm sm:text-base">
                  Kéo thả file <span className="font-semibold text-primary">.ics</span> vào đây hoặc{' '}
                  <span className="text-primary underline underline-offset-2">chọn từ máy tính</span>
                </p>
                <p className="text-xs text-muted">Dung lượng tối đa 2MB</p>
              </div>
            )}
          </div>

          {/* Replace option */}
          <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
            <input
              type="checkbox"
              data-testid="replace-existing-checkbox"
              checked={replaceExisting}
              onChange={(e) => setReplaceExisting(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
            />
            <span className="text-xs text-muted">
              Xóa các lịch học trước đó (chỉ giữ thời khóa biểu trong file mới)
            </span>
          </label>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-surface-2 transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!file || loading}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-fg shadow-sm luma-glow-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
              <span>{loading ? 'Đang xử lý...' : 'Đồng bộ thời khóa biểu'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
