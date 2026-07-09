import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import ProjectDetailClient from './ProjectDetailClient';
import { getDeveloperProject } from '@/lib/get-developer-project';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const project = await getDeveloperProject(id);

  if (!project) {
    return { title: 'Project Not Found | nomore2percent' };
  }

  const title = `${project.project_name} by ${project.developer_name} — ${project.area}, Hyderabad | nomore2percent`;
  const description =
    project.description ||
    `${project.project_name} by ${project.developer_name} in ${project.area}, Hyderabad. ${project.price_range || ''} Explore unit types, amenities, and possession details through nomore2percent at just 1% brokerage.`;
  const image = project.images?.[0];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: image ? [{ url: image, width: 1200, height: 630, alt: project.project_name }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getDeveloperProject(id);

  if (!project) notFound();

  return (
    <div className="flex-1 bg-stone-50">
      <Header />
      <ProjectDetailClient project={project} />
    </div>
  );
}
