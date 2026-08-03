interface Props {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}

export default function Toggle({ checked, onChange, disabled }: Props) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? 'bg-navy-900' : 'bg-navy-900/15'
      }`}
    >
      <span
        className={`inline-block h-4.5 w-4.5 h-[18px] w-[18px] transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-[22px]' : 'translate-x-[3px]'
        }`}
      />
    </button>
  );
}
