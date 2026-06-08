import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { studentApi } from '@/services/endpoints';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { dayLabel, getTodayIsoDayOfWeek, sortDayValues } from '@/config/academic';

export default function StudentRoutinePage() {
  const { data: slots, isLoading } = useQuery({
    queryKey: ['student-routine'],
    queryFn: async () => (await studentApi.routine()).data.data,
  });

  const today = getTodayIsoDayOfWeek();

  const displayDays = useMemo(() => {
    const days = new Set((slots || []).map((s: { dayOfWeek: number }) => s.dayOfWeek));
    return sortDayValues([...days]);
  }, [slots]);

  const [mobileDay, setMobileDay] = useState<number>(today);

  const getSlotsForDay = (day: number) =>
    (slots || [])
      .filter((s: { dayOfWeek: number }) => s.dayOfWeek === day)
      .sort((a: { startTime: string }, b: { startTime: string }) => a.startTime.localeCompare(b.startTime));

  const dayTabClass = (day: number, selected: boolean) =>
    cn(
      'shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
      selected
        ? 'bg-primary text-white shadow-md'
        : 'bg-slate-100 dark:bg-slate-800',
      today === day && !selected && 'ring-2 ring-primary/60 text-primary dark:text-primary'
    );

  const dayColumnClass = (day: number) =>
    cn(
      'transition-shadow',
      today === day &&
        'border-primary bg-primary/10 ring-2 ring-primary shadow-lg shadow-primary/15 dark:bg-primary/15'
    );

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Class Routine</h2>
        <p className="text-muted-foreground">
          Your weekly timetable
          {displayDays.includes(today) && (
            <span className="text-primary"> · {dayLabel(today)} highlighted as today</span>
          )}
        </p>
      </div>

      {isLoading ? null : displayDays.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">No routine scheduled yet.</CardContent>
        </Card>
      ) : (
        <>
          <div className="flex gap-1 overflow-x-auto lg:hidden">
            {displayDays.map((d) => (
              <button key={d} type="button" onClick={() => setMobileDay(d)} className={dayTabClass(d, mobileDay === d)}>
                {dayLabel(d, true)}
                {today === d && <span className="sr-only"> (today)</span>}
              </button>
            ))}
          </div>

          <div
            className="hidden gap-2 lg:grid"
            style={{ gridTemplateColumns: `repeat(${displayDays.length}, minmax(0, 1fr))` }}
          >
            {displayDays.map((dayNum) => {
              const isToday = today === dayNum;
              return (
                <Card key={dayNum} className={dayColumnClass(dayNum)}>
                  <CardHeader className={cn('p-3', isToday && 'border-b border-primary/20 bg-primary/10')}>
                    <div className="flex flex-col items-center gap-1.5">
                      {isToday && (
                        <Badge className="bg-primary text-[10px] uppercase tracking-wide text-white">Today</Badge>
                      )}
                      <CardTitle className={cn('text-sm text-center', isToday && 'font-bold text-primary')}>
                        {dayLabel(dayNum)}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 p-2">
                    {getSlotsForDay(dayNum).map((s) => (
                      <div
                        key={s.id}
                        className={cn(
                          'rounded-lg p-2 text-xs',
                          isToday ? 'border border-primary/25 bg-primary/20' : 'bg-primary/10'
                        )}
                      >
                        <p className="font-mono font-medium">{s.courseCode}</p>
                        <p className="text-muted-foreground">
                          {formatTime(s.startTime)} - {formatTime(s.endTime)}
                        </p>
                        <p className="text-muted-foreground">
                          Rm {s.roomNumber} · {s.teacherAcronym || s.teacherName || '—'}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="space-y-2 lg:hidden">
            {mobileDay === today && (
              <p className="text-center text-xs font-medium text-primary">Today · {dayLabel(today)}</p>
            )}
            {getSlotsForDay(mobileDay).map((s) => (
              <Card key={s.id} className={mobileDay === today ? 'border-primary/40 bg-primary/5' : undefined}>
                <CardContent className="p-4">
                  <p className="font-mono text-sm font-medium">{s.courseCode}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatTime(s.startTime)} - {formatTime(s.endTime)} · Room {s.roomNumber}
                    {s.teacherAcronym ? ` · ${s.teacherAcronym}` : ''}
                  </p>
                </CardContent>
              </Card>
            ))}
            {getSlotsForDay(mobileDay).length === 0 && (
              <p className="py-8 text-center text-muted-foreground">No classes this day</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
