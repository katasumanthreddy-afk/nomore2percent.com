import type { Metadata } from 'next';
import ProjectsClient from './ProjectsClient';

export const metadata: Metadata = {
  title: 'New Projects in Hyderabad | nomore2percent',
  description: 'Browse new developer projects and upcoming launches across Hyderabad — Gachibowli, Kokapet, Financial District and more. Verified projects at 1% brokerage.',
};

export default function ProjectsPage() {
  return <ProjectsClient />;
}
