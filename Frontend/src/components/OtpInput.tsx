import React, { useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
}

export default function OtpInput({ value, onChange, length = 6 }: OtpInputProps) {
  const { theme } = useTheme();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  // Autofocus the first box on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Split value into array
  const otpArray = value.split('').concat(Array(length).fill('')).slice(0, length);

  const focusInput = (index: number) => {
    if (inputRefs.current[index]) {
      inputRefs.current[index]?.focus();
      // Move cursor to the end on focus
      setTimeout(() => {
        inputRefs.current[index]?.setSelectionRange(1, 1);
      }, 0);
    }
  };

  const handleInputChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) return;

    // Use only the last character typed if length is somehow > 1
    const singleChar = val.slice(-1);
    
    const newOtpArray = [...otpArray];
    newOtpArray[index] = singleChar;
    
    const updatedValue = newOtpArray.join('');
    onChange(updatedValue);

    // Auto-focus the next slot
    if (index < length - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      
      const newOtpArray = [...otpArray];
      
      if (otpArray[index]) {
        // If current box has value, clear it
        newOtpArray[index] = '';
        onChange(newOtpArray.join(''));
      } else if (index > 0) {
        // If current box is already empty, clear the previous box and focus it
        newOtpArray[index - 1] = '';
        onChange(newOtpArray.join(''));
        focusInput(index - 1);
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (index > 0) {
        focusInput(index - 1);
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (index < length - 1) {
        focusInput(index + 1);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, length).replace(/\D/g, '');
    
    if (pastedData) {
      onChange(pastedData);
      // Focus the last filled input or the last input box
      const focusIndex = Math.min(pastedData.length, length - 1);
      focusInput(focusIndex);
    }
  };

  return (
    <div className="flex items-center justify-center gap-2.5 sm:gap-3 my-4">
      {otpArray.map((char, index) => {
        const isFocused = document.activeElement === inputRefs.current[index];
        const hasValue = char !== '';
        
        return (
          <div key={index} className="relative">
            <input
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={char}
              onChange={(e) => handleInputChange(index, e)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              onFocus={() => focusInput(index)}
              className={`w-11 h-14 sm:w-14 sm:h-16 text-center text-xl font-black rounded-2xl border transition-all duration-300 focus:outline-none
                ${theme === 'dark' ? 'text-white bg-zinc-950' : 'text-zinc-900 bg-gray-50'}
                ${isFocused 
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.25)] scale-105' 
                  : hasValue 
                    ? 'border-emerald-500/50 shadow-[0_4px_12px_rgba(16,185,129,0.06)]' 
                    : theme === 'dark' 
                      ? 'border-white/10 hover:border-white/20' 
                      : 'border-zinc-200 hover:border-zinc-300'
                }
              `}
              placeholder="-"
              aria-label={`OTP Code Character ${index + 1}`}
            />
            {/* Elegant tiny bottom indicator line */}
            <div 
              className={`absolute bottom-2 left-1/4 right-1/4 h-0.5 rounded-full transition-all duration-300
                ${isFocused 
                  ? 'bg-emerald-500 scale-100' 
                  : hasValue 
                    ? 'bg-emerald-500/40 scale-100' 
                    : theme === 'dark' 
                      ? 'bg-zinc-800 scale-50' 
                      : 'bg-zinc-200 scale-50'
                }
              `}
            />
          </div>
        );
      })}
    </div>
  );
}
