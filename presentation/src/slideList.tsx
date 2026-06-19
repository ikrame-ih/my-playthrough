import type { ComponentType } from 'react'
import {
  SlideArch,
  SlideClosing,
  SlideCover,
  SlideDemo,
  SlideFeatures,
  SlideProduct,
  SlideSchema,
} from './slideContents'

export const SLIDE_LIST: ComponentType[] = [
  SlideCover,
  SlideProduct,
  SlideArch,
  SlideSchema,
  SlideFeatures,
  SlideDemo,
  SlideClosing,
]
