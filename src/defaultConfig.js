export const defaultConfig = {
  privacyUrl: '',
  hashtag: '#tarteaucitron',
  cookieName: 'tarteaucitron',
  orientation: 'middle',
  groupServices: false,
  showDetailsOnClick: true,
  serviceDefaultState: 'wait',
  showAlertSmall: true,
  cookieslist: true,
  closePopup: false,
  showIcon: true,
  iconPosition: 'BottomRight',
  adblocker: false,
  DenyAllCta: true,
  AcceptAllCta: true,
  highPrivacy: true,
  handleBrowserDNTRequest: false,
  removeCredit: false,
  moreInfoLink: true,
  useExternalCss: false,
  useExternalJs: false,
  readmoreLink: '',
  mandatory: false,
  mandatoryCta: true
};

export const configOptions = [
  {
    section: 'Configuration Générale',
    options: [
      {
        key: 'privacyUrl',
        label: 'URL de la politique de confidentialité',
        type: 'text',
        placeholder: 'https://example.com/privacy',
        description: 'Lien vers votre page de politique de confidentialité'
      },
      {
        key: 'hashtag',
        label: 'Hashtag',
        type: 'text',
        placeholder: '#tarteaucitron',
        description: 'Ancre pour accéder directement à la bannière'
      },
      {
        key: 'cookieName',
        label: 'Nom du cookie',
        type: 'text',
        placeholder: 'tarteaucitron',
        description: 'Nom du cookie de consentement'
      },
      {
        key: 'orientation',
        label: 'Position de la bannière',
        type: 'select',
        options: [
          { value: 'middle', label: 'Centre' },
          { value: 'top', label: 'Haut' },
          { value: 'bottom', label: 'Bas' }
        ],
        description: 'Position de la bannière de consentement'
      }
    ]
  },
  {
    section: 'Comportement',
    options: [
      {
        key: 'groupServices',
        label: 'Grouper les services par catégorie',
        type: 'checkbox',
        description: 'Affiche les services regroupés par catégorie'
      },
      {
        key: 'showDetailsOnClick',
        label: 'Afficher les détails au clic',
        type: 'checkbox',
        description: 'Développe automatiquement les détails au clic'
      },
      {
        key: 'serviceDefaultState',
        label: 'État par défaut des services',
        type: 'select',
        options: [
          { value: 'wait', label: 'En attente' },
          { value: 'true', label: 'Accepté' },
          { value: 'false', label: 'Refusé' }
        ],
        description: 'État initial des services non configurés'
      },
      {
        key: 'showAlertSmall',
        label: 'Afficher la petite alerte',
        type: 'checkbox',
        description: 'Affiche une petite bannière en bas de page'
      },
      {
        key: 'cookieslist',
        label: 'Afficher la liste des cookies',
        type: 'checkbox',
        description: 'Affiche la liste détaillée des cookies'
      },
      {
        key: 'closePopup',
        label: 'Fermer automatiquement le popup',
        type: 'checkbox',
        description: 'Ferme automatiquement après validation'
      }
    ]
  },
  {
    section: 'Icône et Position',
    options: [
      {
        key: 'showIcon',
        label: 'Afficher l\'icône',
        type: 'checkbox',
        description: 'Affiche une icône flottante pour réouvrir le panneau'
      },
      {
        key: 'iconPosition',
        label: 'Position de l\'icône',
        type: 'select',
        options: [
          { value: 'BottomRight', label: 'Bas droite' },
          { value: 'BottomLeft', label: 'Bas gauche' },
          { value: 'TopRight', label: 'Haut droite' },
          { value: 'TopLeft', label: 'Haut gauche' },
          { value: 'MiddleRight', label: 'Centre droite' },
          { value: 'MiddleLeft', label: 'Centre gauche' }
        ],
        description: 'Position de l\'icône flottante'
      }
    ]
  },
  {
    section: 'Boutons et Actions',
    options: [
      {
        key: 'DenyAllCta',
        label: 'Bouton "Tout refuser"',
        type: 'checkbox',
        description: 'Affiche le bouton pour tout refuser'
      },
      {
        key: 'AcceptAllCta',
        label: 'Bouton "Tout accepter"',
        type: 'checkbox',
        description: 'Affiche le bouton pour tout accepter'
      },
      {
        key: 'moreInfoLink',
        label: 'Lien "Plus d\'informations"',
        type: 'checkbox',
        description: 'Affiche un lien vers plus d\'informations'
      },
      {
        key: 'readmoreLink',
        label: 'URL du lien "En savoir plus"',
        type: 'text',
        placeholder: 'https://example.com/cookies',
        description: 'Lien personnalisé pour en savoir plus'
      }
    ]
  },
  {
    section: 'Options Avancées',
    options: [
      {
        key: 'highPrivacy',
        label: 'Mode haute confidentialité',
        type: 'checkbox',
        description: 'Ne charge rien avant le consentement explicite'
      },
      {
        key: 'handleBrowserDNTRequest',
        label: 'Respecter Do Not Track',
        type: 'checkbox',
        description: 'Respecte le paramètre DNT du navigateur'
      },
      {
        key: 'adblocker',
        label: 'Détecter les bloqueurs de publicité',
        type: 'checkbox',
        description: 'Affiche un message si un adblocker est détecté'
      },
      {
        key: 'mandatory',
        label: 'Cookie obligatoire',
        type: 'checkbox',
        description: 'Le consentement est obligatoire pour continuer'
      },
      {
        key: 'mandatoryCta',
        label: 'Bouton obligatoire visible',
        type: 'checkbox',
        description: 'Affiche un bouton pour les cookies obligatoires'
      },
      {
        key: 'removeCredit',
        label: 'Masquer les crédits',
        type: 'checkbox',
        description: 'Masque la mention "Réalisé avec tarteaucitron.js"'
      }
    ]
  },
  {
    section: 'Personnalisation CSS/JS',
    options: [
      {
        key: 'useExternalCss',
        label: 'Utiliser un CSS externe',
        type: 'checkbox',
        description: 'Désactive le CSS par défaut'
      },
      {
        key: 'useExternalJs',
        label: 'Utiliser un JS externe',
        type: 'checkbox',
        description: 'Utilise une version personnalisée de tarteaucitron.js'
      }
    ]
  }
];
