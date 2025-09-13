"use client";
import React, { useState, useEffect } from "react";
import { Combobox, ComboboxInput, ComboboxOptions, ComboboxOption } from "@headlessui/react";

interface SearchableSelectProps {
  options: Array<{ _id: string; name: string; [key: string]: any }>;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  displayValue?: (item: any) => string;
  renderOption?: (item: any) => React.ReactNode;
  className?: string;
  required?: boolean;
  id?: string;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Search options...",
  displayValue,
  renderOption,
  className = "",
  required = false,
  id
}: SearchableSelectProps) {
  const [query, setQuery] = useState("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(query.toLowerCase()) ||
    (option.description && option.description.toLowerCase().includes(query.toLowerCase())) ||
    (option.firmName && option.firmName.toLowerCase().includes(query.toLowerCase())) ||
    (option.phone && option.phone.includes(query))
  );

  const selectedOption = options.find(option => option._id === value);

  if (!isClient) {
    // Server-side rendering fallback
    return (
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className={`w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:border-blue-500 ${className}`}
      >
        <option value="">{placeholder}</option>
        {options.map(option => (
          <option key={option._id} value={option._id}>
            {displayValue ? displayValue(option) : option.name}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className="relative">
      <Combobox
        value={selectedOption || null}
        onChange={(option) => onChange(option?._id || "")}
        onClose={() => setQuery("")}
      >
        <ComboboxInput
          displayValue={displayValue || ((option: any) => option?.name || "")}
          onChange={(event) => setQuery(event.target.value)}
          className={`w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:border-blue-500 ${className}`}
          placeholder={placeholder}
        />
        <ComboboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-700 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
          {filteredOptions.map((option) => (
            <ComboboxOption
              key={option._id}
              value={option}
              className="relative cursor-pointer select-none py-2 pl-3 pr-9 text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-gray-600"
            >
              {renderOption ? renderOption(option) : (
                <div className="flex flex-col">
                  <span className="font-medium">{option.name}</span>
                  {option.description && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {option.description}
                    </span>
                  )}
                  {option.firmName && option.phone && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {option.firmName} • {option.phone}
                    </span>
                  )}
                </div>
              )}
            </ComboboxOption>
          ))}
          {filteredOptions.length === 0 && query !== "" && (
            <div className="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-500 dark:text-gray-400">
              No options found.
            </div>
          )}
        </ComboboxOptions>
      </Combobox>
    </div>
  );
}
