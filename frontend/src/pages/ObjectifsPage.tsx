import { useState, useRef, useEffect, useCallback } from 'react';
import { StatusBar } from '../components/dashboard/StatusBar';
import { BottomNav, type NavTab } from '../components/ui/BottomNav';
import { Check, Plus } from '../components/ui/icons';
import { isoToday, weekStart, addDays } from '../utils/format';
import { objectivesApi, type CompletionsMap } from '../api/objectives';
import type { ObjectiveDto } from '../types/api';

const DAYS      = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const DAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function currentDayOfWeek(): number {
  return (new Date().getDay() + 6) % 7;
}

interface Props {
  onTabChange: (tab: NavTab) => void;
}

export function ObjectifsPage({ onTabChange }: Props) {
  const [tasks, setTasks] = useState<ObjectiveDto[]>([]);
  const [completions, setCompletions] = useState<CompletionsMap>({});
  const [addingForDay, setAddingForDay] = useState<number | null>(null);
  const [newLabel, setNewLabel] = useState('');

  const today   = isoToday();
  const todayDow = currentDayOfWeek();
  const monday  = weekStart(today);
  const sunday  = addDays(monday, 6);

  const loadData = useCallback(async () => {
    const [fetchedTasks, fetchedCompletions] = await Promise.all([
      objectivesApi.getAll(),
      objectivesApi.getCompletions(monday, sunday),
    ]);
    setTasks(fetchedTasks);
    setCompletions(fetchedCompletions);
  }, [monday, sunday]);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── derived state ───────────────────────────────────────────────────────────

  const sportObjectives = tasks.filter(t => t.type === 'SPORT');
  const sportDays = new Set(sportObjectives.map(t => t.dayOfWeek));

  // ─── actions ─────────────────────────────────────────────────────────────────

  async function addTask(dow: number) {
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    const created = await objectivesApi.create(dow, trimmed, 'CUSTOM');
    setTasks(prev => [...prev, created]);
    setAddingForDay(null);
    setNewLabel('');
  }

  async function deleteTask(id: number) {
    await objectivesApi.remove(id);
    setTasks(prev => prev.filter(t => t.id !== id));
    setCompletions(prev => {
      const next: CompletionsMap = {};
      for (const [date, ids] of Object.entries(prev)) {
        const filtered = ids.filter(tid => tid !== id);
        if (filtered.length > 0) next[date] = filtered;
      }
      return next;
    });
  }

  async function toggleComplete(taskId: number, date: string) {
    const current = completions[date] ?? [];
    const done = current.includes(taskId);
    if (done) {
      await objectivesApi.markUndone(taskId, date);
      setCompletions(prev => ({ ...prev, [date]: (prev[date] ?? []).filter(id => id !== taskId) }));
    } else {
      await objectivesApi.markDone(taskId, date);
      setCompletions(prev => ({ ...prev, [date]: [...(prev[date] ?? []), taskId] }));
    }
  }

  async function toggleSportDay(dow: number) {
    const existing = sportObjectives.find(t => t.dayOfWeek === dow);
    if (existing) {
      await deleteTask(existing.id);
    } else {
      const created = await objectivesApi.create(dow, 'Séance sport', 'SPORT');
      setTasks(prev => [...prev, created]);
    }
  }

  // ─── stats ────────────────────────────────────────────────────────────────────

  function dayTasksFor(dow: number): ObjectiveDto[] {
    return tasks.filter(t => t.dayOfWeek === dow);
  }

  const totalToday = dayTasksFor(todayDow).length;
  const doneToday  = (completions[today] ?? []).filter(id =>
    dayTasksFor(todayDow).some(t => t.id === id)
  ).length;

  const weekStats = (() => {
    let succeeded = 0, failed = 0;
    for (let dow = 0; dow < 7; dow++) {
      const dayDate = addDays(monday, dow);
      const dayTasks = dayTasksFor(dow);
      const completedIds = completions[dayDate] ?? [];
      for (const task of dayTasks) {
        if (completedIds.includes(task.id)) succeeded++;
        else if (dayDate < today) failed++;
      }
    }
    return { succeeded, failed };
  })();

  // ─── render ───────────────────────────────────────────────────────────────────

  return (
    <PageShell>
      <StatusBar />

      <div style={{ padding: '12px 20px 6px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', letterSpacing: 0.4 }}>organisation</div>
          <h1 className="display" style={{ fontSize: 24, fontWeight: 500, margin: '2px 0 0', letterSpacing: '-0.02em' }}>
            Mes objectifs
          </h1>
        </div>
        {totalToday > 0 && (
          <div style={{
            padding: '4px 10px', borderRadius: 999,
            background: doneToday === totalToday ? 'var(--green-soft)' : 'var(--orange-soft)',
            fontSize: 12, fontWeight: 600,
            color: doneToday === totalToday ? 'var(--green)' : 'var(--orange)',
          }}>
            {doneToday}/{totalToday} aujourd'hui
          </div>
        )}
      </div>

      {(weekStats.succeeded > 0 || weekStats.failed > 0) && (
        <div style={{ padding: '6px 20px 2px', display: 'flex', gap: 8 }}>
          {weekStats.succeeded > 0 && (
            <div style={{ padding: '3px 10px', borderRadius: 999, background: 'var(--green-tint)', fontSize: 12, fontWeight: 600, color: 'var(--green)' }}>
              ✓ {weekStats.succeeded} réussie{weekStats.succeeded > 1 ? 's' : ''}
            </div>
          )}
          {weekStats.failed > 0 && (
            <div style={{ padding: '3px 10px', borderRadius: 999, background: 'var(--red-soft)', fontSize: 12, fontWeight: 600, color: 'var(--red)' }}>
              ✗ {weekStats.failed} échouée{weekStats.failed > 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '8px 20px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* ── Config sport ──────────────────────────────── */}
        <ConfigCard label="Séances sport" icon="🏃">
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {DAYS_SHORT.map((abbr, dow) => {
              const active = sportDays.has(dow);
              return (
                <button
                  key={dow}
                  onClick={() => toggleSportDay(dow)}
                  style={{
                    height: 34, minWidth: 40, padding: '0 10px',
                    borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
                    background: active ? 'var(--orange)' : 'var(--paper-3)',
                    color: active ? '#fff' : 'var(--ink-2)',
                    transition: 'all 120ms',
                  }}
                >
                  {abbr}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6 }}>
            Se coche auto quand tu renseignes des calories brûlées ce jour-là
          </div>
        </ConfigCard>

        {/* ── Day cards ─────────────────────────────────── */}
        {DAYS.map((dayName, dow) => {
          const dayDate     = addDays(monday, dow);
          const dayTasks    = dayTasksFor(dow);
          const isToday     = dow === todayDow;
          const isPast      = dayDate < today;
          const completedIds = completions[dayDate] ?? [];
          const isAdding    = addingForDay === dow;

          return (
            <DayCard
              key={dow}
              dayName={dayName}
              dayDate={dayDate}
              isToday={isToday}
              isPast={isPast}
              tasks={dayTasks}
              completedIds={completedIds}
              isAdding={isAdding}
              newLabel={newLabel}
              onToggle={toggleComplete}
              onDelete={deleteTask}
              onStartAdd={() => { setAddingForDay(dow); setNewLabel(''); }}
              onCancelAdd={() => { setAddingForDay(null); setNewLabel(''); }}
              onConfirmAdd={() => addTask(dow)}
              onLabelChange={setNewLabel}
            />
          );
        })}
      </div>

      <BottomNav active="objectifs" onChange={onTabChange} />
      <HomeIndicator />
    </PageShell>
  );
}

// ─── ConfigCard ───────────────────────────────────────────────────────────────

function ConfigCard({ label, icon, children }: { label: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--paper-2)',
      border: '1px solid var(--hairline-2)',
      borderRadius: 'var(--radius-md)',
      padding: '12px 14px',
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>{icon}</span>
        {label}
      </div>
      {children}
    </div>
  );
}

// ─── DayCard ──────────────────────────────────────────────────────────────────

interface DayCardProps {
  dayName: string;
  dayDate: string;
  isToday: boolean;
  isPast: boolean;
  tasks: ObjectiveDto[];
  completedIds: number[];
  isAdding: boolean;
  newLabel: string;
  onToggle: (id: number, date: string) => void;
  onDelete: (id: number) => void;
  onStartAdd: () => void;
  onCancelAdd: () => void;
  onConfirmAdd: () => void;
  onLabelChange: (v: string) => void;
}

function DayCard({
  dayName, dayDate, isToday, isPast, tasks, completedIds, isAdding,
  newLabel, onToggle, onDelete, onStartAdd, onCancelAdd, onConfirmAdd, onLabelChange,
}: DayCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const doneCount = tasks.filter(t => completedIds.includes(t.id)).length;
  const hasContent = tasks.length > 0 || isAdding;

  useEffect(() => {
    if (isAdding) inputRef.current?.focus();
  }, [isAdding]);

  return (
    <div style={{
      flexShrink: 0,
      background: isToday ? 'var(--orange-tint)' : 'var(--paper-2)',
      border: `1px solid ${isToday ? 'var(--orange)' : 'var(--hairline-2)'}`,
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: hasContent ? '1px solid var(--hairline)' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isToday && (
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--orange)', flexShrink: 0 }} />
          )}
          <span className="display" style={{ fontSize: 15, fontWeight: isToday ? 600 : 500, color: isToday ? 'var(--orange)' : 'var(--ink)' }}>
            {dayName}
          </span>
          {tasks.length > 0 && (
            <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{doneCount}/{tasks.length}</span>
          )}
        </div>
        <button
          onClick={onStartAdd}
          aria-label={`Ajouter une habitude le ${dayName}`}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
        >
          <Plus size={16} color={isToday ? 'var(--orange)' : 'var(--ink-3)'} />
        </button>
      </div>

      {tasks.length > 0 && (
        <div style={{ padding: '4px 0' }}>
          {tasks.map(task => {
            const done = completedIds.includes(task.id);
            const isAuto = task.type === 'SPORT' || task.type === 'STEPS';
            return (
              <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 14px' }}>
                <button
                  onClick={() => onToggle(task.id, dayDate)}
                  aria-label={done ? 'Marquer comme non fait' : 'Marquer comme fait'}
                  style={{
                    width: 20, height: 20,
                    borderRadius: 6,
                    border: done ? 'none' : isPast ? '1.5px solid var(--red)' : '1.5px solid var(--hairline)',
                    background: done ? 'var(--orange)' : isPast ? 'var(--red-soft)' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, padding: 0,
                    fontSize: 13, color: 'var(--red)', fontWeight: 700, lineHeight: 1,
                  }}
                >
                  {done ? <Check size={11} color="white" strokeWidth={2.5} /> : isPast ? '✕' : null}
                </button>

                <span style={{ fontSize: 14, color: done ? 'var(--ink-3)' : isPast ? 'var(--ink-3)' : 'var(--ink)', textDecoration: done ? 'line-through' : 'none', flex: 1 }}>
                  {task.type === 'SPORT' && <span style={{ marginRight: 5 }}>🏃</span>}
                  {task.type === 'STEPS' && <span style={{ marginRight: 5 }}>👟</span>}
                  {task.label}
                </span>

                {isAuto ? (
                  <span style={{ fontSize: 10, color: 'var(--ink-4)', background: 'var(--paper-3)', padding: '2px 6px', borderRadius: 6, flexShrink: 0 }}>
                    auto
                  </span>
                ) : (
                  <button
                    onClick={() => onDelete(task.id)}
                    aria-label="Supprimer"
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 6px', color: 'var(--ink-3)', fontSize: 18, lineHeight: 1 }}
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isAdding && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 14px',
          borderTop: tasks.length > 0 ? '1px solid var(--hairline)' : 'none',
        }}>
          <input
            ref={inputRef}
            value={newLabel}
            onChange={e => onLabelChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') onConfirmAdd();
              if (e.key === 'Escape') onCancelAdd();
            }}
            placeholder="Nouvelle habitude…"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontSize: 14, color: 'var(--ink)', fontFamily: 'var(--font-body)',
            }}
          />
          <button onClick={onConfirmAdd} style={{ background: 'var(--orange)', border: 'none', borderRadius: 8, padding: '4px 10px', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            OK
          </button>
          <button onClick={onCancelAdd} style={{ background: 'transparent', border: 'none', color: 'var(--ink-3)', fontSize: 18, cursor: 'pointer', padding: '4px 6px' }}>
            ×
          </button>
        </div>
      )}

      {tasks.length === 0 && !isAdding && (
        <div style={{ padding: '8px 14px 12px', fontSize: 13, color: 'var(--ink-3)', fontStyle: 'italic' }}>
          Aucune habitude — touchez + pour en ajouter
        </div>
      )}
    </div>
  );
}

// ─── Layout helpers ───────────────────────────────────────────────────────────

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      width: '100%', maxWidth: 480, height: '100dvh',
      background: 'var(--paper)', color: 'var(--ink)',
      fontFamily: 'var(--font-body)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {children}
    </div>
  );
}

function HomeIndicator() {
  return (
    <div style={{ height: 22, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 6, background: 'var(--paper)' }}>
      <div style={{ width: 110, height: 4, borderRadius: 999, background: 'rgba(0,0,0,0.22)' }} />
    </div>
  );
}
