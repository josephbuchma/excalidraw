import { ActionManager } from "../actions/manager";

export const BackgroundPickerAndDarkModeToggle = ({
  actionManager,
  compact,
}: {
  actionManager: ActionManager;
  compact?: boolean;
}) => (
  <div
    style={{
      display: "flex",
      ...(compact && { flexDirection: "column", gap: "var(--space-factor)" }),
    }}
  >
    {actionManager.renderAction("changeViewBackgroundColor", {
      showInput: !compact,
    })}
    {actionManager.renderAction("toggleTheme")}
  </div>
);
