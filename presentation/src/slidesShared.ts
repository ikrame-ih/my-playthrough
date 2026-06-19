import type { ComponentType } from 'react'
import {
  IconCollection,
  IconLock,
  IconLfg,
  IconMail,
  IconShield,
  IconUsers,
} from './brand-icons'

export const PRODUCT_SWATCHES = ['#0B1120', '#161D2F', '#2dd4bf', '#36d7b7', '#fbbf24'] as const

export type FeatureSlideItem = {
  Icon: ComponentType<{ className?: string }>
  title: string
  text: string
}

export const SLIDE_FEATURES_DATA: FeatureSlideItem[] = [
  {
    Icon: IconLock,
    title: 'Sign in',
    text: 'Registration with password policy and login; the app keeps your session secure.',
  },
  {
    Icon: IconCollection,
    title: 'Your collection',
    text: 'Add games from search (Steam/RAWG), grid or list view, and confirmation when you return after saving.',
  },
  {
    Icon: IconUsers,
    title: 'Profiles & community',
    text: 'Browse other members, follow people you care about, and skim activity.',
  },
  {
    Icon: IconMail,
    title: 'Recommendations',
    text: 'You can only recommend to someone you follow; items land in the inbox and header bell.',
  },
  {
    Icon: IconLfg,
    title: 'Find group (LFG)',
    text: 'Posts tied to a game in your library to look for teammates.',
  },
  {
    Icon: IconShield,
    title: 'Administration',
    text: 'Admin role can moderate users, entries, and LFG from the panel and API.',
  },
]
