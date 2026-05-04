import type {LucideIconData} from 'lucide-angular';

// ===========================================
// ÉNUMÉRATIONS ET TYPES DE BASE
// ===========================================

/**
 * Types de vues disponibles dans le composant
 */
export type ViewMode = 'table' | 'cards' | 'timeline' | 'expandable';

// ===========================================
// CONFIGURATION DES VUES
// ===========================================

/**
 * Configuration d'une vue pour le sélecteur
 */
export interface ViewConfig {
  /** Identifiant unique de la vue */
  id: ViewMode;
  /** Label affiché */
  label: string;
  /** Icône Lucide */
  icon: string | LucideIconData;
  /** Description pour le tooltip */
  description: string;
  /** Si la vue est disponible (pour activation progressive) */
  isAvailable: boolean;
}

// ===========================================
// STRUCTURES DE DONNÉES PRINCIPALES
// ===========================================

/**
 * Structure d'un badge/statut
 */
export interface Badge {
  /** Texte affiché */
  label: string;
  /** Type de badge (détermine la couleur) */
  type: 'success' | 'warning' | 'danger' | 'info' | 'default' | 'primary';
  /** Info-bulle au survol */
  tooltip?: string;
}

/**
 * Configuration d'une action sur une ligne
 */
export interface RowAction {
  /** Identifiant unique de l'action (ex: 'edit', 'delete', 'validate') */
  id: string;
  /** Label pour le tooltip/bouton */
  label: string;
  /** Icône Lucide */
  icon: any;
  /** Type visuel (détermine la couleur) */
  type?: 'primary' | 'danger' | 'success' | 'warning' | 'default';
  /** Si l'action est critique (demande confirmation par exemple) */
  isCritical?: boolean;
  /** Condition de visibilité basée sur les métadonnées de la ligne */
  hideIf?: (row: TableRow) => boolean;
  /** Condition de désactivation */
  disableIf?: (row: TableRow) => boolean;
}

/**
 * Structure d'une ligne de données
 */
export interface TableRow {
  /** Identifiant unique */
  id: string | number;
  /** Titre principal (obligatoire) */
  title: string;
  /** Sous-titre ou description secondaire */
  subtitle?: string;
  /** Label pour l'avatar (si pas d'image) */
  avatarLabel?: string;
  /** URL de l'avatar (si image) */
  avatarUrl?: string;
  /** Date formatée pour l'affichage */
  date?: string;
  /** Liste des badges/statuts */
  badges?: Badge[];
  /** Données brutes pour la vue détaillée */
  rawData?: any;
  /** Métadonnées supplémentaires (flexible) */
  metadata?: Record<string, any>;
  /** Actions spécifiques à cette ligne (optionnel, surcharge les actions globales) */
  actions?: RowAction[];
}

// ===========================================
// CONFIGURATION DES ONGLETS
// ===========================================

/**
 * Structure d'un onglet
 */
export interface TabItem {
  /** Label de l'onglet */
  label: string;
  /** Icône optionnelle */
  icon?: string | LucideIconData;
  /** Compteur optionnel */
  count?: number;
  /** Si l'onglet est actif (géré par le parent) */
  isActive?: boolean;
}

// ===========================================
// ÉTATS DU COMPOSANT
// ===========================================

/**
 * État de la sélection
 */
export interface SelectionState {
  /** IDs sélectionnés */
  selectedIds: Set<string | number>;
  /** Nombre d'éléments sélectionnés */
  count: number;
  /** Si tous sont sélectionnés */
  isAllSelected: boolean;
  /** Si sélection partielle */
  isPartiallySelected: boolean;
}

/**
 * État de l'expansion (pour la vue extensible)
 */
export interface ExpansionState {
  /** IDs des lignes dépliées */
  expandedIds: Set<string | number>;
}

/**
 * État de la recherche
 */
export interface SearchState {
  /** Requête de recherche */
  query: string;
  /** Si la recherche est active */
  isActive: boolean;
}

// ===========================================
// ÉVÉNEMENTS (POUR LA COMMUNICATION)
// ===========================================

/**
 * Événements de ligne (utilisés par tous les composants de vue)
 */
export interface RowEvents {
  /** Émettre quand on veut voir les détails */
  onView: (row: TableRow) => void;
  /** Émettre quand on veut valider */
  onValidate: (row: TableRow) => void;
  /** Émettre quand on veut imprimer */
  onPrint?: (row: TableRow) => void;
  /** Émettre pour plus d'options */
  onMore?: (row: TableRow) => void;
}

/**
 * Événements de sélection
 */
export interface SelectionEvents {
  /** Basculer la sélection d'une ligne */
  onToggleRow: (id: string | number) => void;
  /** Basculer la sélection de toutes les lignes */
  onToggleAll: () => void;
  /** Effacer toute la sélection */
  onClearSelection: () => void;
}

/**
 * Événements de vue
 */
export interface ViewEvents {
  /** Changement de mode d'affichage */
  onViewModeChange: (mode: ViewMode) => void;
  /** Changement d'onglet */
  onTabChange: (tabLabel: string) => void;
  /** Recherche */
  onSearch: (query: string) => void;
}
