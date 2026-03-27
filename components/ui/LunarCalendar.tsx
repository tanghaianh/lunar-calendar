'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import {
  solarToLunar,
  getYearCanChi,
  getMonthCanChi,
  getDayCanChi,
  getHourInfo,
  THANG_TEN,
} from '@/lib/lunar-calendar';

const DOW = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate(); // month is 1-based
}

function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay(); // 0 = Sunday
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

export default function LunarCalendar() {
  const [now, setNow] = useState<Date | null>(null);
  const [viewYear, setViewYear] = useState(0);
  const [viewMonth, setViewMonth] = useState(0);

  useEffect(() => {
    const current = new Date();
    setNow(current);
    setViewYear(current.getFullYear());
    setViewMonth(current.getMonth() + 1);

    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  if (!now || viewYear === 0) {
    return (
      <div className="flex items-center justify-center h-64" style={{ color: '#c8302a' }}>
        Đang tải...
      </div>
    );
  }

  const todayD = now.getDate();
  const todayM = now.getMonth() + 1;
  const todayY = now.getFullYear();
  const todayHour = now.getHours();

  const todayLunar = solarToLunar(todayD, todayM, todayY);
  const yearCanChi = getYearCanChi(todayLunar.year);
  const monthCanChi = getMonthCanChi(todayLunar.month, todayLunar.year);
  const dayCanChi = getDayCanChi(todayD, todayM, todayY);
  const hourInfo = getHourInfo(todayHour, todayD, todayM, todayY);

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
  }

  const isToday = (d: number, m: number, y: number) => d === todayD && m === todayM && y === todayY;

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
      `}</style>

      {/* ── TOP SECTION ── */}
      <div style={{ padding: '24px 28px 20px', textAlign: 'center' }}>

        {/* Logo */}
        <div style={{ marginBottom: 16 }}>
          <Image src="/appplaza_logo_wordmark.svg" alt="AppPlaza" width={140} height={70} style={{ objectFit: 'contain' }} />
        </div>

        {/* Large solar day */}
        <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1, color: '#c8302a', letterSpacing: -2 }}>
          {todayD}
        </div>
        <div style={{ fontSize: 11, letterSpacing: 3, color: '#888', marginTop: 2, textTransform: 'uppercase' }}>
          Ngày Dương Lịch
        </div>

        {/* Solar date full */}
        <div style={{ fontSize: 18, fontWeight: 700, color: '#222', marginTop: 10 }}>
          Ngày {todayD} Tháng {todayM} Năm {todayY}
        </div>

        {/* Lunar date as subtitle */}
        <div style={{ fontSize: 14, color: '#c8302a', marginTop: 4 }}>
          Âm lịch: {todayLunar.day} Tháng {THANG_TEN[todayLunar.month - 1]}{todayLunar.isLeap ? ' (Nhuận)' : ''} • Năm {yearCanChi}
        </div>

        {/* 2×2 Can Chi grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 16 }}>
          {[
            { label: 'Năm', value: yearCanChi },
            { label: 'Tháng', value: monthCanChi },
            { label: 'Ngày', value: dayCanChi },
            { label: `Giờ ${hourInfo.name}`, value: hourInfo.canChi },
          ].map(({ label, value }) => (
            <div key={label} style={{ border: '1px solid #e5ddd0', borderRadius: 8, padding: '10px 12px', background: '#fff8f0' }}>
              <div style={{ fontSize: 10, letterSpacing: 2, color: '#999', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>{value}</div>
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
            const color = i === 0 ? '#c8302a' : i === 6 ? '#1a6ac8' : '#888';
            return (
              <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, letterSpacing: 1, color, padding: '4px 0' }}>
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
            const isSunday = col === 0;
            const isSaturday = col === 6;
            const isFirstLunarDay = cell.lunarDay === 1;

            let solarColor = '#ccc';
            if (cell.inCurrentMonth) {
              if (isSunday) solarColor = '#c8302a';
              else if (isSaturday) solarColor = '#1a6ac8';
              else solarColor = '#222';
            }
            let lunarColor = cell.inCurrentMonth ? (isFirstLunarDay ? '#c8302a' : '#888') : '#ddd';

            if (today) { solarColor = '#fff'; lunarColor = 'rgba(255,255,255,0.8)'; }

            return (
              <div
                key={idx}
                style={{
                  textAlign: 'center',
                  padding: '6px 2px',
                  borderRadius: 6,
                  background: today ? '#8b1a1a' : 'transparent',
                  cursor: 'default',
                }}
              >
                <div style={{ fontSize: 15, fontWeight: today ? 700 : 500, color: solarColor, lineHeight: 1.2 }}>
                  {cell.solarDay}
                </div>
                <div style={{ fontSize: 10, color: lunarColor, lineHeight: 1.2, fontWeight: isFirstLunarDay && !today ? 600 : 400 }}>
                  {isFirstLunarDay ? `1/${cell.lunarMonth}` : cell.lunarDay}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 14, fontSize: '0.7rem', letterSpacing: '0.05em', color: '#bbb' }}>
          Tính theo múi giờ UTC+7 (Việt Nam)
        </div>
        <div style={{ textAlign: 'center', marginTop: 6, fontSize: '0.62rem', letterSpacing: '0.07em', color: '#888', opacity: 0.75 }}>
          From <strong style={{ fontWeight: 800 }}><span style={{ color: '#7B5EA7' }}>App</span><span style={{ color: '#1a1a2e' }}>Plaza</span></strong> with <span className="heart">❤</span>
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
