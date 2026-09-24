import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-6xl font-extrabold text-lify-600">404</p>
      <h1 className="text-xl font-semibold">Cette page n&apos;existe pas ou a expiré.</h1>
      <Link href="/fil" className="btn-primary">
        Retour au fil
      </Link>
    </main>
  );
}
