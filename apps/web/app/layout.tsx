import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Búsqueda Jurídica · Poder Judicial',
  description:
    'Sistema de búsqueda y recuperación de información (RAG) sobre sentencias del Poder Judicial.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
