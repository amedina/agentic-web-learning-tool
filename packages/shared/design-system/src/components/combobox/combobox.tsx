/**
 * External dependencies.
 */
import { Check, ChevronsUpDown } from 'lucide-react';
import { useState, useCallback } from 'react';
/**
 * Internal dependencies.
 */
import { cn } from '../../lib/utils';
import { Button } from '../button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '../command';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';

interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  onInputChange: (value: string) => void;
  onFocus?: () => void;
  options: string[];
  placeholder?: string;
  emptyMessage?: string;
  id?: string;
}

export function Combobox({
  value,
  onChange,
  onInputChange,
  onFocus,
  options = [],
  placeholder = 'Select...',
  emptyMessage = 'No results found.',
  id,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      setOpen(newOpen);
      if (newOpen && onFocus) {
        onFocus();
      }
    },
    [onFocus]
  );

  const handleSelect = useCallback(
    (option: string) => {
      onChange(option);
      setOpen(false);
    },
    [onChange]
  );

  const handleInputChange = useCallback(
    (value: string) => {
      onInputChange(value);
    },
    [onInputChange]
  );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-controls={id}
          className="w-full justify-between"
        >
          {value || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false} id={id}>
          <CommandInput
            placeholder={placeholder}
            value={value}
            onValueChange={handleInputChange}
          />
          <CommandEmpty>{emptyMessage}</CommandEmpty>
          <CommandGroup>
            {options.map((option) => (
              <CommandItem
                key={option}
                value={option}
                onSelect={() => handleSelect(option)}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    value === option ? 'opacity-100' : 'opacity-0'
                  )}
                />
                {option}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
