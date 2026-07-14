import type { Metadata } from 'next';
import ContactClient from './ContactClient';

export const metadata: Metadata = {
  title: 'Contact Us | nomore2percent',
  description: 'Get in touch with nomore2percent — Hyderabad real estate at just 1% brokerage. WhatsApp, call, or send us a message.',
};

export default function ContactPage() {
  return <ContactClient />;
}
