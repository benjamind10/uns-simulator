import { useEffect, useState } from 'react';

export function useDarkMode(): [boolean, () => void] {
  const [enabled, setEnabled] = useState<boolean>(() => {
    return (
      localStorage.getItem('theme') === 'dark' ||
      (localStorage.getItem('theme') === null &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (enabled) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [enabled]);

  const toggle = () => setEnabled(!enabled);

  return [enabled, toggle];
}