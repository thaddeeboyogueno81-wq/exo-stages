import type { Metadata } from 'next';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';

export const metadata: Metadata = { title: 'Mot de passe oublié' };

export default function MotDePasseOubliePage() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <ForgotPasswordForm />
    </main>
  );
}
