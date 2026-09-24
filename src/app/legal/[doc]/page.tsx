import { notFound } from 'next/navigation';

type Doc = 'conditions' | 'confidentialite' | 'regles-de-conduite';

const DOCS: Record<Doc, { title: string; sections: { h: string; p: string[] }[] }> = {
  conditions: {
    title: 'Conditions d\u2019utilisation',
    sections: [
      {
        h: '1. Objet',
        p: [
          'Lify est un service social et multimédia : messagerie, stories, reels, catalogue de musique et de vidéos, bibliothèque de livres. L\u2019accès de base est gratuit avec des quotas quotidiens et mensuels.',
        ],
      },
      {
        h: '2. Compte',
        p: [
          'L\u2019inscription est réservée aux personnes de 13 ans et plus. Vous êtes responsable de la confidentialité de votre mot de passe et des contenus que vous publiez.',
          'Vous pouvez exporter vos données ou supprimer votre compte à tout moment depuis les paramètres.',
        ],
      },
      {
        h: '3. Contenus',
        p: [
          'Vous devez détenir les droits sur tout contenu que vous téléversez. Ne sont autorisés que les contenus du domaine public, sous licence Creative Commons, publiés par des créateurs indépendants ayant accepté les conditions, ou issus de partenaires sous contrat.',
          'La diffusion de films, séries, musiques ou matchs protégés sans droits est strictement interdite, même en téléversement personnel. Tout contenu illicite est retiré sous 48 heures après signalement.',
        ],
      },
      {
        h: '4. Usage du service',
        p: [
          'Il est interdit d\u2019utiliser Lify pour harceler, menacer, diffamer, spammer ou contourner les quotas. Les comptes récidivistes sont bloqués.',
        ],
      },
      {
        h: '5. Mode gratuit',
        p: [
          'Le mode gratuit inclut la messagerie et le fil en illimité, 20 lectures/écoutes par jour et 3 nouveaux livres par mois. Une offre premium retirera ces limites plus tard.',
        ],
      },
    ],
  },
  confidentialite: {
    title: 'Politique de confidentialité',
    sections: [
      {
        h: 'Données collectées (minimales)',
        p: [
          'Nous collectons uniquement : votre email, votre identifiant, votre nom affiché, votre photo, votre biographie et vos centres d\u2019intérêt — plus les contenus que vous publiez et vos messages, nécessaires au fonctionnement du service.',
          'Aucune donnée n\u2019est revendue.',
        ],
      },
      {
        h: 'Consentement',
        p: [
          'En créant un compte, vous consentez au traitement de ces données pour fournir le service. Vous pouvez retirer votre consentement en supprimant votre compte.',
        ],
      },
      {
        h: 'Vos droits',
        p: [
          'Accès, rectification, export et suppression : tout se fait depuis la page Paramètres. Les mots de passe sont stockés uniquement sous forme de haché fourni par le service d\u2019authentification.',
        ],
      },
      {
        h: 'Sécurité',
        p: [
          'HTTPS partout, mots de passe jamais stockés en clair, protection contre l\u2019injection SQL et le vol de session (sessions signées, cookies httpOnly).',
        ],
      },
    ],
  },
  'regles-de-conduite': {
    title: 'Règles de conduite et modération',
    sections: [
      {
        h: 'Ce qui est interdit',
        p: [
          'Contenus protégés par le droit d\u2019auteur sans licence ; violence ; harcèlement et discours haineux ; contenu sexuel impliquant des mineurs ; spam et arnaques ; fausses informations dangereuses pour la santé publique.',
        ],
      },
      {
        h: 'Signalement',
        p: [
          'Chaque publication, message, profil et élément du catalogue comporte un bouton ⚑ Signaler. Les signalements sont traités en moins de 48 heures.',
        ],
      },
      {
        h: 'Mesures',
        p: [
          'Selon la gravité : suppression du contenu, avertissement, suspension temporaire, blocage définitif du compte récidiviste.',
          'Protection des mineurs : âge minimal de 13 ans à l\u2019inscription et filtrage des contenus adultes.',
        ],
      },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(DOCS).map((doc) => ({ doc }));
}

export default async function LegalPage({ params }: { params: { doc: string } }) {
  const content = DOCS[params.doc as Doc];
  if (!content) notFound();

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold">{content.title}</h1>
      {content.sections.map((s) => (
        <section key={s.h} className="mt-6">
          <h2 className="font-semibold">{s.h}</h2>
          {s.p.map((p, i) => (
            <p key={i} className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {p}
            </p>
          ))}
        </section>
      ))}
      <p className="mt-8 text-xs text-slate-500">
        Dernière mise à jour : 24 septembre 2026.
      </p>
    </div>
  );
}
