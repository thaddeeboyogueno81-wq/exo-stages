import type { Metadata, Viewport } from 'next';
import './globals.css';
import { APP_NAME, APP_TAGLINE } from '@/lib/constants';
import PwaRegister from '@/components/PwaRegister';

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — ${APP_TAGLINE}`,
    template: `%s · ${APP_NAME}`,
  },
  description:
    'Lify réunit au même endroit discuter, regarder, écouter et lire. Un compte unique, un accès gratuit limité, des contenus libres de droits et des créateurs indépendants.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icons/icon.svg' },
};

export const viewport: Viewport = {
  themeColor: '#1b6df5',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
