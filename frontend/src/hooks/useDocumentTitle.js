import { useEffect } from 'react';

/** Set document.title while a page is mounted. */
export function useDocumentTitle(title) {
  useEffect(() => {
    const previous = document.title;
    if (title) document.title = `${title} | AlumniConnect`;
    return () => {
      document.title = previous;
    };
  }, [title]);
}

export default useDocumentTitle;
