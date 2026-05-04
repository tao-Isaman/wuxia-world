"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface ComboOption {
  value: string;
  label: string;
  hint?: string;
  group?: string;
}

interface ComboboxProps {
  options: ComboOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  allowClear?: boolean;
  className?: string;
  disabledValues?: ReadonlySet<string>;
}

// Generic searchable select. Groups options by `group` if provided.
// Replaces the makeSearchable() helper in the original demo.html.
export function Combobox({
  options,
  value,
  onChange,
  placeholder = "เลือก...",
  searchPlaceholder = "ค้นหา...",
  emptyText = "ไม่พบ",
  allowClear = true,
  className,
  disabledValues,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const selected = options.find((o) => o.value === value) ?? null;

  // Group while preserving order.
  const groups = React.useMemo(() => {
    const map = new Map<string, ComboOption[]>();
    for (const o of options) {
      const k = o.group ?? "";
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(o);
    }
    return Array.from(map.entries());
  }, [options]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", !selected && "text-muted-foreground", className)}
        >
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            {allowClear && (
              <CommandGroup>
                <CommandItem
                  value="__clear__"
                  onSelect={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                  className="text-muted-foreground"
                >
                  — ว่าง —
                </CommandItem>
              </CommandGroup>
            )}
            {groups.map(([groupName, items]) => (
              <CommandGroup key={groupName} heading={groupName || undefined}>
                {items.map((o) => {
                  const isDisabled = disabledValues?.has(o.value) ?? false;
                  return (
                    <CommandItem
                      key={o.value}
                      value={`${o.label} ${o.value}`}
                      disabled={isDisabled}
                      onSelect={() => {
                        if (isDisabled) return;
                        onChange(o.value === value ? null : o.value);
                        setOpen(false);
                      }}
                    >
                      <Check className={cn("mr-2 h-4 w-4", value === o.value ? "opacity-100" : "opacity-0")} />
                      <span className="flex-1 truncate">{o.label}</span>
                      {o.hint && <span className="ml-2 text-xs text-muted-foreground">{o.hint}</span>}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
