'use client';

import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { COUNTRIES, type Country } from '@/lib/countries';

interface CountrySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function CountrySelect({
  value,
  onValueChange,
  placeholder = 'Select nationality...',
  disabled = false,
  className,
}: CountrySelectProps) {
  const [open, setOpen] = useState(false);

  const selectedCountry = useMemo(
    () => COUNTRIES.find((c) => c.code === value),
    [value]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between text-left font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          {selectedCountry ? (
            <span className="truncate">
              {selectedCountry.nationality}
              <span className="text-muted-foreground ml-1 text-xs">
                ({selectedCountry.name})
              </span>
            </span>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command className="w-full">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 size-4 shrink-0 opacity-50" />
            <CommandInput placeholder="Search nationality or country..." className="border-0 focus:ring-0" />
          </div>
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-y-auto">
              {COUNTRIES.map((country) => (
                <CommandItem
                  key={country.code}
                  value={`${country.nationality} ${country.name} ${country.code}`}
                  onSelect={() => {
                    onValueChange(country.code === value ? '' : country.code);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      'mr-2 size-4',
                      value === country.code ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span className="flex-1 truncate">
                    {country.nationality}
                    <span className="text-muted-foreground ml-1 text-xs">
                      ({country.name})
                    </span>
                  </span>
                  <span className="text-[10px] text-muted-foreground/60 font-mono">
                    {country.code}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// A simpler variant for source country selection (shows country name primarily)
export function CountryNameSelect({
  value,
  onValueChange,
  placeholder = 'Select country...',
  disabled = false,
  className,
}: CountrySelectProps) {
  const [open, setOpen] = useState(false);

  const selectedCountry = useMemo(
    () => COUNTRIES.find((c) => c.code === value),
    [value]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between text-left font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          {selectedCountry ? (
            <span className="truncate">{selectedCountry.name}</span>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command className="w-full">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 size-4 shrink-0 opacity-50" />
            <CommandInput placeholder="Search country..." className="border-0 focus:ring-0" />
          </div>
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-y-auto">
              {COUNTRIES.map((country) => (
                <CommandItem
                  key={country.code}
                  value={`${country.name} ${country.code}`}
                  onSelect={() => {
                    onValueChange(country.code === value ? '' : country.code);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      'mr-2 size-4',
                      value === country.code ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span className="flex-1 truncate">{country.name}</span>
                  <span className="text-[10px] text-muted-foreground/60 font-mono">
                    {country.code}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
