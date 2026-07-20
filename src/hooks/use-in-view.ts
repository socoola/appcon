'use client';

import { useCallback, useEffect, useState } from 'react';

export type UseInViewOptions = {
  enabled?: boolean;
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
};

// 通用 IntersectionObserver hook，callback-ref 风格。
// 不耦合分页/加载逻辑，仅暴露节点是否进入视口。
export function useInView<T extends Element = HTMLDivElement>(
  options: UseInViewOptions = {},
): { ref: (node: T | null) => void; inView: boolean } {
  const {
    enabled = true,
    root = null,
    rootMargin = '0px',
    threshold = 0,
  } = options;

  const [node, setNode] = useState<T | null>(null);
  const [inView, setInView] = useState(false);
  const ref = useCallback((next: T | null) => setNode(next), []);

  useEffect(() => {
    if (!enabled || !node || typeof IntersectionObserver === 'undefined') {
      setInView(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry?.isIntersecting ?? false),
      { root, rootMargin, threshold },
    );

    observer.observe(node);
    return () => {
      observer.unobserve(node);
      observer.disconnect();
    };
  }, [enabled, node, root, rootMargin, threshold]);

  return { ref, inView };
}