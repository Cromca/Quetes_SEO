J'ai réalisé un audit Lighthouse en mode mobile sur la page d'accueil de mon projet Pokédex React.

LCP : 3,18 secondes avant optimisation, puis 1,51 seconde après optimisation.
INP : 8 millisecondes lors d'un test d'interactions local après optimisation. Lighthouse ne mesure pas l'INP dans son audit de chargement.
CLS : 0 avant et après optimisation.

La métrique la plus problématique était le LCP, car il dépassait l'objectif de 2,5 secondes. L'image de Bulbizarre était trop lourde et chargée tardivement. Je l'ai convertie en WebP et préchargée pour accélérer son affichage.
