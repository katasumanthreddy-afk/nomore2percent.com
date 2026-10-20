import { NextRequest, NextResponse } from 'next/server';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';

const MAX_PHOTOS = 6;
const MAX_PHOTO_BYTES = 2 * 1024 * 1024; // browser compresses first

async function guard() {
  const member = await getRequestingTeamMember();
  return member && member.status === 'active' ? member : null;
}

// GET — site updates, newest first, with signed photo URLs.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await guard())) return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  const { id } = await params;

  const { data: updates, error } = await supabaseInternalAdmin
    .from('construction_updates')
    .select('id, progress, note, created_at, team_members:created_by(id, name), construction_update_photos(id, storage_path)')
    .eq('project_id', id)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });

  const paths = (updates || []).flatMap((u) => (u.construction_update_photos || []).map((p) => p.storage_path));
  const signed: Record<string, string> = {};
  if (paths.length) {
    const { data } = await supabaseInternalAdmin.storage.from('project-photos').createSignedUrls(paths, 3600);
    (data || []).forEach((d) => { if (d.path && d.signedUrl) signed[d.path] = d.signedUrl; });
  }

  const result = (updates || []).map(({ construction_update_photos, ...u }) => ({
    ...u,
    photos: (construction_update_photos || []).map((p) => ({ id: p.id, url: signed[p.storage_path] || null })),
  }));
  return NextResponse.json({ success: true, updates: result });
}

// POST (multipart) — a dated site update: progress %, note, photos.
// Also moves the project's current progress to the new figure.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const member = await guard();
  if (!member) return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  const { id } = await params;

  const { data: project } = await supabaseInternalAdmin.from('projects').select('id').eq('id', id).single();
  if (!project) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

  const fd = await req.formData();
  const rawProgress = fd.get('progress');
  const progressNum = typeof rawProgress === 'string' && rawProgress.trim() !== '' ? Number(rawProgress) : null;
  const progress = progressNum != null && Number.isFinite(progressNum) ? Math.max(0, Math.min(100, Math.round(progressNum))) : null;
  const note = typeof fd.get('note') === 'string' ? String(fd.get('note')).trim().slice(0, 2000) : '';
  const files = (fd.getAll('photos') as File[]).filter((f) => f && typeof f !== 'string' && f.size > 0).slice(0, MAX_PHOTOS);

  if (progress == null && !note && files.length === 0) {
    return NextResponse.json({ success: false, message: 'Add a progress figure, a note or a photo.' }, { status: 400 });
  }

  const { data: update, error } = await supabaseInternalAdmin
    .from('construction_updates')
    .insert([{ project_id: Number(id), progress, note: note || null, created_by: member.id }])
    .select('id')
    .single();
  if (error || !update) return NextResponse.json({ success: false, message: error?.message || 'Could not save' }, { status: 500 });

  let uploaded = 0;
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    if (!f.type.startsWith('image/') || f.size > MAX_PHOTO_BYTES) continue;
    const ext = (f.name.split('.').pop() || 'jpg').replace(/[^a-z0-9]/gi, '').slice(0, 5) || 'jpg';
    const path = `project-${id}/update-${update.id}/${Date.now()}-${i}.${ext}`;
    const { error: upErr } = await supabaseInternalAdmin.storage
      .from('project-photos')
      .upload(path, Buffer.from(await f.arrayBuffer()), { contentType: f.type, upsert: false });
    if (!upErr) {
      await supabaseInternalAdmin.from('construction_update_photos').insert([{ update_id: update.id, storage_path: path }]);
      uploaded++;
    }
  }

  const projectPatch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (progress != null) projectPatch.construction_progress = progress;
  await supabaseInternalAdmin.from('projects').update(projectPatch).eq('id', id);

  return NextResponse.json({ success: true, photosUploaded: uploaded, photosSkipped: files.length - uploaded });
}

// DELETE ?update_id=X — remove a mistaken update and its photos.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await guard())) return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  const { id } = await params;
  const updateId = new URL(req.url).searchParams.get('update_id');
  if (!updateId) return NextResponse.json({ success: false, message: 'Missing update_id' }, { status: 400 });

  const { data: photos } = await supabaseInternalAdmin.from('construction_update_photos').select('storage_path').eq('update_id', updateId);
  const { error } = await supabaseInternalAdmin.from('construction_updates').delete().eq('id', updateId).eq('project_id', id);
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  if (photos?.length) await supabaseInternalAdmin.storage.from('project-photos').remove(photos.map((p) => p.storage_path));
  return NextResponse.json({ success: true });
}
