import React, { useMemo, useState } from "react";

const pad2 = (value) => String(value).padStart(2, "0");

const toDateKey = (date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const parseDateKey = (dateKey) => {
  const [year, month, day] = String(dateKey || "").split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const getWeekStart = (date) => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
};

const monthTitle = (date) =>
  date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

const formatLongDate = (date) =>
  date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const EVENT_COLOR_PALETTE = [
  "bg-sky-500/20 border-sky-400/50 text-sky-200",
  "bg-emerald-500/20 border-emerald-400/50 text-emerald-200",
  "bg-violet-500/20 border-violet-400/50 text-violet-200",
  "bg-amber-500/20 border-amber-400/50 text-amber-200",
  "bg-pink-500/20 border-pink-400/50 text-pink-200",
  "bg-cyan-500/20 border-cyan-400/50 text-cyan-200",
  "bg-rose-500/20 border-rose-400/50 text-rose-200",
];

const TAG_COLOR_OPTIONS = [
  { key: "", label: "Auto" },
  { key: "sky", label: "Sky", className: "bg-sky-500/20 border-sky-400/50 text-sky-200" },
  {
    key: "emerald",
    label: "Emerald",
    className: "bg-emerald-500/20 border-emerald-400/50 text-emerald-200",
  },
  {
    key: "violet",
    label: "Violet",
    className: "bg-violet-500/20 border-violet-400/50 text-violet-200",
  },
  { key: "amber", label: "Amber", className: "bg-amber-500/20 border-amber-400/50 text-amber-200" },
  { key: "pink", label: "Pink", className: "bg-pink-500/20 border-pink-400/50 text-pink-200" },
  { key: "cyan", label: "Cyan", className: "bg-cyan-500/20 border-cyan-400/50 text-cyan-200" },
  { key: "rose", label: "Rose", className: "bg-rose-500/20 border-rose-400/50 text-rose-200" },
  { key: "slate", label: "Slate", className: "bg-slate-500/20 border-slate-400/50 text-slate-200" },
];

const TAG_COLOR_MAP = TAG_COLOR_OPTIONS.reduce((acc, option) => {
  if (!option.key || !option.className) return acc;
  acc[option.key] = option.className;
  return acc;
}, {});

const STATUS_COLOR_MAP = {
  Planned: "bg-blue-500/20 border-blue-400/50 text-blue-200",
  "In Progress": "bg-yellow-500/20 border-yellow-400/50 text-yellow-200",
  Review: "bg-purple-500/20 border-purple-400/50 text-purple-200",
  Done: "bg-emerald-500/20 border-emerald-400/50 text-emerald-200",
};

const hashText = (text) =>
  String(text || "")
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

const getEventTagColor = (entry) => {
  const customColor = TAG_COLOR_MAP[String(entry?.tagColor || "")];
  if (customColor) return customColor;
  const statusColor = STATUS_COLOR_MAP[entry?.status];
  if (statusColor) return statusColor;
  const hash = hashText(entry?.topic);
  return EVENT_COLOR_PALETTE[hash % EVENT_COLOR_PALETTE.length];
};

const shortTime = (timeValue) => {
  if (!timeValue) return "";
  return String(timeValue);
};

const formatTimeLabel = (timeValue) => {
  if (!timeValue) return "Anytime";
  const [hourText, minuteText] = String(timeValue).split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return String(timeValue);
  return `${pad2(hour)}:${pad2(minute)}`;
};

const TIME_OPTIONS = [
  "",
  ...Array.from({ length: 48 }, (_, index) => {
    const hour = Math.floor(index / 2);
    const minute = index % 2 === 0 ? 0 : 30;
    return `${pad2(hour)}:${pad2(minute)}`;
  }),
];

export default function BlogPlannerCalendar({
  entries,
  onChange,
  isSaving = false,
}) {
  const safeEntries = Array.isArray(entries) ? entries : [];
  const todayKey = toDateKey(new Date());
  const [currentMonth, setCurrentMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);
  const [mobileViewMode, setMobileViewMode] = useState(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      return "day";
    }
    return "month";
  });
  const [topicDraft, setTopicDraft] = useState("");
  const [assigneeDraft, setAssigneeDraft] = useState("");
  const [timeDraft, setTimeDraft] = useState("");
  const [tagColorDraft, setTagColorDraft] = useState("");
  const [commentDraftById, setCommentDraftById] = useState({});
  const [draggedEntryId, setDraggedEntryId] = useState(null);
  const [dragOverDateKey, setDragOverDateKey] = useState("");

  const selectedDate = parseDateKey(selectedDateKey) || new Date();

  const entriesByDate = useMemo(() => {
    const grouped = {};
    safeEntries.forEach((item) => {
      const dateKey = String(item?.date || "");
      if (!dateKey) return;
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(item);
    });
    Object.keys(grouped).forEach((dateKey) => {
      grouped[dateKey].sort((a, b) => {
        if (!a?.time && b?.time) return 1;
        if (a?.time && !b?.time) return -1;
        if (a?.time && b?.time) return String(a.time).localeCompare(String(b.time));
        return String(a?.topic || "").localeCompare(String(b?.topic || ""));
      });
    });
    return grouped;
  }, [safeEntries]);

  const monthDays = useMemo(() => {
    const firstDay = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1,
    );
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const gridStart = new Date(firstDay);
    gridStart.setDate(firstDay.getDate() - startDay);

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      const dateKey = toDateKey(date);
      const inCurrentMonth = date.getMonth() === currentMonth.getMonth();
      return {
        date,
        dateKey,
        inCurrentMonth,
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        count: (entriesByDate[dateKey] || []).length,
      };
    });
  }, [currentMonth, entriesByDate]);

  const selectedEntries = entriesByDate[selectedDateKey] || [];

  const moveMonthBy = (delta) => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1),
    );
  };

  const jumpToToday = () => {
    const now = new Date();
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDateKey(toDateKey(now));
  };

  const moveSelectedDayBy = (delta) => {
    const baseDate = parseDateKey(selectedDateKey) || new Date();
    const nextDate = new Date(baseDate);
    nextDate.setDate(baseDate.getDate() + delta);
    setSelectedDateKey(toDateKey(nextDate));
    setCurrentMonth(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
  };

  const weekEntries = useMemo(() => {
    const weekStart = getWeekStart(selectedDate);
    const items = [];

    for (let i = 0; i < 7; i += 1) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      const dayKey = toDateKey(day);
      (entriesByDate[dayKey] || []).forEach((entry) => {
        items.push({ entry, date: day });
      });
    }

    return items;
  }, [entriesByDate, selectedDate]);

  const updateEntries = (nextEntries) => {
    onChange(Array.isArray(nextEntries) ? nextEntries : []);
  };

  const handleAddEntry = () => {
    const topic = topicDraft.trim();
    if (!topic) return;

    const next = [
      ...safeEntries,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        date: selectedDateKey,
        topic,
        time: timeDraft,
        assignee: assigneeDraft.trim(),
        tagColor: tagColorDraft,
        status: "Planned",
        comments: [],
        createdAt: new Date().toISOString(),
      },
    ];

    updateEntries(next);
    setTopicDraft("");
    setAssigneeDraft("");
    setTimeDraft("");
    setTagColorDraft("");
  };

  const handleUpdateEntry = (id, field, value) => {
    const next = safeEntries.map((item) =>
      item.id === id ? { ...item, [field]: value } : item,
    );
    updateEntries(next);
  };

  const handleDeleteEntry = (id) => {
    updateEntries(safeEntries.filter((item) => item.id !== id));
  };

  const handleDuplicateEntry = (id) => {
    const source = safeEntries.find((item) => item.id === id);
    if (!source) return;

    const next = [
      ...safeEntries,
      {
        ...source,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
      },
    ];

    updateEntries(next);
  };

  const handleAddComment = (id) => {
    const draft = String(commentDraftById[id] || "").trim();
    if (!draft) return;

    const next = safeEntries.map((item) => {
      if (item.id !== id) return item;
      const comments = Array.isArray(item.comments) ? item.comments : [];
      return {
        ...item,
        comments: [...comments, draft],
      };
    });

    updateEntries(next);
    setCommentDraftById((prev) => ({ ...prev, [id]: "" }));
  };

  const handleEntryDragStart = (entryId) => {
    setDraggedEntryId(entryId);
  };

  const handleDropOnDate = (dateKey) => {
    if (!draggedEntryId || !dateKey) return;

    const next = safeEntries.map((item) =>
      item.id === draggedEntryId ? { ...item, date: dateKey } : item,
    );

    updateEntries(next);
    setDraggedEntryId(null);
    setDragOverDateKey("");
    setSelectedDateKey(dateKey);
  };

  return (
    <div className="space-y-4">
      <div className="bg-zinc-950 rounded-lg border border-zinc-800 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Blog Planner Calendar</h2>
            <p className="text-xs text-zinc-400 mt-1">
              Plan topics by day or week, assign writers, and track editorial notes.
            </p>
          </div>
          <div className="text-xs text-zinc-400">
            {isSaving ? "Saving..." : "Auto-saving planner"}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <div className="xl:col-span-7 bg-zinc-900/80 backdrop-blur-sm rounded-lg border border-zinc-700 p-3">
            <div className="hidden md:flex items-center justify-between mb-3">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveMonthBy(-1)}
                  className="px-2 py-1 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-md"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={jumpToToday}
                  className="px-2 py-1 text-xs text-zinc-200 hover:text-white hover:bg-zinc-800 rounded-md border border-zinc-600"
                >
                  Today
                </button>
              </div>

              <p className="text-sm md:text-base font-semibold tracking-tight text-white">
                {monthTitle(currentMonth)}
              </p>

              <button
                type="button"
                onClick={() => moveMonthBy(1)}
                className="px-2 py-1 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-md"
              >
                Next
              </button>
            </div>

            <div className="md:hidden mb-3 flex items-center justify-between gap-2">
              {mobileViewMode === "day" ? (
                <>
                  <button
                    type="button"
                    onClick={() => moveSelectedDayBy(-1)}
                    className="px-2 py-1 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-md"
                  >
                    Prev Day
                  </button>

                  <p className="text-xs font-semibold tracking-tight text-white truncate">
                    {formatLongDate(selectedDate)}
                  </p>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={jumpToToday}
                      className="px-2 py-1 text-xs text-zinc-200 hover:text-white hover:bg-zinc-800 rounded-md border border-zinc-600"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSelectedDayBy(1)}
                      className="px-2 py-1 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-md"
                    >
                      Next
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => moveMonthBy(-1)}
                    className="px-2 py-1 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-md"
                  >
                    Prev
                  </button>

                  <p className="text-xs font-semibold tracking-tight text-white">{monthTitle(currentMonth)}</p>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={jumpToToday}
                      className="px-2 py-1 text-xs text-zinc-200 hover:text-white hover:bg-zinc-800 rounded-md border border-zinc-600"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => moveMonthBy(1)}
                      className="px-2 py-1 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-md"
                    >
                      Next
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="md:hidden mb-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileViewMode("day")}
                className={`px-2 py-1 rounded-md text-xs border ${
                  mobileViewMode === "day"
                    ? "bg-blue-500/20 border-blue-400/50 text-blue-200"
                    : "bg-zinc-900 border-zinc-700 text-zinc-300"
                }`}
              >
                Day
              </button>
              <button
                type="button"
                onClick={() => setMobileViewMode("month")}
                className={`px-2 py-1 rounded-md text-xs border ${
                  mobileViewMode === "month"
                    ? "bg-blue-500/20 border-blue-400/50 text-blue-200"
                    : "bg-zinc-900 border-zinc-700 text-zinc-300"
                }`}
              >
                Month
              </button>
            </div>

            {mobileViewMode === "day" && (
              <div className="md:hidden rounded-lg border border-zinc-800 bg-zinc-950/70 p-2.5 space-y-2">
                <p className="text-xs text-zinc-300 font-medium">Tasks for {formatLongDate(selectedDate)}</p>
                {selectedEntries.length === 0 ? (
                  <p className="text-xs text-zinc-500">No tasks for this day.</p>
                ) : (
                  <div className="space-y-1.5 max-h-52 overflow-y-auto hide-scrollbar pr-1">
                    {selectedEntries.map((entry) => (
                      <div
                        key={`${entry.id}-mobile-day`}
                        className="rounded bg-zinc-900/80 border border-zinc-800 px-2 py-1.5"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          {entry.time && (
                            <span className="inline-flex shrink-0 font-mono text-[11px] text-zinc-200">
                              {entry.time}
                            </span>
                          )}
                          <span
                            className={`inline-flex rounded border px-1.5 py-0.5 text-[11px] font-semibold leading-tight ${getEventTagColor(entry)}`}
                          >
                            {entry.topic || "Untitled"}
                          </span>
                        </div>
                        <p className="text-[10px] opacity-90 mt-0.5">
                          {entry.assignee || "Unassigned"}
                          {entry.status ? ` • ${entry.status}` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div
              className={`${mobileViewMode === "day" ? "hidden md:block" : "block"} bg-zinc-950/80 rounded-lg border border-zinc-800 p-1`}
            >
              <div className="grid grid-cols-7 gap-px mb-px bg-zinc-700/80 rounded-t-md overflow-hidden">
                {DAY_NAMES.map((day) => (
                  <div
                    key={day}
                    className="text-center text-[10px] md:text-[11px] font-medium text-zinc-300 py-2 bg-zinc-950"
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-px bg-zinc-700/80 rounded-b-md overflow-hidden">
              {monthDays.map((cell) => (
                <button
                  key={cell.dateKey}
                  type="button"
                  onClick={() => setSelectedDateKey(cell.dateKey)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (draggedEntryId) {
                      setDragOverDateKey(cell.dateKey);
                    }
                  }}
                  onDragLeave={() => {
                    if (dragOverDateKey === cell.dateKey) {
                      setDragOverDateKey("");
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDropOnDate(cell.dateKey);
                  }}
                  className={`h-20 md:h-24 p-1 text-left align-top transition-colors overflow-hidden ${
                    cell.dateKey === selectedDateKey
                      ? "bg-blue-500/15 ring-1 ring-inset ring-blue-400/40"
                      : dragOverDateKey === cell.dateKey
                        ? "bg-emerald-600/10"
                      : cell.inCurrentMonth
                        ? cell.isWeekend
                          ? "bg-zinc-900/90 hover:bg-zinc-800"
                          : "bg-zinc-900 hover:bg-zinc-800"
                        : "bg-zinc-950 text-zinc-600"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                        cell.dateKey === selectedDateKey
                          ? "text-white font-semibold bg-blue-500/90"
                          : cell.dateKey === todayKey
                            ? "text-blue-300 font-semibold"
                            : "text-zinc-200"
                      }`}
                    >
                      {cell.date.getDate()}
                    </span>
                    {cell.dateKey === todayKey && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    )}
                  </div>

                  <div className="space-y-1">
                    {(entriesByDate[cell.dateKey] || [])
                      .slice(0, 2)
                      .map((entry) => (
                        <div
                          key={`${cell.dateKey}-${entry.id}`}
                          className={`rounded-sm border-l-[3px] border-l-current px-1.5 py-0.5 text-[10px] leading-tight truncate ${getEventTagColor(entry)}`}
                        >
                          <span className="font-semibold">
                            {entry.time ? `${shortTime(entry.time)} ` : ""}
                          </span>
                          <span className="truncate">{entry.topic || "Untitled"}</span>
                        </div>
                      ))}

                    {cell.count > 2 && (
                      <div className="text-[10px] text-zinc-400 px-1 font-medium">
                        +{cell.count - 2} more
                      </div>
                    )}
                  </div>
                </button>
              ))}
              </div>
            </div>
          </div>

          <div className="xl:col-span-5 bg-zinc-900 rounded-lg border border-zinc-800 p-3 space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-white">{formatLongDate(selectedDate)}</h3>
              <p className="text-xs text-zinc-400 mt-1">Add a topic and assign the writer for this date.</p>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={topicDraft}
                onChange={(e) => setTopicDraft(e.target.value)}
                placeholder="Blog topic to write"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded text-white text-sm focus:outline-none focus:border-red-500"
              />
              <input
                type="text"
                value={assigneeDraft}
                onChange={(e) => setAssigneeDraft(e.target.value)}
                placeholder="Assign writer (name/email)"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded text-white text-sm focus:outline-none focus:border-red-500"
              />
              <select
                value={timeDraft}
                onChange={(e) => setTimeDraft(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded text-white text-sm focus:outline-none focus:border-red-500"
              >
                {TIME_OPTIONS.map((timeOption) => (
                  <option key={timeOption || "anytime"} value={timeOption}>
                    {formatTimeLabel(timeOption)}
                  </option>
                ))}
              </select>
              <select
                value={tagColorDraft}
                onChange={(e) => setTagColorDraft(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded text-white text-sm focus:outline-none focus:border-red-500"
              >
                {TAG_COLOR_OPTIONS.map((option) => (
                  <option key={option.key || "auto"} value={option.key}>
                    Tag Color: {option.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddEntry}
                className="w-full px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-medium"
              >
                Add Plan
              </button>
            </div>

            <div className="rounded border border-zinc-800 bg-zinc-950/60 p-2">
              <p className="text-[11px] text-zinc-400 mb-1">Full tags for selected date</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedEntries.length === 0 ? (
                  <span className="text-[11px] text-zinc-500">No tags yet.</span>
                ) : (
                  selectedEntries.map((entry) => (
                    <span
                      key={`${entry.id}-selected-tag`}
                      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] ${getEventTagColor(entry)}`}
                    >
                      {entry.time ? <span>{shortTime(entry.time)}</span> : null}
                      <span>{entry.topic || "Untitled"}</span>
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto hide-scrollbar pr-1">
              {selectedEntries.length === 0 ? (
                <p className="text-xs text-zinc-500">No plans for this day yet.</p>
              ) : (
                selectedEntries.map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => handleEntryDragStart(item.id)}
                    onDragEnd={() => {
                      setDraggedEntryId(null);
                      setDragOverDateKey("");
                    }}
                    className="bg-zinc-950 border border-zinc-800 rounded p-2 space-y-2 cursor-move"
                  >
                    <span
                      className={`inline-flex w-fit rounded border px-1.5 py-0.5 text-[10px] ${getEventTagColor(item)}`}
                    >
                      {item.topic || "Untitled"}
                    </span>

                    <input
                      type="text"
                      value={item.topic || ""}
                      onChange={(e) => handleUpdateEntry(item.id, "topic", e.target.value)}
                      className="w-full px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-xs text-white focus:outline-none focus:border-red-500"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={item.assignee || ""}
                        onChange={(e) =>
                          handleUpdateEntry(item.id, "assignee", e.target.value)
                        }
                        placeholder="Assignee"
                        className="px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-xs text-white focus:outline-none focus:border-red-500"
                      />
                      <select
                        value={item.status || "Planned"}
                        onChange={(e) => handleUpdateEntry(item.id, "status", e.target.value)}
                        className="px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-xs text-white focus:outline-none focus:border-red-500"
                      >
                        <option>Planned</option>
                        <option>In Progress</option>
                        <option>Review</option>
                        <option>Done</option>
                      </select>
                    </div>

                    <select
                      value={item.tagColor || ""}
                      onChange={(e) => handleUpdateEntry(item.id, "tagColor", e.target.value)}
                      className="w-full px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-xs text-white focus:outline-none focus:border-red-500"
                    >
                      {TAG_COLOR_OPTIONS.map((option) => (
                        <option key={`${item.id}-${option.key || "auto-color"}`} value={option.key}>
                          Tag Color: {option.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={item.time || ""}
                      onChange={(e) => handleUpdateEntry(item.id, "time", e.target.value)}
                      className="w-full px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-xs text-white focus:outline-none focus:border-red-500"
                    >
                      {TIME_OPTIONS.map((timeOption) => (
                        <option key={`${item.id}-${timeOption || "anytime"}`} value={timeOption}>
                          {formatTimeLabel(timeOption)}
                        </option>
                      ))}
                    </select>

                    <div className="space-y-1">
                      {(Array.isArray(item.comments) ? item.comments : []).map((comment, idx) => (
                        <p key={`${item.id}-comment-${idx}`} className="text-[11px] text-zinc-300 bg-zinc-900 border border-zinc-800 rounded px-2 py-1">
                          {comment}
                        </p>
                      ))}
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={commentDraftById[item.id] || ""}
                          onChange={(e) =>
                            setCommentDraftById((prev) => ({
                              ...prev,
                              [item.id]: e.target.value,
                            }))
                          }
                          placeholder="Add comment"
                          className="flex-1 px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-[11px] text-white focus:outline-none focus:border-red-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddComment(item.id)}
                          className="px-2 py-1 text-[11px] bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleDuplicateEntry(item.id)}
                        className="text-[11px] text-zinc-300 hover:text-white"
                      >
                        Duplicate
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteEntry(item.id)}
                        className="text-[11px] text-red-400 hover:text-red-300"
                      >
                        Delete Task
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="hidden md:block bg-zinc-950 rounded-lg border border-zinc-800 p-4">
        <h3 className="text-sm font-semibold text-white mb-2">This Week</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
          {weekEntries.length === 0 ? (
            <p className="text-xs text-zinc-500">No weekly tasks around the selected date.</p>
          ) : (
            weekEntries.map(({ entry, date }) => (
              <div key={`${entry.id}-week`} className="bg-zinc-900 border border-zinc-800 rounded p-2">
                <p className="text-[11px] text-zinc-400">
                  {date.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <p
                  className={`mt-0.5 inline-flex max-w-full rounded border px-1.5 py-0.5 text-xs line-clamp-2 ${getEventTagColor(entry)}`}
                >
                  {entry.topic || "Untitled topic"}
                </p>
                <div className="mt-1 flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-zinc-300">
                    {entry.assignee || "Unassigned"}
                    {entry.time ? ` • ${formatTimeLabel(entry.time)}` : ""}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                    {entry.status || "Planned"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
