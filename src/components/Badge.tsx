interface Props {
  children: React.ReactNode;
  tone: 'red' | 'amber' | 'slate';
}

const TONES: Record<Props['tone'], string> = {
  red: 'bg-red-100 text-red-600',
  amber: 'bg-amber-100 text-amber-700',
  slate: 'bg-slate-100 text-slate-600',
};

export default function Badge({ children, tone }: Props) {
  return (
    <span className={`inline-block text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded ${TONES[tone]}`}>
      {children}
    </span>
  );
}
