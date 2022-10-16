export const ButtonIconToggleSelect = <T extends Object>({
  options,
  value,
  onChange,
  group,
}: {
  options: { value: T; text: string; icon: JSX.Element; testId?: string }[];
  value: T | null;
  onChange: (value: T) => void;
  group: string;
}) => (
  <div className="buttonList buttonListIcon">
    {options.map((option, i) => (
      <label
        style={value !== option.value ? { display: "none" } : undefined}
        key={option.text}
        title={option.text}
      >
        <input
          hidden={value !== option.value}
          type="button"
          name={group}
          onClick={() => onChange(options[(i + 1) % options.length].value)}
          checked={value === option.value}
          data-testid={option.testId}
        />
        {option.icon}
      </label>
    ))}
  </div>
);
