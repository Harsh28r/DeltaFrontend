declare module 'react-day-picker' {
  import * as React from 'react';

  export interface DayPickerProps {
    mode?: 'single' | 'range' | 'multiple';
    selected?: Date | Date[] | { from?: Date; to?: Date } | undefined;
    onSelect?: (date: Date | Date[] | { from?: Date; to?: Date } | undefined) => void;
    defaultMonth?: Date;
    numberOfMonths?: number;
    className?: string;
    classNames?: {
      months?: string;
      month?: string;
      caption?: string;
      caption_label?: string;
      nav?: string;
      nav_button?: string;
      nav_button_previous?: string;
      nav_button_next?: string;
      table?: string;
      head_row?: string;
      head_cell?: string;
      row?: string;
      cell?: string;
      day?: string;
      day_range_end?: string;
      day_selected?: string;
      day_today?: string;
      day_outside?: string;
      day_disabled?: string;
      day_range_middle?: string;
      day_hidden?: string;
      [key: string]: string | undefined;
    };
    components?: {
      IconLeft?: React.ComponentType<{ className?: string; [key: string]: any }>;
      IconRight?: React.ComponentType<{ className?: string; [key: string]: any }>;
      [key: string]: React.ComponentType<any> | undefined;
    };
    showOutsideDays?: boolean;
    initialFocus?: boolean;
    [key: string]: any;
  }

  export const DayPicker: React.ComponentType<DayPickerProps>;
}

