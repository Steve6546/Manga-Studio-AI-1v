import React from 'react';
// FIX: Corrected import path
import { OptionType } from '../types';

interface SelectInputProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: OptionType[];
  error?: string;
}

const SelectInput: React.FC<SelectInputProps> = ({ label, id, options, error, className, ...props }) => {
  return (
    <div className={`mb-4 ${className}`}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">
        {label}
      </label>
      <select
        id={id}
        className={`mt-1 block w-full pl-3 pr-10 py-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-gray-100 ${error ? 'border-red-500' : ''}`}
        {...props}
      >
        <option value="" disabled className="text-gray-400">اختر...</option>
        {options.map(option => (
          <option key={option.value} value={option.value} className="text-gray-100 bg-gray-700">
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
};

export default SelectInput;
