import type { Metadata } from 'next';
import RegisterForm from '@/components/auth/RegisterForm';

export const metadata: Metadata = { title: 'Inscription' };

export default function InscriptionPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <RegisterForm />
    </main>
  );
}
