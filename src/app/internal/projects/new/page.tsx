import { Suspense } from 'react';
import InternalHeader from '@/components/internal/InternalHeader';
import { requireInternalMember } from '@/lib/require-internal-member';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import NewProjectClient from './NewProjectClient';

// Prefills from whichever record the project was started from:
// ?requirement_id=, ?land_lead_id=, ?property_id=, ?brand_id=
export default async function NewProjectPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const member = await requireInternalMember('/internal/projects/new');
  const sp = await searchParams;

  const prefill: Record<string, string> = {};
  const num = (v?: string) => (v && /^\d+$/.test(v) ? v : undefined);

  const requirementId = num(sp.requirement_id);
  const leadId = num(sp.land_lead_id);
  const propertyId = num(sp.property_id);
  const brandId = num(sp.brand_id);

  let reqTitle = '';
  if (requirementId) {
    const { data: r } = await supabaseInternalAdmin.from('site_requirements').select('id, title, brand_id').eq('id', requirementId).single();
    if (r) { prefill.requirement_id = String(r.id); reqTitle = r.title; if (r.brand_id) prefill.brand_id = String(r.brand_id); }
  }
  if (brandId) prefill.brand_id = brandId;
  if (leadId) {
    const { data: l } = await supabaseInternalAdmin.from('land_leads').select('id, owner_name, phone, locality, size_sq_yds').eq('id', leadId).single();
    if (l) Object.assign(prefill, { land_lead_id: String(l.id), landowner_name: l.owner_name, landowner_phone: l.phone, locality: l.locality, land_sq_yds: String(Math.round(Number(l.size_sq_yds))) });
  }
  if (propertyId) {
    const { data: p } = await supabaseInternalAdmin.from('commercial_properties').select('id, title, area, sqft, property_type').eq('id', propertyId).single();
    if (p) {
      prefill.property_id = String(p.id);
      if (!prefill.locality && p.area) prefill.locality = p.area;
      if (p.sqft && !prefill.land_sq_yds && p.property_type === 'land') prefill.land_sq_yds = String(Math.round(Number(p.sqft) / 9));
      if (p.sqft && p.property_type !== 'land') prefill.builtup_sqft = String(p.sqft);
    }
  }

  const { data: brands } = await supabaseInternalAdmin.from('brands').select('id, name').order('name');
  const brandName = brands?.find((b) => String(b.id) === prefill.brand_id)?.name;
  prefill.name = [brandName, prefill.locality || reqTitle].filter(Boolean).join(' · ');

  const { data: requirements } = await supabaseInternalAdmin.from('site_requirements').select('id, title').neq('status', 'closed').order('title');
  const { data: team } = await supabaseInternalAdmin.from('team_members').select('id, name').eq('status', 'active').order('name');

  return (
    <div className="min-h-screen bg-stone-50">
      <InternalHeader memberName={member.name} role={member.role} />
      <Suspense>
        <NewProjectClient prefill={prefill} brands={brands || []} requirements={requirements || []} team={team || []} myId={member.id} />
      </Suspense>
    </div>
  );
}
