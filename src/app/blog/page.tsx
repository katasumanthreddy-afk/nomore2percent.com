import Link from 'next/link';
import Header from '@/components/Header';

const POSTS = [
  {
    slug: 'why-hyderabad-buyers-deserve-better-than-2-percent',
    title: "Why Hyderabad's Home Buyers Deserve Better Than 2%",
    excerpt: 'Every year, thousands of families in Hyderabad pay a quiet 2% tax to brokers for work they could do themselves. We built nomore2percent to change that.',
    date: '30 May 2026',
    readTime: '8 min read',
    category: 'Platform Launch',
  },
];

export default function BlogPage() {
  return (
    <div className="flex-1 bg-stone-50">
      <Header />
      <div className="max-w-3xl mx-auto px-6 md:px-10 py-12">
        <div className="mb-10">
          <h1 className="font-serif text-3xl font-bold mb-2">nomore2percent Blog</h1>
          <p className="text-stone-500 text-sm">Insights on Hyderabad real estate, market trends, and smarter home buying.</p>
        </div>

        <div className="space-y-6">
          {POSTS.map((post) => (
            <Link key={post.slug} href={'/blog/' + post.slug} className="block bg-white border border-stone-200 rounded-2xl p-6 hover:border-orange-400 hover:-translate-y-0.5 transition-all shadow-sm hover:shadow-md">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full">{post.category}</span>
              </div>
              <h2 className="font-serif text-xl font-bold text-stone-900 mb-2">{post.title}</h2>
              <p className="text-stone-500 text-sm leading-relaxed mb-4">{post.excerpt}</p>
              <div className="flex items-center gap-3 text-xs text-stone-400">
                <span>By <strong className="text-stone-600">Sumanth</strong></span>
                <span>·</span>
                <span>{post.date}</span>
                <span>·</span>
                <span>{post.readTime}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
