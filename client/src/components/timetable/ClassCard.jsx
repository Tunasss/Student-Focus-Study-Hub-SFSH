export function ClassCard({ event }) {
  const {
    courseCode,
    courseName,
    location,
    start,
    end,
    top,
    height,
    leftPercent,
    widthPercent,
    palette,
  } = event;

  const timeRange = `${start?.split('T')[1]?.slice(0, 5) || start || ''} – ${end?.split('T')[1]?.slice(0, 5) || end || ''}`;
  const isCompact = height < 54;

  return (
    <article
      data-testid="class-card"
      className={`absolute z-10 select-none overflow-hidden rounded-xl border p-2 shadow-xs transition-all duration-150 hover:z-20 hover:scale-[1.01] hover:shadow-md ${palette.card}`}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        left: `calc(${leftPercent}% + 2px)`,
        width: `calc(${widthPercent}% - 4px)`,
      }}
      title={`${courseCode ? `${courseCode}: ` : ''}${courseName} (${timeRange})${location ? ` - ${location}` : ''}`}
    >
      <div className="flex h-full flex-col justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {courseCode && (
              <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-semibold leading-none ${palette.badge}`}>
                {courseCode}
              </span>
            )}
            <span className="truncate text-xs font-medium leading-tight opacity-90">
              {courseName}
            </span>
          </div>

          {!isCompact && (
            <div className="mt-1 flex items-center gap-1 text-[11px] opacity-75">
              <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="truncate">{timeRange}</span>
            </div>
          )}
        </div>

        {!isCompact && location && (
          <div className="mt-auto flex items-center gap-1 text-[11px] opacity-75 truncate">
            <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{location}</span>
          </div>
        )}
      </div>
    </article>
  );
}
