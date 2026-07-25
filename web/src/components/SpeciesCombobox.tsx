import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SPECIES_OPTIONS } from '../api/species';
import { toIntlLocale } from '../locales/i18n';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function SpeciesCombobox({ value, onChange }: Props) {
  const { t, i18n } = useTranslation('pets');

  const translatedOptions = useMemo(() => {
    return SPECIES_OPTIONS.map((option) => ({
      ...option,
      label: t(`species.${option.key}`),
    })).sort((a, b) => a.label.localeCompare(b.label, toIntlLocale(i18n.language)));
  }, [t, i18n.language]);

  const selectedLabel = useMemo(() => {
    const match = translatedOptions.find((option) => option.key === value);
    return match?.label ?? value;
  }, [translatedOptions, value]);

  const [query, setQuery] = useState(selectedLabel);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(selectedLabel);
  }, [selectedLabel]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery(selectedLabel);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedLabel]);

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return translatedOptions;
    return translatedOptions.filter((option) => option.label.toLowerCase().includes(normalized));
  }, [query, translatedOptions]);

  const selectOption = (key: string, label: string) => {
    onChange(key);
    setQuery(label);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setIsOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, filteredOptions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const option = filteredOptions[highlightedIndex];
      if (option) selectOption(option.key, option.label);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery(selectedLabel);
    }
  };

  return (
    <div className="combobox" ref={containerRef}>
      <input
        type="text"
        value={query}
        placeholder={t('speciesCombobox.searchPlaceholder')}
        onFocus={() => setIsOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
          setHighlightedIndex(0);
          if (e.target.value.trim() === '') onChange('');
        }}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
      />
      {isOpen && (
        <ul className="combobox__list" role="listbox">
          <li
            className={`combobox__option ${value === '' ? 'combobox__option--selected' : ''}`}
            onMouseDown={() => selectOption('', '')}
          >
            🐾 {t('speciesCombobox.notSpecified')}
          </li>
          {filteredOptions.map((option, index) => (
            <li
              key={option.key}
              role="option"
              aria-selected={value === option.key}
              className={`combobox__option ${
                index === highlightedIndex ? 'combobox__option--highlighted' : ''
              } ${value === option.key ? 'combobox__option--selected' : ''}`}
              onMouseDown={() => selectOption(option.key, option.label)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              {option.emoji} {option.label}
            </li>
          ))}
          {filteredOptions.length === 0 && (
            <li className="combobox__empty">{t('speciesCombobox.noResults')}</li>
          )}
        </ul>
      )}
    </div>
  );
}
