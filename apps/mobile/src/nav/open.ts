import { router, type Href } from 'expo-router';
import { prefetch } from '@/api/cache';
import { pagePaths } from '@/api/paths';

/** Opens a page and starts loading its data in the same moment, so the fetch runs while the page slides in. */
export function openPage(href: string) {
  void prefetch(pagePaths(href));
  router.push(href as Href);
}
