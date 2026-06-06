import { useState, useRef, useEffect } from 'react';
import { StatusBar } from '../components/dashboard/StatusBar';
import { BottomNav, type NavTab } from '../components/ui/BottomNav';
import { Check, Plus } from '../components/ui/icons';
import { isoToday } from '../utils/format';

interface AgendaTask {
  id: string;
  dayOfWeek: number;
  label: string;
}

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

function currentDayOfWeek(): number {
  return (new Date().getDay() + 6) % 7;
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

interface Props {
  onTabChange: (tab: NavTab) => void;
}

export function AgendaPage({ onTabChange }: Props) {
  const [tasks, setTasks] = useState<AgendaTask[]>(() =>
    loadFromStorage<AgendaTask[]>('nia_agenda_tasks', [])
  );
  const [completions, setCompletions] = useState<Record<string, string[]>>(() =>
    loadFromStorage<Record<string, string[]>>('nia_agenda_completions', {})
  );
  const [addingForDay, setAddingForDay] = useState<number | null>(null);
  const [newLabel, setNewLabel] = useState('');

  const today = isoToday();
  const todayDow = currentDayOfWeek();

  function persistTasks(next: AgendaTask[]) {
    setTasks(next);
    localStorage.setItem('nia_agenda_tasks', JSON.stringify(next));
  }

  function persistCompletions(next: Record<string, string[]>) {
    setCompletions(next);
    localStorage.setItem('nia_agenda_completions', JSON.stringify(next));
  }

  function addTask(dow: number) {
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    const task: AgendaTask = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      dayOfWeek: dow,
      label: trimmed,
    };
    persistTasks([...tasks, task]);
    setAddingForDay(null);
    setNewLabel('');
  }

  function deleteTask(id: string) {
    persistTasks(tasks.filter(t => t.id !== id));
    const nextCompletions: Record<string, string[]> = {};
    for (const [date, ids] of Object.entries(completions)) {
      const filtered = ids.filter(tid => tid !== id);
      if (filtered.length > 0) nextCompletions[date] = filtered;
    }
    persistCompletions(nextCompletions);
  }

  function toggleComplete(taskId: string) {
    const current = completions[today] ?? [];
    const next = current.includes(taskId)
      ? current.filter(id => id !== taskId)
      : [...current, taskId];
    persistCompletions({ ...completions, [today]: next });
  }

  const totalToday = tasks.filter(t => t.dayOfWeek === todayDow).length;
  const doneToday = (completions[today] ?? []).filter(id =>
    tasks.some(t => t.id === id && t.dayOfWeek === todayDow)
  ).length;

  return (
    <PageShell>
      <StatusBar />

      <div style={{ padding: '12px 20px 8px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', letterSpacing: 0.4 }}>organisation</div>
          <h1 className="display" style={{ fontSize: 24, fontWeight: 500, margin: '2px 0 0', letterSpacing: '-0.02em' }}>
            Mon agenda
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

      <div style={{ flex: 1, overflow: 'auto', padding: '8px 20px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {DAYS.map((dayName, dow) => {
          const dayTasks = tasks.filter(t => t.dayOfWeek === dow);
          const isToday = dow === todayDow;
          const completedIds = isToday ? (completions[today] ?? []) : [];
          const isAdding = addingForDay === dow;

          return (
            <DayCard
              key={dow}
              dayName={dayName}
              isToday={isToday}
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

      <BottomNav active="agenda" onChange={onTabChange} />
      <HomeIndicator />
    </PageShell>
  );
}

interface DayCardProps {
  dayName: string;
  isToday: boolean;
  tasks: AgendaTask[];
  completedIds: string[];
  isAdding: boolean;
  newLabel: string;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onStartAdd: () => void;
  onCancelAdd: () => void;
  onConfirmAdd: () => void;
  onLabelChange: (v: string) => void;
}

function DayCard({
  dayName, isToday, tasks, completedIds, isAdding,
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
      background: isToday ? 'var(--orange-tint)' : 'var(--paper-2)',
      border: `1px solid ${isToday ? 'var(--orange)' : 'var(--hairline-2)'}`,
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: hasContent ? '1px solid var(--hairline)' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isToday && (
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: 'var(--orange)', flexShrink: 0,
            }} />
          )}
          <span className="display" style={{
            fontSize: 15,
            fontWeight: isToday ? 600 : 500,
            color: isToday ? 'var(--orange)' : 'var(--ink)',
          }}>
            {dayName}
          </span>
          {tasks.length > 0 && (
            <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>
              {isToday ? `${doneCount}/${tasks.length}` : `${tasks.length}`}
            </span>
          )}
        </div>
        <button
          onClick={onStartAdd}
          aria-label={`Ajouter une habitude le ${dayName}`}
          style={{
            background: 'transparent', border: 'none',
            cursor: 'pointer', padding: 4,
            display: 'flex', alignItems: 'center',
          }}
        >
          <Plus size={16} color={isToday ? 'var(--orange)' : 'var(--ink-3)'} />
        </button>
      </div>

      {tasks.length > 0 && (
        <div style={{ padding: '4px 0' }}>
          {tasks.map(task => {
            const done = completedIds.includes(task.id);
            return (
              <div
                key={task.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '7px 14px',
                }}
              >
                {isToday ? (
                  <button
                    onClick={() => onToggle(task.id)}
                    aria-label={done ? 'Marquer comme non fait' : 'Marquer comme fait'}
                    style={{
                      width: 20, height: 20,
                      borderRadius: 6,
                      border: done ? 'none' : '1.5px solid var(--hairline)',
                      background: done ? 'var(--orange)' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, padding: 0,
                    }}
                  >
                    {done && <Check size={11} color="white" strokeWidth={2.5} />}
                  </button>
                ) : (
                  <div style={{
                    width: 20, height: 20, borderRadius: 6,
                    border: '1.5px solid var(--hairline)',
                    flexShrink: 0,
                  }} />
                )}
                <span style={{
                  flex: 1, fontSize: 14,
                  color: done ? 'var(--ink-3)' : 'var(--ink)',
                  textDecoration: done ? 'line-through' : 'none',
                }}>
                  {task.label}
                </span>
                <button
                  onClick={() => onDelete(task.id)}
                  aria-label="Supprimer"
                  style={{
                    background: 'transparent', border: 'none',
                    cursor: 'pointer', padding: '4px 6px',
                    color: 'var(--ink-3)', fontSize: 18, lineHeight: 1,
                  }}
                >
                  ×
                </button>
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
              flex: 1, background: 'transparent',
              border: 'none', outline: 'none',
              fontSize: 14, color: 'var(--ink)',
              fontFamily: 'var(--font-body)',
            }}
          />
          <button
            onClick={onConfirmAdd}
            style={{
              background: 'var(--orange)', border: 'none',
              borderRadius: 8, padding: '4px 10px',
              color: 'white', fontSize: 12, fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            OK
          </button>
          <button
            onClick={onCancelAdd}
            style={{
              background: 'transparent', border: 'none',
              color: 'var(--ink-3)', fontSize: 18,
              cursor: 'pointer', padding: '4px 6px',
            }}
          >
            ×
          </button>
        </div>
      )}

      {tasks.length === 0 && !isAdding && (
        <div style={{
          padding: '8px 14px 12px',
          fontSize: 13, color: 'var(--ink-3)',
          fontStyle: 'italic',
        }}>
          Aucune habitude — touchez + pour en ajouter
        </div>
      )}
    </div>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      width: '100%', maxWidth: 480, minHeight: '100dvh',
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
