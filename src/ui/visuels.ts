import {
  AudioLines,
  Calendar,
  CarTaxiFront,
  Coffee,
  Hand,
  Hash,
  MessageCircle,
  ShoppingBasket,
  Users,
  type LucideIcon,
} from 'lucide-react'

/** Icône et couleur système de chaque thème, façon Réglages. */
export const VISUELS_THEMES: Record<string, { icone: LucideIcon; couleur: string }> = {
  salutations: { icone: Hand, couleur: '#ff9500' },
  chiffres: { icone: Hash, couleur: '#007aff' },
  nourriture: { icone: Coffee, couleur: '#a2845e' },
  souk: { icone: ShoppingBasket, couleur: '#34c759' },
  transports: { icone: CarTaxiFront, couleur: '#ffcc00' },
  famille: { icone: Users, couleur: '#ff2d55' },
  jours: { icone: Calendar, couleur: '#ff3b30' },
  expressions: { icone: MessageCircle, couleur: '#30b0c7' },
}

export const VISUEL_SONS = { icone: AudioLines, couleur: '#af52de' }
