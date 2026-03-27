import LunarCalendar from '@/components/ui/LunarCalendar';

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen" style={{ background: '#f0ebe3' }}>
      <LunarCalendar />
    </div>
  );
}
