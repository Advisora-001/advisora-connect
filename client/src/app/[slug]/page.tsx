import { Metadata } from 'next';
import LegalDocumentPage from '@/components/legal/LegalDocumentPage';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = params.slug;
  const titles: Record<string, string> = {
    'terms-of-use': 'Terms of Use - Advisora Connect',
    'privacy-policy': 'Privacy Policy - Advisora Connect',
    'data-protection': 'Data Protection Policy - Advisora Connect',
    'code-of-conduct': 'Code of Conduct - Advisora Connect',
    'professional-onboarding-agreement': 'Professional Onboarding Agreement - Advisora Connect',
  };

  return {
    title: titles[slug] || 'Legal Document - Advisora Connect',
    description: `View and accept ${titles[slug] || 'legal document'} for Advisora Connect platform.`,
  };
}

export default function LegalPage({ params }: Props) {
  return <LegalDocumentPage slug={params.slug} />;
}