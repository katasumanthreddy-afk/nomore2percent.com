'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import { getAreaCoordinates } from '@/lib/area-coordinates';
import { LAND_TYPES, MIN_SQ_YDS, toSqYds } from '@/lib/land-leads';
import { compressImage } from '@/lib/compress-image';
import { CheckCircle2, ShieldCheck, Landmark, Truck, HardHat, FileSignature, Upload, X, MapPin, Phone } from 'lucide-react';

const LocationPicker = dynamic(() => import('@/components/admin/LocationPicker'), {
  ssr: false,
  loading: () => <div className="h-64 rounded-lg bg-stone-100 animate-pulse" />,
});

type Lang = 'en' | 'te';

const T = {
  en: {
    badge: 'For Hyderabad landowners · 500 sq yds and above',
    h1a: 'Quick-commerce brands need space.',
    h1b: 'Build on your land. We bring the brand.',
    sub: 'Delivery and quick-commerce companies are looking for dark stores and warehouses across Hyderabad. If you own 500+ sq yds and are open to building, we connect you with the brand and handle the construction contract, permissions and lease registration end to end.',
    cta: 'Check if my land fits',
    wa: 'WhatsApp us',
    stats: [['500+ sq yds', 'minimum size'], ['End to end', 'contract to registration'], ['48 hours', 'to hear back']],
    whyTitle: 'What we handle for you',
    why: [
      ['Finding the brand', 'We match your location with quick-commerce and logistics companies looking for space nearby.'],
      ['Construction contract', 'We bring a builder, agree the specs the brand needs, and manage the contract and timeline.'],
      ['Permissions', 'Building approvals and the paperwork the brand requires before it moves in.'],
      ['Lease registration', 'Terms negotiated with the brand and the lease registered, so rent is on paper.'],
    ],
    stepsTitle: 'How it works',
    steps: [
      ['Share your land', 'Fill the form below with location, size and road access. Takes 2 minutes.'],
      ['Free site check', 'Our team checks the location against brand demand and calls you within 48 hours.'],
      ['Brand match & plan', 'If there is demand nearby, we bring the brand requirement, the build specs and a cost estimate.'],
      ['Build, register, earn', 'We manage construction, permissions and lease registration until the brand moves in.'],
    ],
    formTitle: 'Tell us about your land',
    formSub: 'Every detail helps us match your land with the right brand faster.',
    you: 'Your details',
    name: 'Your name', phone: 'Mobile number', relation: 'You are the',
    relOwner: 'Owner', relFamily: 'Family of owner', relAgent: 'Agent / broker',
    land: 'Land details',
    locality: 'Area / village', localityPh: 'e.g. Kompally, Shamirpet, Kollur',
    address: 'Landmark / survey no. (optional)',
    size: 'Land size', unitYds: 'sq yds', unitGuntas: 'guntas', unitAcres: 'acres',
    tooSmall: `We're looking for land of ${MIN_SQ_YDS} sq yds or more.`,
    road: 'Approach road width (feet)', roadPh: 'e.g. 30',
    landType: 'Type of land', choose: 'Choose…',
    title: 'Documents / title', titleClear: 'Clear title, documents ready', titleProgress: 'Some work pending', titleUnsure: 'Not sure',
    build: 'Are you open to constructing on the land?', buildYes: 'Yes, ready to build', buildMaybe: 'Interested, need details', buildNo: 'No, land only',
    use: 'Current use (optional)', usePh: 'e.g. Vacant, farming, parking',
    rent: 'Expected monthly rent ₹ (optional)', rentPh: 'Leave blank if unsure',
    years: 'Preferred lease period (optional)', yearsAny: 'Open to discuss',
    pin: 'Drop a pin on the land (optional but helps a lot)',
    photos: 'Photos of the land (optional, up to 6)', addPhotos: 'Add photos',
    notes: 'Anything else? (optional)',
    submit: 'Check if my land fits', submitting: 'Sending…',
    privacy: 'We only use your number to discuss this land. No spam, no sharing.',
    doneTitle: 'Thank you! We have your details.',
    doneBody: 'Our team will check your land against brand demand and call you within 48 hours. For anything urgent, WhatsApp us.',
    faqTitle: 'Common questions',
    faq: [
      ['Who builds the structure?', 'You do, as the landowner. We bring the builder, the specs the brand needs and manage the construction contract for you.'],
      ['Who is the tenant?', 'Quick-commerce and logistics companies that need dark stores and warehouses close to customers. We introduce you once there is a match.'],
      ['What do you do exactly?', 'We act as the bridge between you and the brand: matching, construction contract, permissions and lease registration, end to end.'],
      ['What size do you need?', `${MIN_SQ_YDS} sq yds and above. Plots on wider roads near residential areas are in highest demand.`],
      ['Is the site check free?', 'Yes. Checking your land and telling you whether there is brand demand nearby costs nothing.'],
    ],
  },
  te: {
    badge: 'హైదరాబాద్ భూ యజమానుల కోసం · 500 గజాలు మరియు ఆపైన',
    h1a: 'క్విక్-కామర్స్ బ్రాండ్‌లకు స్థలం కావాలి.',
    h1b: 'మీ భూమిపై నిర్మించండి. బ్రాండ్‌ను మేము తెస్తాం.',
    sub: 'డెలివరీ, క్విక్-కామర్స్ కంపెనీలు హైదరాబాద్ అంతటా డార్క్ స్టోర్లు, వేర్‌హౌస్‌ల కోసం వెతుకుతున్నాయి. మీకు 500+ గజాల భూమి ఉండి, నిర్మాణానికి సిద్ధంగా ఉంటే, బ్రాండ్‌తో మిమ్మల్ని కలిపి, నిర్మాణ కాంట్రాక్ట్, అనుమతులు, లీజు రిజిస్ట్రేషన్ అన్నీ మేమే చూసుకుంటాం.',
    cta: 'నా భూమి సరిపోతుందా చూడండి',
    wa: 'WhatsApp చేయండి',
    stats: [['500+ గజాలు', 'కనీస విస్తీర్ణం'], ['మొదటి నుండి చివరి వరకు', 'కాంట్రాక్ట్ నుండి రిజిస్ట్రేషన్'], ['48 గంటల్లో', 'మా నుండి కాల్']],
    whyTitle: 'మేము మీ కోసం చేసేవి',
    why: [
      ['బ్రాండ్‌ను వెతకడం', 'మీ లొకేషన్ దగ్గర స్థలం కావాల్సిన క్విక్-కామర్స్, లాజిస్టిక్స్ కంపెనీలతో మ్యాచ్ చేస్తాం.'],
      ['నిర్మాణ కాంట్రాక్ట్', 'బిల్డర్‌ను తెచ్చి, బ్రాండ్‌కు కావాల్సిన స్పెసిఫికేషన్లు ఖరారు చేసి, కాంట్రాక్ట్, టైమ్‌లైన్ నిర్వహిస్తాం.'],
      ['అనుమతులు', 'నిర్మాణ అనుమతులు, బ్రాండ్ వచ్చే ముందు కావలసిన డాక్యుమెంట్లు.'],
      ['లీజు రిజిస్ట్రేషన్', 'బ్రాండ్‌తో షరతులు మాట్లాడి, లీజు రిజిస్టర్ చేయిస్తాం.'],
    ],
    stepsTitle: 'ఎలా పని చేస్తుంది',
    steps: [
      ['భూమి వివరాలు ఇవ్వండి', 'కింది ఫారంలో లొకేషన్, విస్తీర్ణం, రోడ్డు వివరాలు నింపండి. 2 నిమిషాలు చాలు.'],
      ['ఉచిత సైట్ చెక్', 'బ్రాండ్ డిమాండ్‌తో మీ లొకేషన్ పోల్చి, 48 గంటల్లో కాల్ చేస్తాం.'],
      ['బ్రాండ్ మ్యాచ్ & ప్లాన్', 'దగ్గర్లో డిమాండ్ ఉంటే, బ్రాండ్ అవసరం, నిర్మాణ స్పెసిఫికేషన్లు, ఖర్చు అంచనా ఇస్తాం.'],
      ['నిర్మాణం, రిజిస్ట్రేషన్, ఆదాయం', 'బ్రాండ్ వచ్చే వరకు నిర్మాణం, అనుమతులు, లీజు రిజిస్ట్రేషన్ మేమే చూసుకుంటాం.'],
    ],
    formTitle: 'మీ భూమి గురించి చెప్పండి',
    formSub: 'ఎక్కువ వివరాలు ఇస్తే, సరైన బ్రాండ్‌తో త్వరగా మ్యాచ్ చేయగలం.',
    you: 'మీ వివరాలు',
    name: 'మీ పేరు', phone: 'మొబైల్ నంబర్', relation: 'మీరు',
    relOwner: 'యజమాని', relFamily: 'యజమాని కుటుంబ సభ్యులు', relAgent: 'ఏజెంట్ / బ్రోకర్',
    land: 'భూమి వివరాలు',
    locality: 'ఏరియా / గ్రామం', localityPh: 'ఉదా. కొంపల్లి, శామీర్‌పేట్, కొల్లూరు',
    address: 'ల్యాండ్‌మార్క్ / సర్వే నం. (ఐచ్ఛికం)',
    size: 'భూమి విస్తీర్ణం', unitYds: 'గజాలు', unitGuntas: 'గుంటలు', unitAcres: 'ఎకరాలు',
    tooSmall: `మాకు ${MIN_SQ_YDS} గజాలు లేదా అంతకంటే ఎక్కువ భూమి కావాలి.`,
    road: 'రోడ్డు వెడల్పు (అడుగులు)', roadPh: 'ఉదా. 30',
    landType: 'భూమి రకం', choose: 'ఎంచుకోండి…',
    title: 'డాక్యుమెంట్లు / టైటిల్', titleClear: 'క్లియర్ టైటిల్, డాక్యుమెంట్లు రెడీ', titleProgress: 'కొంత పని పెండింగ్', titleUnsure: 'తెలియదు',
    build: 'భూమిపై నిర్మాణం చేయడానికి సిద్ధమా?', buildYes: 'అవును, నిర్మిస్తాను', buildMaybe: 'ఆసక్తి ఉంది, వివరాలు కావాలి', buildNo: 'లేదు, భూమి మాత్రమే',
    use: 'ప్రస్తుత వినియోగం (ఐచ్ఛికం)', usePh: 'ఉదా. ఖాళీ, వ్యవసాయం, పార్కింగ్',
    rent: 'ఆశించే నెల అద్దె ₹ (ఐచ్ఛికం)', rentPh: 'తెలియకపోతే ఖాళీగా వదలండి',
    years: 'ఇష్టమైన లీజు కాలం (ఐచ్ఛికం)', yearsAny: 'చర్చించవచ్చు',
    pin: 'మ్యాప్‌లో భూమిపై పిన్ పెట్టండి (ఐచ్ఛికం, కానీ చాలా ఉపయోగం)',
    photos: 'భూమి ఫోటోలు (ఐచ్ఛికం, 6 వరకు)', addPhotos: 'ఫోటోలు జోడించండి',
    notes: 'ఇంకేమైనా? (ఐచ్ఛికం)',
    submit: 'నా భూమి సరిపోతుందా చూడండి', submitting: 'పంపుతున్నాం…',
    privacy: 'మీ నంబర్‌ను ఈ భూమి గురించి మాట్లాడటానికి మాత్రమే వాడతాము. స్పామ్ లేదు, ఎవరికీ ఇవ్వము.',
    doneTitle: 'ధన్యవాదాలు! మీ వివరాలు అందాయి.',
    doneBody: 'బ్రాండ్ డిమాండ్‌తో మీ భూమిని పోల్చి, 48 గంటల్లో కాల్ చేస్తాం. అత్యవసరమైతే WhatsApp చేయండి.',
    faqTitle: 'తరచుగా అడిగే ప్రశ్నలు',
    faq: [
      ['నిర్మాణం ఎవరు చేస్తారు?', 'భూ యజమానిగా మీరే. బిల్డర్, బ్రాండ్‌కు కావాల్సిన స్పెసిఫికేషన్లు తెచ్చి, కాంట్రాక్ట్ మేము నిర్వహిస్తాం.'],
      ['అద్దెదారు ఎవరు?', 'కస్టమర్లకు దగ్గరగా డార్క్ స్టోర్లు, వేర్‌హౌస్‌లు కావాల్సిన క్విక్-కామర్స్, లాజిస్టిక్స్ కంపెనీలు. మ్యాచ్ అయ్యాక పరిచయం చేస్తాం.'],
      ['మీరు ఏం చేస్తారు?', 'మీకు, బ్రాండ్‌కు మధ్య వారధిగా: మ్యాచింగ్, నిర్మాణ కాంట్రాక్ట్, అనుమతులు, లీజు రిజిస్ట్రేషన్ అన్నీ.'],
      ['ఎంత విస్తీర్ణం కావాలి?', `${MIN_SQ_YDS} గజాలు మరియు ఆపైన. నివాస ప్రాంతాల దగ్గర, వెడల్పాటి రోడ్డు ఉన్నవాటికి ఎక్కువ డిమాండ్.`],
      ['సైట్ చెక్ ఉచితమా?', 'అవును. మీ భూమి దగ్గర బ్రాండ్ డిమాండ్ ఉందో లేదో చెప్పడానికి ఎలాంటి ఛార్జీ లేదు.'],
    ],
  },
} as const;

const WHATSAPP = '917013224895';

interface PhotoPreview { file: File; url: string }

export default function LeaseLandClient() {
  const params = useSearchParams();
  const [lang, setLang] = useState<Lang>(params.get('lang') === 'te' ? 'te' : 'en');
  const t = T[lang];

  const utm = useMemo(() => ({
    utm_source: params.get('utm_source') || '',
    utm_medium: params.get('utm_medium') || '',
    utm_campaign: params.get('utm_campaign') || '',
    utm_content: params.get('utm_content') || '',
  }), [params]);

  const [form, setForm] = useState({
    owner_name: '', phone: '', relation: 'owner',
    locality: '', address: '',
    size_value: '', size_unit: 'sq_yds',
    road_width_ft: '', land_type: '', title_status: '',
    construction_interest: '', current_use: '', expected_rent_monthly: '', lease_years_preferred: '',
    notes: '', website: '',
  });
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => () => photos.forEach((p) => URL.revokeObjectURL(p.url)), [photos]);

  const sizeNum = parseFloat(form.size_value);
  const tooSmall = Number.isFinite(sizeNum) && sizeNum > 0 && toSqYds(sizeNum, form.size_unit) < MIN_SQ_YDS;

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    const next = Array.from(files).filter((f) => f.type.startsWith('image/')).slice(0, 6 - photos.length)
      .map((file) => ({ file, url: URL.createObjectURL(file) }));
    setPhotos((p) => [...p, ...next]);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (tooSmall) { setError(t.tooSmall); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      Object.entries(utm).forEach(([k, v]) => v && fd.append(k, v));
      fd.append('form_language', lang);
      if (lat != null && lng != null) { fd.append('lat', String(lat)); fd.append('lng', String(lng)); }
      for (const p of photos) fd.append('photos', await compressImage(p.file));

      const res = await fetch('/api/land-leads', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({ success: false }));
      if (!data.success) { setError(data.message || 'Something went wrong. Please WhatsApp us.'); return; }
      setDone(true);
      window.scrollTo({ top: document.getElementById('lead-form')?.offsetTop ?? 0, behavior: 'smooth' });
    } catch {
      setError('Network problem. Please try again or WhatsApp us.');
    } finally {
      setSaving(false);
    }
  };

  const waLink = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
    lang === 'te' ? 'నమస్తే, నా భూమిని క్విక్-కామర్స్ బ్రాండ్‌కు లీజుకు ఇవ్వడం గురించి మాట్లాడాలి.' : 'Hi, I have land and want to explore building for a quick-commerce brand.',
  )}`;

  const inputClass = 'w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 bg-white';
  const labelClass = 'text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5 block';

  return (
    <div className="flex-1 bg-stone-50">
      <Header />

      {/* Hero */}
      <section className="bg-stone-900 text-white">
        <div className="max-w-5xl mx-auto px-6 md:px-10 pt-10 pb-14">
          <div className="flex justify-end mb-6">
            <div className="inline-flex rounded-lg border border-stone-700 p-0.5 text-xs font-semibold" role="group" aria-label="Language">
              <button onClick={() => setLang('en')} className={`px-3 py-1.5 rounded-md ${lang === 'en' ? 'bg-orange-400 text-stone-900' : 'text-stone-300'}`}>English</button>
              <button onClick={() => setLang('te')} className={`px-3 py-1.5 rounded-md ${lang === 'te' ? 'bg-orange-400 text-stone-900' : 'text-stone-300'}`}>తెలుగు</button>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-orange-300 bg-orange-400/10 border border-orange-400/30 rounded-full px-3 py-1 mb-5">
            <Landmark size={13} /> {t.badge}
          </div>
          <h1 className="font-serif text-3xl md:text-5xl font-bold leading-tight max-w-3xl">
            {t.h1a}<br /><span className="text-orange-400">{t.h1b}</span>
          </h1>
          <p className="text-stone-300 mt-5 max-w-2xl text-base md:text-lg leading-relaxed">{t.sub}</p>
          <div className="flex flex-wrap gap-3 mt-8">
            <a href="#lead-form" className="inline-flex items-center px-5 py-3 rounded-lg bg-orange-400 text-stone-900 font-bold text-sm hover:bg-orange-300 transition-colors">{t.cta}</a>
            <a href={waLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-stone-600 text-white font-bold text-sm hover:border-stone-400 transition-colors">
              <Phone size={15} /> {t.wa}
            </a>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-10 max-w-xl">
            {t.stats.map(([big, small]) => (
              <div key={big} className="border border-stone-700 rounded-xl p-3">
                <div className="font-serif text-lg md:text-xl font-bold text-orange-300">{big}</div>
                <div className="text-[11px] md:text-xs text-stone-400 mt-0.5">{small}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What we handle */}
      <section className="max-w-5xl mx-auto px-6 md:px-10 py-14">
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-stone-900 mb-8">{t.whyTitle}</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {t.why.map(([title, body], i) => {
            const Icon = [Truck, HardHat, ShieldCheck, FileSignature][i];
            return (
              <div key={title} className="bg-white border border-stone-200 rounded-xl p-5 flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center flex-shrink-0"><Icon size={20} /></div>
                <div>
                  <div className="font-semibold text-stone-900">{title}</div>
                  <div className="text-sm text-stone-500 mt-1 leading-relaxed">{body}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Steps */}
      <section className="bg-white border-y border-stone-200">
        <div className="max-w-5xl mx-auto px-6 md:px-10 py-14">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-stone-900 mb-8">{t.stepsTitle}</h2>
          <ol className="grid md:grid-cols-4 gap-5">
            {t.steps.map(([title, body], i) => (
              <li key={title}>
                <div className="w-8 h-8 rounded-full bg-stone-900 text-orange-300 font-bold text-sm flex items-center justify-center mb-3">{i + 1}</div>
                <div className="font-semibold text-stone-900">{title}</div>
                <div className="text-sm text-stone-500 mt-1 leading-relaxed">{body}</div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Form */}
      <section id="lead-form" className="max-w-2xl mx-auto px-6 md:px-10 py-14 scroll-mt-16">
        {done ? (
          <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center">
            <CheckCircle2 className="mx-auto text-emerald-500 mb-4" size={48} />
            <h2 className="font-serif text-2xl font-bold text-stone-900 mb-2">{t.doneTitle}</h2>
            <p className="text-stone-500 text-sm mb-6">{t.doneBody}</p>
            <a href={waLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-orange-400 text-stone-900 font-bold text-sm">
              <Phone size={15} /> {t.wa}
            </a>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-stone-900 mb-2">{t.formTitle}</h2>
              <p className="text-stone-500 text-sm">{t.formSub}</p>
            </div>
            <form onSubmit={submit} className="bg-white border border-stone-200 rounded-2xl p-6 md:p-8 space-y-7" noValidate>
              {/* Honeypot (hidden from people) */}
              <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
                <label>Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set('website', e.target.value)} /></label>
              </div>

              <div>
                <div className="text-sm font-bold text-stone-800 mb-3">{t.you}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className={labelClass}>{t.name} *</label><input required value={form.owner_name} onChange={(e) => set('owner_name', e.target.value)} className={inputClass} autoComplete="name" /></div>
                  <div><label className={labelClass}>{t.phone} *</label><input required inputMode="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inputClass} placeholder="98xxxxxxxx" autoComplete="tel" /></div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>{t.relation}</label>
                    <div className="flex flex-wrap gap-2">
                      {([['owner', t.relOwner], ['family', t.relFamily], ['agent', t.relAgent]] as const).map(([v, l]) => (
                        <button type="button" key={v} onClick={() => set('relation', v)}
                          className={`px-3.5 py-2 rounded-lg text-sm border transition-colors ${form.relation === v ? 'bg-orange-400 border-orange-400 text-stone-900 font-semibold' : 'border-stone-200 text-stone-600'}`}>{l}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm font-bold text-stone-800 mb-3">{t.land}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className={labelClass}>{t.locality} *</label><input required value={form.locality} onChange={(e) => set('locality', e.target.value)} className={inputClass} placeholder={t.localityPh} /></div>
                  <div><label className={labelClass}>{t.address}</label><input value={form.address} onChange={(e) => set('address', e.target.value)} className={inputClass} /></div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>{t.size} *</label>
                    <div className="flex gap-2">
                      <input required inputMode="decimal" value={form.size_value} onChange={(e) => set('size_value', e.target.value)} className={inputClass} placeholder="e.g. 1000" />
                      <select value={form.size_unit} onChange={(e) => set('size_unit', e.target.value)} className={inputClass + ' max-w-[9rem]'}>
                        <option value="sq_yds">{t.unitYds}</option>
                        <option value="guntas">{t.unitGuntas}</option>
                        <option value="acres">{t.unitAcres}</option>
                      </select>
                    </div>
                    {tooSmall && <p className="text-xs text-red-600 mt-1.5">{t.tooSmall}</p>}
                  </div>
                  <div><label className={labelClass}>{t.road}</label><input inputMode="numeric" value={form.road_width_ft} onChange={(e) => set('road_width_ft', e.target.value)} className={inputClass} placeholder={t.roadPh} /></div>
                  <div>
                    <label className={labelClass}>{t.landType}</label>
                    <select value={form.land_type} onChange={(e) => set('land_type', e.target.value)} className={inputClass}>
                      <option value="">{t.choose}</option>
                      {LAND_TYPES.map((lt) => <option key={lt.value} value={lt.value}>{lt[lang]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>{t.title}</label>
                    <select value={form.title_status} onChange={(e) => set('title_status', e.target.value)} className={inputClass}>
                      <option value="">{t.choose}</option>
                      <option value="clear">{t.titleClear}</option>
                      <option value="in_progress">{t.titleProgress}</option>
                      <option value="not_sure">{t.titleUnsure}</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>{t.build}</label>
                    <div className="flex flex-wrap gap-2">
                      {([['yes', t.buildYes], ['maybe', t.buildMaybe], ['no', t.buildNo]] as const).map(([v, l]) => (
                        <button type="button" key={v} onClick={() => set('construction_interest', v)}
                          className={`px-3.5 py-2 rounded-lg text-sm border transition-colors ${form.construction_interest === v ? 'bg-orange-400 border-orange-400 text-stone-900 font-semibold' : 'border-stone-200 text-stone-600'}`}>{l}</button>
                      ))}
                    </div>
                  </div>
                  <div><label className={labelClass}>{t.use}</label><input value={form.current_use} onChange={(e) => set('current_use', e.target.value)} className={inputClass} placeholder={t.usePh} /></div>
                  <div><label className={labelClass}>{t.rent}</label><input inputMode="numeric" value={form.expected_rent_monthly} onChange={(e) => set('expected_rent_monthly', e.target.value)} className={inputClass} placeholder={t.rentPh} /></div>
                  <div>
                    <label className={labelClass}>{t.years}</label>
                    <select value={form.lease_years_preferred} onChange={(e) => set('lease_years_preferred', e.target.value)} className={inputClass}>
                      <option value="">{t.yearsAny}</option>
                      {[5, 9, 11, 15, 20].map((y) => <option key={y} value={y}>{y}+</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClass + ' flex items-center gap-1.5'}><MapPin size={13} /> {t.pin}</label>
                <LocationPicker lat={lat} lng={lng} defaultCenter={getAreaCoordinates(form.locality)} onChange={(a, b) => { setLat(a); setLng(b); }} />
              </div>

              <div>
                <label className={labelClass}>{t.photos}</label>
                <div className="flex flex-wrap gap-2">
                  {photos.map((p, i) => (
                    <div key={p.url} className="relative w-20 h-20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.url} alt="" className="w-20 h-20 object-cover rounded-lg" />
                      <button type="button" aria-label="Remove photo" onClick={() => setPhotos((ps) => ps.filter((_, j) => j !== i))}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-stone-900 text-white flex items-center justify-center"><X size={12} /></button>
                    </div>
                  ))}
                  {photos.length < 6 && (
                    <label className="w-20 h-20 rounded-lg border-2 border-dashed border-stone-300 text-stone-400 flex flex-col items-center justify-center cursor-pointer hover:border-orange-400 hover:text-orange-500 text-[10px] text-center px-1">
                      <Upload size={16} className="mb-1" />{t.addPhotos}
                      <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { addPhotos(e.target.files); e.target.value = ''; }} />
                    </label>
                  )}
                </div>
              </div>

              <div><label className={labelClass}>{t.notes}</label><textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} className={inputClass + ' h-24 resize-none'} /></div>

              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

              <button type="submit" disabled={saving} className="w-full py-3.5 rounded-lg bg-orange-400 text-stone-900 font-bold text-sm hover:bg-orange-300 disabled:opacity-60 transition-colors">
                {saving ? t.submitting : t.submit}
              </button>
              <p className="text-[11px] text-stone-400 text-center">{t.privacy}</p>
            </form>
          </>
        )}
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 md:px-10 pb-16">
        <h2 className="font-serif text-2xl font-bold text-stone-900 mb-5">{t.faqTitle}</h2>
        <div className="space-y-2">
          {t.faq.map(([q, a]) => (
            <details key={q} className="bg-white border border-stone-200 rounded-xl px-5 py-4 group">
              <summary className="font-semibold text-stone-800 cursor-pointer list-none flex justify-between gap-4">
                {q}<span className="text-orange-400 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="text-sm text-stone-500 mt-2 leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
