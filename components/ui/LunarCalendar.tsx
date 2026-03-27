'use client';

import { useState, useEffect, useRef } from 'react';
import {
  solarToLunar,
  getYearCanChi,
  getMonthCanChi,
  getDayCanChi,
  getHourInfo,
  THANG_TEN,
} from '@/lib/lunar-calendar';
import eventsConfig from '@/config/events.json';

interface EventConfig {
  name: string;
  eventType: 'birthday' | 'anniversary' | 'anniversary_of_death' | 'other';
  type: 'solar' | 'lunar';
  repeat: 'yearly' | 'once';
  month: number;
  day: number;
  year?: number;
}

interface EventEntry {
  name: string;
  eventType: string;
}

const EVENTS: EventConfig[] = eventsConfig as EventConfig[];

function getEvents(
  solarDay: number, solarMonth: number, solarYear: number,
  lunarDay: number, lunarMonth: number,
): EventEntry[] {
  return EVENTS
    .filter(e => {
      if (e.type === 'solar') {
        return e.repeat === 'yearly'
          ? e.month === solarMonth && e.day === solarDay
          : e.year === solarYear && e.month === solarMonth && e.day === solarDay;
      }
      // lunar
      return e.repeat === 'yearly'
        ? e.month === lunarMonth && e.day === lunarDay
        : e.year === solarYear && e.month === lunarMonth && e.day === lunarDay;
    })
    .map(e => ({ name: e.name, eventType: e.eventType }));
}

const DOW = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate(); // month is 1-based
}

function firstDayOfMonth(year: number, month: number) {
  // Returns 0-based column index with Monday as column 0
  return (new Date(year, month - 1, 1).getDay() + 6) % 7;
}

interface CalendarCell {
  solarDay: number;
  solarMonth: number;
  solarYear: number;
  lunarDay: number;
  lunarMonth: number;
  isLeap: boolean;
  inCurrentMonth: boolean;
}

function buildCalendarCells(year: number, month: number): CalendarCell[] {
  const firstDow = firstDayOfMonth(year, month);
  const totalDays = daysInMonth(year, month);

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonthDays = daysInMonth(prevYear, prevMonth);

  const cells: CalendarCell[] = [];

  // Days from previous month
  for (let i = firstDow - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const lunar = solarToLunar(d, prevMonth, prevYear);
    cells.push({ solarDay: d, solarMonth: prevMonth, solarYear: prevYear, lunarDay: lunar.day, lunarMonth: lunar.month, isLeap: lunar.isLeap, inCurrentMonth: false });
  }

  // Days in current month
  for (let d = 1; d <= totalDays; d++) {
    const lunar = solarToLunar(d, month, year);
    cells.push({ solarDay: d, solarMonth: month, solarYear: year, lunarDay: lunar.day, lunarMonth: lunar.month, isLeap: lunar.isLeap, inCurrentMonth: true });
  }

  // Fill remaining cells to complete the last row
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  let d = 1;
  while (cells.length % 7 !== 0) {
    const lunar = solarToLunar(d, nextMonth, nextYear);
    cells.push({ solarDay: d, solarMonth: nextMonth, solarYear: nextYear, lunarDay: lunar.day, lunarMonth: lunar.month, isLeap: lunar.isLeap, inCurrentMonth: false });
    d++;
  }

  return cells;
}

function FireworksCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parent = canvas.parentElement;
    if (!parent) return;
    canvas.width = parent.offsetWidth;
    canvas.height = parent.offsetHeight;

    type Particle = {
      x: number; y: number;
      vx: number; vy: number;
      life: number; maxLife: number;
      color: string; size: number;
    };

    const COLORS = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff9f43', '#a29bfe', '#ff85c2', '#00cec9'];
    const particles: Particle[] = [];
    let nextBurst = 0;
    let frameId: number;

    function createBurst() {
      const x = 20 + Math.random() * (canvas!.width - 40);
      const y = 10 + Math.random() * (canvas!.height * 0.55);
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      for (let i = 0; i < 22; i++) {
        const angle = (i / 22) * Math.PI * 2;
        const speed = 1.2 + Math.random() * 2.8;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.8,
          life: 1,
          maxLife: 45 + Math.random() * 35,
          color,
          size: 1.5 + Math.random() * 2,
        });
      }
    }

    function tick(t: number) {
      if (t > nextBurst) {
        createBurst();
        nextBurst = t + 1000 + Math.random() * 1000;
      }

      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.06;
        p.vx *= 0.98;
        p.life -= 1 / p.maxLife;

        if (p.life <= 0) { particles.splice(i, 1); continue; }

        ctx!.globalAlpha = p.life;
        ctx!.fillStyle = p.color;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx!.fill();
      }

      ctx!.globalAlpha = 1;
      frameId = requestAnimationFrame(tick);
    }

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [active]);

  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: '16px 16px 0 0' }}
    />
  );
}

function BalloonsCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parent = canvas.parentElement;
    if (!parent) return;
    canvas.width = parent.offsetWidth;
    canvas.height = parent.offsetHeight;

    type Balloon = {
      x: number; y: number;
      vy: number; phase: number;
      color: string; rx: number; ry: number;
      age: number; maxAge: number;
    };

    const COLORS = ['#ff6b9d', '#ff4d6d', '#ff85c2', '#c77dff', '#e63946', '#ff9f1c', '#f72585', '#ff6b6b'];
    const balloons: Balloon[] = [];
    let nextSpawn = 0;
    let frameId: number;

    function createBalloon() {
      const rx = 7 + Math.random() * 6;
      const vy = 0.7 + Math.random() * 0.8;
      balloons.push({
        x: rx + Math.random() * (canvas!.width - rx * 2),
        y: canvas!.height + 30,
        vy,
        phase: Math.random() * Math.PI * 2,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rx, ry: rx * 1.3,
        age: 0,
        maxAge: (canvas!.height + 60) / vy * 1.2,
      });
    }

    function drawBalloon(b: Balloon, alpha: number) {
      const { x, y, rx, ry, color } = b;
      ctx!.globalAlpha = alpha;
      // Body
      ctx!.beginPath();
      ctx!.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      ctx!.fillStyle = color;
      ctx!.fill();
      // Highlight
      ctx!.beginPath();
      ctx!.ellipse(x - rx * 0.3, y - ry * 0.3, rx * 0.25, ry * 0.2, -0.3, 0, Math.PI * 2);
      ctx!.fillStyle = 'rgba(255,255,255,0.45)';
      ctx!.fill();
      // Knot
      ctx!.beginPath();
      ctx!.arc(x, y + ry, 2, 0, Math.PI * 2);
      ctx!.fillStyle = color;
      ctx!.fill();
      // String
      ctx!.beginPath();
      ctx!.moveTo(x, y + ry + 2);
      ctx!.quadraticCurveTo(x + 5, y + ry + 12, x - 2, y + ry + 22);
      ctx!.strokeStyle = 'rgba(120,80,80,0.45)';
      ctx!.lineWidth = 0.8;
      ctx!.stroke();
      ctx!.globalAlpha = 1;
    }

    function tick(t: number) {
      if (t > nextSpawn) {
        createBalloon();
        nextSpawn = t + 350 + Math.random() * 550;
      }
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      for (let i = balloons.length - 1; i >= 0; i--) {
        const b = balloons[i];
        b.age++;
        b.y -= b.vy;
        b.x += Math.sin(b.age * 0.035 + b.phase) * 0.45;
        const lifeRatio = b.age / b.maxAge;
        if (lifeRatio >= 1 || b.y < -50) { balloons.splice(i, 1); continue; }
        const alpha = lifeRatio > 0.8 ? (1 - lifeRatio) / 0.2 : 1;
        drawBalloon(b, alpha);
      }
      frameId = requestAnimationFrame(tick);
    }

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [active]);

  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: '16px 16px 0 0' }}
    />
  );
}

function getHolidayName(cell: CalendarCell): string | null {
  const { solarDay, solarMonth, solarYear, lunarDay, lunarMonth } = cell;

  // Solar holidays
  if (solarMonth === 1 && solarDay === 1)  return 'Năm Mới';
  if (solarMonth === 4 && solarDay === 30) return 'Giải Phóng';
  if (solarMonth === 5 && solarDay === 1)  return 'Lao Động';
  if (solarMonth === 9 && solarDay === 2)  return 'Quốc Khánh';

  // Lunar holidays
  if (lunarMonth === 3 && lunarDay === 10) return 'Giỗ Tổ HV';
  if (lunarMonth === 1 && lunarDay === 1)  return 'Mùng 1 Tết';
  if (lunarMonth === 1 && lunarDay === 2)  return 'Mùng 2 Tết';
  if (lunarMonth === 1 && lunarDay === 3)  return 'Mùng 3 Tết';

  // Giao Thừa: last day of lunar month 12 (có thể là ngày 29 hoặc 30)
  if (lunarMonth === 12 && lunarDay >= 29) {
    const next = new Date(solarYear, solarMonth - 1, solarDay + 1);
    const nextLunar = solarToLunar(next.getDate(), next.getMonth() + 1, next.getFullYear());
    if (nextLunar.month === 1 && nextLunar.day === 1) return 'Giao Thừa';
  }

  return null;
}

export default function LunarCalendar() {
  const [now, setNow] = useState(() => new Date());
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth() + 1);
  const [selected, setSelected] = useState<{ day: number; month: number; year: number } | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const todayD = now.getDate();
  const todayM = now.getMonth() + 1;
  const todayY = now.getFullYear();
  const todayHour = now.getHours();

  // Active date: selected day or today
  const activeD = selected?.day ?? todayD;
  const activeM = selected?.month ?? todayM;
  const activeY = selected?.year ?? todayY;

  const activeLunar = solarToLunar(activeD, activeM, activeY);
  const yearCanChi = getYearCanChi(activeLunar.year);
  const monthCanChi = getMonthCanChi(activeLunar.month, activeLunar.year);
  const dayCanChi = getDayCanChi(activeD, activeM, activeY);
  const hourInfo = getHourInfo(todayHour, activeD, activeM, activeY);

  // Holiday + event labels for active date (used in top section)
  const activeCell = { solarDay: activeD, solarMonth: activeM, solarYear: activeY, lunarDay: activeLunar.day, lunarMonth: activeLunar.month, isLeap: activeLunar.isLeap, inCurrentMonth: true };
  const activeHoliday = getHolidayName(activeCell);
  const activeEvents = getEvents(activeD, activeM, activeY, activeLunar.day, activeLunar.month);
  const activeLabels = [activeHoliday, ...activeEvents.map(e => e.name)].filter(Boolean) as string[];
  const hasBirthday = activeEvents.some(e => e.eventType === 'birthday');
  const hasAnniversary = activeEvents.some(e => e.eventType === 'anniversary');

  // Color matching the calendar grid: CN=red, T7=blue, others=dark
  const activeDow = new Date(activeY, activeM - 1, activeD).getDay(); // 0=Sun, 6=Sat
  const activeDowColor = activeDow === 0 ? '#c8302a' : activeDow === 6 ? '#1a6ac8' : '#222';

  // Subtitle for calendar section — lunar month of the 1st day of viewed month
  const firstLunar = solarToLunar(1, viewMonth, viewYear);
  const viewLunarYearCanChi = getYearCanChi(firstLunar.year);

  const cells = buildCalendarCells(viewYear, viewMonth);

  function prevMonth() {
    if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 12) { setViewYear(y => y + 1); setViewMonth(1); }
    else setViewMonth(m => m + 1);
  }
  function goToday() {
    setViewYear(todayY);
    setViewMonth(todayM);
    setSelected(null);
  }

  function handleCellClick(cell: CalendarCell) {
    const isSame = selected?.day === cell.solarDay && selected.month === cell.solarMonth && selected.year === cell.solarYear;
    if (isSame) {
      setSelected(null);
    } else {
      setSelected({ day: cell.solarDay, month: cell.solarMonth, year: cell.solarYear });
      if (!cell.inCurrentMonth) {
        setViewYear(cell.solarYear);
        setViewMonth(cell.solarMonth);
      }
    }
  }

  const isToday = (d: number, m: number, y: number) => d === todayD && m === todayM && y === todayY;
  const isSelected = (d: number, m: number, y: number) => selected?.day === d && selected.month === m && selected.year === y;

  return (
    <div style={{ background: '#faf7f2', borderRadius: 16, maxWidth: 420, width: '100%', fontFamily: 'Arial, sans-serif', boxShadow: '0 2px 24px rgba(0,0,0,0.08)' }}>
      <style>{`
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          14%       { transform: scale(1.3); }
          28%       { transform: scale(1); }
          42%       { transform: scale(1.2); }
          56%       { transform: scale(1); }
        }
        .heart {
          display: inline-block;
          color: #c8302a;
          font-size: 0.85rem;
          animation: heartbeat 1.2s ease-in-out infinite;
          vertical-align: middle;
          line-height: 1;
        }
        @keyframes label-pulse {
          0%, 100% { opacity: 1;   transform: scale(1); }
          50%       { opacity: 0.6; transform: scale(1.06); }
        }
        .label-pulse {
          display: inline-block;
          animation: label-pulse 2s ease-in-out infinite;
        }
      `}</style>

      {/* ── TOP SECTION ── */}
      <div style={{ position: 'relative', padding: '14px 16px 12px', textAlign: 'center', overflow: 'hidden' }}>
        <FireworksCanvas active={hasBirthday} />
        <BalloonsCanvas active={hasAnniversary} />

        {/* Selected date indicator */}

        {/* Large solar day */}
        <div style={{ fontSize: 52, fontWeight: 700, lineHeight: 1, color: activeDowColor, letterSpacing: -2 }}>
          {activeD}
        </div>
        <div style={{ fontSize: 10, letterSpacing: 3, color: activeLabels.length ? activeDowColor : '#888', marginTop: 2, textTransform: 'uppercase', fontWeight: activeLabels.length ? 700 : 400 }}>
          {activeLabels.length
            ? (
              <span className="label-pulse" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                {activeEvents.map((e, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={`/icons/${e.eventType}.svg`} alt="" width={14} height={14} style={{ verticalAlign: 'middle', flexShrink: 0 }} />
                ))}
                {activeLabels.join(' • ')}
              </span>
            )
            : 'Ngày Dương Lịch'}
        </div>

        {/* Solar + Lunar date inline */}
        <div style={{ fontSize: 14, fontWeight: 700, color: activeDowColor, marginTop: 6 }}>
          Ngày {activeD} Tháng {activeM} Năm {activeY}
        </div>
        <div style={{ fontSize: 12, color: activeDowColor, marginTop: 2, opacity: 0.8 }}>
          Âm lịch: {activeLunar.day} Tháng {THANG_TEN[activeLunar.month - 1]}{activeLunar.isLeap ? ' (Nhuận)' : ''} • Năm {yearCanChi}
        </div>

        {/* Can Chi — 4 cột 1 hàng */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5, marginTop: 10 }}>
          {[
            { label: 'Năm', value: yearCanChi },
            { label: 'Tháng', value: monthCanChi },
            { label: 'Ngày', value: dayCanChi },
            { label: `Giờ ${hourInfo.name}`, value: hourInfo.canChi },
          ].map(({ label, value }) => (
            <div key={label} style={{ border: '1px solid #e5ddd0', borderRadius: 7, padding: '5px 4px', background: '#fff8f0' }}>
              <div style={{ fontSize: 8, letterSpacing: 1, color: '#999', textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SEPARATOR ── */}
      <div style={{ position: 'relative', height: 1, background: '#e5ddd0', margin: '0 28px' }}>
        <span style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', background: '#faf7f2', padding: '0 6px', color: '#c8302a', fontSize: 10 }}>◆</span>
      </div>

      {/* ── CALENDAR SECTION ── */}
      <div style={{ padding: '20px 20px 16px' }}>

        {/* Month navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#222' }}>
              Tháng {viewMonth} năm {viewYear}
            </div>
            <div style={{ fontSize: 12, color: '#c8302a', marginTop: 1 }}>
              Tháng {firstLunar.month} âm lịch • Năm {viewLunarYearCanChi}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <button onClick={prevMonth} style={navBtnStyle}>←</button>
            <button onClick={goToday} style={{ ...navBtnStyle, fontSize: 10, letterSpacing: 1, padding: '5px 8px' }}>HÔM NAY</button>
            <button onClick={nextMonth} style={navBtnStyle}>→</button>
          </div>
        </div>

        {/* Day-of-week headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginTop: 12, marginBottom: 4 }}>
          {DOW.map((d, i) => {
            const color = i === 6 ? '#c8302a' : i === 5 ? '#1a6ac8' : '#555';
            return (
              <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 900, letterSpacing: 1, color, padding: '4px 0' }}>
                {d}
              </div>
            );
          })}
        </div>

        {/* Calendar grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px 0' }}>
          {cells.map((cell, idx) => {
            const today = isToday(cell.solarDay, cell.solarMonth, cell.solarYear);
            const col = idx % 7;
            const isSunday = col === 6;
            const isSaturday = col === 5;
            const isFirstLunarDay = cell.lunarDay === 1;
            const holiday = cell.inCurrentMonth ? getHolidayName(cell) : null;
            const events = cell.inCurrentMonth ? getEvents(cell.solarDay, cell.solarMonth, cell.solarYear, cell.lunarDay, cell.lunarMonth) : [];
            const allLabels = [holiday, ...events.map(e => e.name)].filter(Boolean) as string[];
            const tooltipText = allLabels.length > 0 ? allLabels.join(' • ') : null;

            let solarColor = '#ccc';
            if (cell.inCurrentMonth) {
              if (isSunday) solarColor = '#c8302a';
              else if (isSaturday) solarColor = '#1a6ac8';
              else solarColor = '#222';
            }
            const sel = isSelected(cell.solarDay, cell.solarMonth, cell.solarYear);
            let lunarColor = cell.inCurrentMonth ? (isFirstLunarDay ? '#c8302a' : '#888') : '#ddd';
            let labelColor = '#c8302a';

            if (today) { solarColor = '#fff'; lunarColor = 'rgba(255,255,255,0.8)'; labelColor = 'rgba(255,200,200,0.9)'; }
            if (sel && !today) { solarColor = '#7B5EA7'; lunarColor = '#a08bc0'; labelColor = '#9b6fbf'; }

            let cellBg = 'transparent';
            if (today) cellBg = '#8b1a1a';
            else if (sel) cellBg = '#f0eaf8';

            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={idx}
                onClick={() => handleCellClick(cell)}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{
                  position: 'relative',
                  textAlign: 'center',
                  padding: '6px 2px',
                  borderRadius: 6,
                  background: cellBg,
                  cursor: 'pointer',
                  outline: sel && !today ? '2px solid #7B5EA7' : 'none',
                  outlineOffset: -2,
                  transition: 'background 0.15s',
                }}
              >
                {/* Tooltip */}
                {isHovered && tooltipText && (
                  <div style={{
                    position: 'absolute', bottom: 'calc(100% + 4px)', left: '50%',
                    transform: 'translateX(-50%)', background: '#222', color: '#fff',
                    fontSize: 10, padding: '4px 8px', borderRadius: 5, whiteSpace: 'nowrap',
                    zIndex: 20, pointerEvents: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    lineHeight: 1.5,
                  }}>
                    {allLabels.map((l, i) => <div key={i}>{l}</div>)}
                  </div>
                )}

                <div style={{ fontSize: 15, fontWeight: today || sel ? 700 : 500, color: solarColor, lineHeight: 1.2 }}>
                  {cell.solarDay}
                </div>
                <div style={{ fontSize: 10, color: lunarColor, lineHeight: 1.2, fontWeight: isFirstLunarDay && !today ? 600 : 400 }}>
                  {isFirstLunarDay ? `1/${cell.lunarMonth}` : cell.lunarDay}
                </div>
                {holiday && (
                  <div style={{ fontSize: 7, color: labelColor, lineHeight: 1.2, marginTop: 1, fontWeight: 600, wordBreak: 'break-word' }}>
                    {holiday}
                  </div>
                )}
                {events.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 1, marginTop: 2, flexWrap: 'wrap' }}>
                    {events.map((ev, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={`/icons/${ev.eventType}.svg`} alt="" width={9} height={9}
                        style={{ filter: today ? 'brightness(0) invert(1)' : 'none' }} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 14, fontSize: '0.7rem', letterSpacing: '0.05em', color: '#bbb' }}>
          Tính theo múi giờ UTC+7 (Việt Nam)
        </div>
        <div style={{ textAlign: 'center', marginTop: 6, fontSize: '0.62rem', letterSpacing: '0.07em', color: '#888', opacity: 0.75 }}>
          From <a href="https://www.appplaza.net/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}><strong style={{ fontWeight: 800 }}><span style={{ color: '#7B5EA7' }}>App</span><span style={{ color: '#1a1a2e' }}>Plaza</span></strong></a> with <span className="heart">❤</span>
        </div>
      </div>
    </div>
  );
}

const navBtnStyle: React.CSSProperties = {
  border: '1px solid #e5ddd0',
  borderRadius: 6,
  background: '#fff8f0',
  color: '#555',
  cursor: 'pointer',
  fontSize: 14,
  padding: '5px 10px',
  lineHeight: 1,
};
