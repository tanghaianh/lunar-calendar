'use client';

import { useState, useEffect } from 'react';

const PASSWORD = '123456';

type EventType = 'birthday' | 'anniversary' | 'anniversary_of_death' | 'other';
type CalType = 'solar' | 'lunar';
type Repeat = 'yearly' | 'once';

interface EventConfig {
  name: string;
  eventType: EventType;
  type: CalType;
  repeat: Repeat;
  month: number;
  day: number;
  year?: number;
}

const EMPTY_FORM: EventConfig = {
  name: '',
  eventType: 'birthday',
  type: 'solar',
  repeat: 'yearly',
  month: 1,
  day: 1,
};

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  birthday: '🎂 Birthday',
  anniversary: '❤️ Anniversary',
  anniversary_of_death: '🕯️ Anniversary of Death',
  other: '⭐ Other',
};

const CAL_TYPE_LABELS: Record<CalType, string> = { solar: 'Dương lịch', lunar: 'Âm lịch' };
const REPEAT_LABELS: Record<Repeat, string> = { yearly: 'Hàng năm', once: 'Một lần' };

export default function EventsPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [pwError, setPwError] = useState(false);

  const [events, setEvents] = useState<EventConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [form, setForm] = useState<EventConfig>(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  // Delete confirm
  const [deleteIdx, setDeleteIdx] = useState<number | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem('events_auth') === '1') setAuthed(true);
  }, []);

  useEffect(() => {
    if (!authed) return;
    setLoading(true);
    fetch('/api/events')
      .then(r => r.json())
      .then(data => { setEvents(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [authed]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (password === PASSWORD) {
      sessionStorage.setItem('events_auth', '1');
      setAuthed(true);
      setPwError(false);
    } else {
      setPwError(true);
    }
  }

  async function saveEvents(updated: EventConfig[]) {
    setSaving(true);
    setSaveError('');
    try {
      const r = await fetch('/api/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (!r.ok) throw new Error();
      setEvents(updated);
    } catch {
      setSaveError('Lỗi khi lưu. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  }

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditIdx(null);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(idx: number) {
    setForm({ ...events[idx] });
    setEditIdx(idx);
    setFormError('');
    setModalOpen(true);
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setFormError('Tên không được để trống.'); return; }
    if (form.month < 1 || form.month > 12) { setFormError('Tháng phải từ 1–12.'); return; }
    if (form.day < 1 || form.day > 31) { setFormError('Ngày phải từ 1–31.'); return; }
    if (form.repeat === 'once' && (!form.year || form.year < 1900)) { setFormError('Năm không hợp lệ.'); return; }

    const entry: EventConfig = {
      name: form.name.trim(),
      eventType: form.eventType,
      type: form.type,
      repeat: form.repeat,
      month: form.month,
      day: form.day,
      ...(form.repeat === 'once' ? { year: form.year } : {}),
    };

    let updated: EventConfig[];
    if (editIdx === null) {
      updated = [...events, entry];
    } else {
      updated = events.map((ev, i) => (i === editIdx ? entry : ev));
    }
    saveEvents(updated).then(() => setModalOpen(false));
  }

  function handleDelete(idx: number) {
    const updated = events.filter((_, i) => i !== idx);
    saveEvents(updated).then(() => setDeleteIdx(null));
  }

  // ── Auth gate ──
  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', background: '#f0ebe3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#faf7f2', borderRadius: 16, padding: '36px 32px', maxWidth: 340, width: '90%', boxShadow: '0 2px 24px rgba(0,0,0,0.10)', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🔒</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#222', marginBottom: 4 }}>Events Management</div>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>Nhập mật khẩu để tiếp tục</div>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setPwError(false); }}
              placeholder="Mật khẩu"
              autoFocus
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 8, border: pwError ? '1.5px solid #c8302a' : '1.5px solid #e5ddd0', fontSize: 15, marginBottom: 8, outline: 'none', background: '#fff' }}
            />
            {pwError && <div style={{ color: '#c8302a', fontSize: 12, marginBottom: 8 }}>Mật khẩu không đúng.</div>}
            <button type="submit" style={{ width: '100%', padding: '10px', borderRadius: 8, background: '#7B5EA7', color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer' }}>
              Đăng nhập
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Main UI ──
  return (
    <div style={{ minHeight: '100vh', background: '#f0ebe3', padding: '28px 16px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: 780, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#222' }}>🗓️ Events Management</div>
            <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{events.length} sự kiện</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href="/" style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px solid #e5ddd0', background: '#fff8f0', color: '#555', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>← Lịch</a>
            <button onClick={openAdd} style={{ padding: '8px 18px', borderRadius: 8, background: '#7B5EA7', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}>+ Thêm</button>
          </div>
        </div>

        {saveError && <div style={{ background: '#ffeaea', color: '#c8302a', borderRadius: 8, padding: '10px 16px', marginBottom: 12, fontSize: 13 }}>{saveError}</div>}

        {/* Table */}
        <div style={{ background: '#faf7f2', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Đang tải...</div>
          ) : events.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>Chưa có sự kiện nào.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid #e5ddd0', background: '#f5f0ea' }}>
                  <th style={thStyle}>Tên</th>
                  <th style={thStyle}>Loại</th>
                  <th style={thStyle}>Lịch</th>
                  <th style={thStyle}>Lặp</th>
                  <th style={thStyle}>Ngày</th>
                  <th style={{ ...thStyle, width: 90 }}></th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #ede8e0', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f5f0ea')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={tdStyle}><span style={{ fontWeight: 600, color: '#222' }}>{ev.name}</span></td>
                    <td style={tdStyle}><span style={{ fontSize: 12 }}>{EVENT_TYPE_LABELS[ev.eventType]}</span></td>
                    <td style={tdStyle}><span style={{ fontSize: 11, color: '#888' }}>{CAL_TYPE_LABELS[ev.type]}</span></td>
                    <td style={tdStyle}><span style={{ fontSize: 11, color: '#888' }}>{REPEAT_LABELS[ev.repeat]}</span></td>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 500, color: '#555' }}>
                        {ev.repeat === 'once' ? `${ev.day}/${ev.month}/${ev.year}` : `${ev.day}/${ev.month}`}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <button onClick={() => openEdit(i)} disabled={saving} style={actionBtnStyle('#6c8ebf')}>✏️</button>
                      <button onClick={() => setDeleteIdx(i)} disabled={saving} style={{ ...actionBtnStyle('#c8302a'), marginLeft: 4 }}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Add/Edit Modal ── */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
          <div style={{ background: '#faf7f2', borderRadius: 16, padding: '28px 24px', width: '100%', maxWidth: 420, boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#222', marginBottom: 20 }}>
              {editIdx === null ? '+ Thêm sự kiện' : '✏️ Sửa sự kiện'}
            </div>

            <form onSubmit={handleFormSubmit}>
              <Label>Tên sự kiện</Label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ví dụ: Alex's birthday" style={inputStyle} />

              <Label>Loại sự kiện</Label>
              <select value={form.eventType} onChange={e => setForm(f => ({ ...f, eventType: e.target.value as EventType }))} style={inputStyle}>
                <option value="birthday">🎂 Birthday</option>
                <option value="anniversary">❤️ Anniversary</option>
                <option value="anniversary_of_death">🕯️ Anniversary of Death</option>
                <option value="other">⭐ Other</option>
              </select>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <Label>Loại lịch</Label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as CalType }))} style={inputStyle}>
                    <option value="solar">Dương lịch</option>
                    <option value="lunar">Âm lịch</option>
                  </select>
                </div>
                <div>
                  <Label>Lặp lại</Label>
                  <select value={form.repeat} onChange={e => setForm(f => ({ ...f, repeat: e.target.value as Repeat }))} style={inputStyle}>
                    <option value="yearly">Hàng năm</option>
                    <option value="once">Một lần</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: form.repeat === 'once' ? '1fr 1fr 1fr' : '1fr 1fr', gap: 10 }}>
                <div>
                  <Label>Ngày</Label>
                  <input type="number" min={1} max={31} value={form.day}
                    onChange={e => setForm(f => ({ ...f, day: +e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <Label>Tháng</Label>
                  <input type="number" min={1} max={12} value={form.month}
                    onChange={e => setForm(f => ({ ...f, month: +e.target.value }))} style={inputStyle} />
                </div>
                {form.repeat === 'once' && (
                  <div>
                    <Label>Năm</Label>
                    <input type="number" min={1900} max={2100} value={form.year ?? ''}
                      onChange={e => setForm(f => ({ ...f, year: +e.target.value }))} style={inputStyle} />
                  </div>
                )}
              </div>

              {formError && <div style={{ color: '#c8302a', fontSize: 12, marginTop: 4 }}>{formError}</div>}

              <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                <button type="button" onClick={() => setModalOpen(false)}
                  style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1.5px solid #e5ddd0', background: '#fff8f0', color: '#555', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                  Hủy
                </button>
                <button type="submit" disabled={saving}
                  style={{ flex: 1, padding: '10px', borderRadius: 8, background: saving ? '#b09ec8' : '#7B5EA7', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: saving ? 'default' : 'pointer' }}>
                  {saving ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteIdx !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
          <div style={{ background: '#faf7f2', borderRadius: 16, padding: '28px 24px', width: '100%', maxWidth: 340, boxShadow: '0 8px 40px rgba(0,0,0,0.18)', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🗑️</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#222', marginBottom: 8 }}>Xóa sự kiện?</div>
            <div style={{ fontSize: 13, color: '#555', marginBottom: 20 }}>
              &ldquo;<strong>{events[deleteIdx]?.name}</strong>&rdquo; sẽ bị xóa vĩnh viễn.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setDeleteIdx(null)}
                style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1.5px solid #e5ddd0', background: '#fff8f0', color: '#555', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                Hủy
              </button>
              <button onClick={() => handleDelete(deleteIdx!)} disabled={saving}
                style={{ flex: 1, padding: '10px', borderRadius: 8, background: saving ? '#e08080' : '#c8302a', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: saving ? 'default' : 'pointer' }}>
                {saving ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, fontWeight: 600, color: '#888', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4, marginTop: 12 }}>{children}</div>;
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '9px 12px',
  borderRadius: 8, border: '1.5px solid #e5ddd0', fontSize: 14,
  background: '#fff', outline: 'none', color: '#222',
};

const thStyle: React.CSSProperties = {
  padding: '10px 14px', textAlign: 'left', fontWeight: 700,
  color: '#666', fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase',
};

const tdStyle: React.CSSProperties = {
  padding: '11px 14px', color: '#444', verticalAlign: 'middle',
};

function actionBtnStyle(color: string): React.CSSProperties {
  return {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 15, padding: '3px 5px', borderRadius: 5,
    opacity: 0.75, transition: 'opacity 0.1s',
    color,
  };
}
