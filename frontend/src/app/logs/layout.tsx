import MainLayout from '@/components/MainLayout';

export default function LogsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
