'use client';

interface ActivityDay {
  date: string;
  count: number;
}

interface ActivityCalendarProps {
  activityData: ActivityDay[];
}

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function computeStreaks(solvedDates: Set<string>) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const toDateStr = (d: Date) => d.toISOString().split('T')[0];

  let currentStreak = 0;
  const cursor = new Date(today);

  if (!solvedDates.has(toDateStr(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (solvedDates.has(toDateStr(cursor))) {
    currentStreak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  let longestStreak = 0;
  let runStreak = 0;
  const allDates = Array.from(solvedDates).sort();

  for (let i = 0; i < allDates.length; i++) {
    if (i === 0) {
      runStreak = 1;
    } else {
      const prev = new Date(allDates[i - 1]);
      const curr = new Date(allDates[i]);
      prev.setDate(prev.getDate() + 1);
      if (prev.toISOString().split('T')[0] === allDates[i]) {
        runStreak++;
      } else {
        runStreak = 1;
      }
    }
    if (runStreak > longestStreak) longestStreak = runStreak;
  }

  return { currentStreak, longestStreak };
}

export default function ActivityCalendar({ activityData }: ActivityCalendarProps) {
  const solvedDates = new Set(activityData.filter((d) => d.count > 0).map((d) => d.date));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const year = today.getFullYear();
  const month = today.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  const pad = (n: number) => String(n).padStart(2, '0');
  const toStr = (day: number) => `${year}-${pad(month + 1)}-${pad(day)}`;

  const { currentStreak, longestStreak } = computeStreaks(solvedDates);

  const totalActiveDays = solvedDates.size;

  return (
    <div className="flex gap-10 items-start">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-300">
            {MONTH_NAMES[month]} {year}
          </h3>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAY_HEADERS.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-slate-400">
              {d[0]}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weeks.flat().map((day, idx) => {
            if (day === null) {
              return <div key={idx} />;
            }

            const dateStr = toStr(day);
            const isSolved = solvedDates.has(dateStr);
            const isToday = dateStr === todayStr;
            const isFuture = new Date(dateStr) > today;

            return (
              <div
                key={idx}
                title={isSolved ? `Solved on ${dateStr}` : dateStr}
                className={`
                  h-9 rounded-xl flex items-center justify-center text-sm font-medium transition-all
                  ${isFuture ? 'opacity-20 cursor-default' : ''}
                  ${isSolved
                    ? 'bg-violet-500/30 text-violet-300 border border-violet-500/40 shadow-sm'
                    : isToday
                    ? 'bg-violet-500/20 text-slate-100 border border-violet-500/30 ring-1 ring-violet-500/20'
                    : 'text-slate-500 hover:bg-slate-700/50'
                  }
                `}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-4 shrink-0 pt-1 stagger-children">
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl px-5 py-4 text-center min-w-[110px]">
          <div className="text-2xl font-bold text-violet-400 flex items-center justify-center gap-1">
            {currentStreak}
            {currentStreak > 0 && <span className="text-xl">🔥</span>}
          </div>
          <div className="text-xs text-slate-500 mt-1">Current Streak</div>
          <div className="text-[10px] text-slate-400">days</div>
        </div>
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl px-5 py-4 text-center min-w-[110px]">
          <div className="text-2xl font-bold text-cyan-400">{longestStreak}</div>
          <div className="text-xs text-slate-500 mt-1">Longest Streak</div>
          <div className="text-[10px] text-slate-400">days</div>
        </div>
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl px-5 py-4 text-center min-w-[110px]">
          <div className="text-2xl font-bold text-slate-200">{totalActiveDays}</div>
          <div className="text-xs text-slate-500 mt-1">Active Days</div>
          <div className="text-[10px] text-slate-400">total</div>
        </div>
      </div>
    </div>
  );
}
