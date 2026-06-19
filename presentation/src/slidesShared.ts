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
    title: 'Entrar en la app',
    text: 'Registro con reglas de contraseña e inicio de sesión; la app recuerda tu sesión de forma segura.',
  },
  {
    Icon: IconCollection,
    title: 'Tu colección',
    text: 'Añades juegos desde búsqueda (Steam/RAWG), ves lista o cuadrícula y al guardar te avisa al volver.',
  },
  {
    Icon: IconUsers,
    title: 'Perfiles y comunidad',
    text: 'Ver otros usuarios, seguir a quien te interese y ver algo de actividad.',
  },
  {
    Icon: IconMail,
    title: 'Recomendaciones',
    text: 'Solo puedes recomendar a alguien a quien ya sigues; llegan a bandeja y campana.',
  },
  {
    Icon: IconLfg,
    title: 'Buscar grupo (LFG)',
    text: 'Publicación ligada a un juego de tu biblioteca para quedar para jugar.',
  },
  {
    Icon: IconShield,
    title: 'Administración',
    text: 'Quien tiene rol admin puede moderar usuarios, fichas y LFG desde panel y API.',
  },
]
