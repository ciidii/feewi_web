import {ExamResult, GalleryAlbum, PricingPlan, CampusAmenity} from '../../models/showcase';

/**
 * Données de démonstration pour la vitrine publique, en attendant que le backend
 * expose ces informations. Le branding (SchoolBranding) est désormais branché sur
 * le vrai backend (identity-service) — seuls résultats/galerie/tarifs restent mockés ici.
 * À supprimer d'un bloc quand `ShowcaseContentService` sera branché sur de vrais endpoints
 * pour ces derniers — aucun composant ne dépend directement de ce fichier.
 */

export const MOCK_EXAM_RESULTS: ExamResult[] = [
  {
    id: 'bac-2025',
    examLabel: 'Baccalauréat',
    year: '2025',
    series: 'Toutes séries',
    totalCandidates: 112,
    admittedCount: 108,
    successRate: 96,
    topStudents: [
      {name: 'Aïssatou Diallo', mention: 'Très Bien', score: '17.4/20'},
      {name: 'Moussa Faye', mention: 'Bien', score: '15.8/20'},
      {name: 'Fatou Ndiaye', mention: 'Bien', score: '15.2/20'},
    ]
  },
  {
    id: 'bepc-2025',
    examLabel: 'BEPC',
    year: '2025',
    totalCandidates: 96,
    admittedCount: 94,
    successRate: 98,
    topStudents: [
      {name: 'Cheikh Ba', mention: 'Très Bien', score: '16.9/20'},
    ]
  },
  {
    id: 'bac-2024',
    examLabel: 'Baccalauréat',
    year: '2024',
    series: 'Toutes séries',
    totalCandidates: 101,
    admittedCount: 93,
    successRate: 92,
  },
  {
    id: 'bepc-2024',
    examLabel: 'BEPC',
    year: '2024',
    totalCandidates: 89,
    admittedCount: 85,
    successRate: 95,
  },
];

export const MOCK_GALLERY_ALBUMS: GalleryAlbum[] = [
  {
    id: 'campus',
    title: 'Le Campus',
    category: 'Campus',
    coverImageUrl: 'https://picsum.photos/seed/campus-cover/600/450',
    photos: [
      {id: 'campus-1', url: 'https://picsum.photos/seed/campus-1/1200/800', caption: 'Bâtiment principal'},
      {id: 'campus-2', url: 'https://picsum.photos/seed/campus-2/1200/800', caption: 'Bibliothèque'},
      {id: 'campus-3', url: 'https://picsum.photos/seed/campus-3/1200/800', caption: 'Laboratoire de sciences'},
    ]
  },
  {
    id: 'vie-scolaire',
    title: 'Vie Scolaire',
    category: 'Vie scolaire',
    coverImageUrl: 'https://picsum.photos/seed/vie-cover/600/450',
    photos: [
      {id: 'vie-1', url: 'https://picsum.photos/seed/vie-1/1200/800', caption: 'Salle de classe'},
      {id: 'vie-2', url: 'https://picsum.photos/seed/vie-2/1200/800', caption: 'Récréation'},
    ]
  },
  {
    id: 'evenements',
    title: 'Événements',
    category: 'Événements',
    coverImageUrl: 'https://picsum.photos/seed/event-cover/600/450',
    photos: [
      {id: 'event-1', url: 'https://picsum.photos/seed/event-1/1200/800', caption: 'Remise des diplômes 2025'},
      {id: 'event-2', url: 'https://picsum.photos/seed/event-2/1200/800', caption: 'Journée culturelle'},
    ]
  },
  {
    id: 'sport',
    title: 'Sport',
    category: 'Sport',
    coverImageUrl: 'https://picsum.photos/seed/sport-cover/600/450',
    photos: [
      {id: 'sport-1', url: 'https://picsum.photos/seed/sport-1/1200/800', caption: 'Tournoi inter-classes'},
    ]
  },
];

export const MOCK_PRICING_PLANS: PricingPlan[] = [
  {
    id: 'primaire',
    cycle: 'PRIMARY',
    label: 'Primaire',
    tuitionAmount: 350000,
    currency: 'FCFA',
    period: 'an',
    registrationFee: 25000,
    inclusions: ['Manuels scolaires', 'Suivi pédagogique personnalisé', 'Assurance scolaire'],
  },
  {
    id: 'college',
    cycle: 'MIDDLE',
    label: 'Collège',
    tuitionAmount: 450000,
    currency: 'FCFA',
    period: 'an',
    registrationFee: 30000,
    inclusions: ['Manuels scolaires', 'Laboratoire de sciences', 'Assurance scolaire', 'Accès bibliothèque'],
  },
  {
    id: 'lycee',
    cycle: 'HIGH',
    label: 'Lycée',
    tuitionAmount: 550000,
    currency: 'FCFA',
    period: 'an',
    registrationFee: 35000,
    inclusions: ['Manuels scolaires', 'Préparation examens officiels', 'Assurance scolaire', 'Accès bibliothèque', 'Orientation post-bac'],
  },
];

export const MOCK_CAMPUS_AMENITIES: CampusAmenity[] = [
  {id: 'cantine', icon: 'Utensils', label: 'Cantine scolaire', description: 'Repas équilibrés préparés sur place, menu affiché chaque semaine.', included: false},
  {id: 'transport', icon: 'Bus', label: 'Transport scolaire', description: 'Ramassage matin et soir sur plusieurs circuits en ville.', included: false},
  {id: 'etudes', icon: 'BookOpen', label: 'Études surveillées', description: 'Accompagnement aux devoirs après les cours, du lundi au vendredi.', included: false},
  {id: 'infirmerie', icon: 'HeartPulse', label: 'Infirmerie', description: 'Personnel de santé présent sur le campus pendant les heures de cours.', included: true},
  {id: 'numerique', icon: 'Laptop', label: 'Salle informatique', description: 'Initiation au numérique et accès aux outils bureautiques.', included: true},
  {id: 'bibliotheque', icon: 'Library', label: 'Bibliothèque', description: 'Fonds documentaire accessible à tous les élèves.', included: true},
];
