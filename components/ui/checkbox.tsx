import * as React from "react";

type Props = {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "type">;

export function Checkbox({ checked, onCheckedChange, ...rest }: Props) {
  return (
    <input
      type="checkbox"
      checked={!!checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      className="h-4 w-4 rounded border-slate-300 text-black accent-black"
      {...rest}
    />
  );
}
