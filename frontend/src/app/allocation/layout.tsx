import MainLayout from '@/components/MainLayout';

export default function AllocationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
