'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';

interface AreaStat {
  area: string;
  listingCount: number;
  saleCount: number;
  rentCount: number;
  avgPrice: number | null;
  avgPricePerSqft: number | null;
  hasRealPriceData: boolean;
  estimatedGrowthPct: number | null;
  estimatedRentalYield: number | null;
}

interface MarketData {
  areaStats: AreaStat[];
}

interface PropertyTypeCount {
  type: string;
  count: number;
}

interface NewsArticle {
  title: string;
  link: string;
  source: string;
  publishedAt: string;
  description: string | null;
  imageUrl: string | null;
}

const ALL_AREAS = [
  'Gachibowli', 'Madhapur', 'Banjara Hills', 'Jubilee Hills', 'Kondapur',
  'Hitech City', 'Kompally', 'Yapral', 'Alwal', 'Kukatpally', 'Miyapur', 'Dammaiguda',
];

function fmtINR(num: number) {
  if (num >= 10000000) return '₹' + (num / 10000000).toFixed(2) + ' Cr';
  if (num >= 100000) return '₹' + (num / 100000).toFixed(1) + ' L';
  return '₹' + Math.round(num).toLocaleString('en-IN');
}

function computeDemandScore(stat: AreaStat | undefined, maxListings: number): number {
  if (!stat || maxListings === 0) return 0;
  const volumeScore = (stat.listingCount / maxListings) * 60;
  const activityScore = stat.listingCount > 0 ? Math.min(40, (stat.saleCount + stat.rentCount * 1.2) * 4) : 0;
  return Math.round(Math.min(100, volumeScore + activityScore));
}

function growthRatingLabel(growth: number | null): { label: string; color: string } {
  if (growth === null) return { label: 'Not yet rated', color: 'text-stone-400' };
  if (growth >= 12) return { label: 'High Growth', color: 'text-emerald-600' };
  if (growth >= 8) return { label: 'Moderate Growth', color: 'text-orange-600' };
  return { label: 'Stable', color: 'text-blue-600' };
}

export default function AreaInsightsPage() {
  const [data, setData] = useState<MarketData | null>(null);
  const [selectedArea, setSelectedArea] = useState('Yapral');
  const [propertyTypes, setPropertyTypes] = useState<PropertyTypeCount[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/market-research')
      .then((r) => r.json())
      .then((d) => { if (d.success) setData(d); })
      .finally(() => setLoading(false));

    fetch('/api/properties')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const byType: Record<string, number> = {};
          d.properties.forEach((p: any) => {
            if (p.area === selectedArea) {
              byType[p.property_type] = (byType[p.property_type] || 0) + 1;
            }
          });
          setPropertyTypes(Object.entries(byType).map(([type, count]) => ({ type, count })));
        }
      });

    setNewsLoading(true);
    setNewsError('');
    fetch('/api/area-news?area=' + encodeURIComponent(selectedArea))
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setNews(d.articles);
        } else {
          setNewsError(d.message || 'Could not load news right now.');
          setNews([]);
        }
      })
      .catch(() => setNewsError('Could not load news right now.'))
      .finally(() => setNewsLoading(false));
  }, [selectedArea]);

  const stat = data?.areaStats.find((a) => a.area === selectedArea);
  const maxListings = data ? Math.max(1, ...data.areaStats.map((a) => a.listingCount)) : 1;
  const demandScore = computeDemandScore(stat, maxListings);
  const growthRating = growthRatingLabel(stat?.estimatedGrowthPct ?? null);
  const bestType = propertyTypes.sort((a, b) => b.count - a.count)[0];

  const typeLabels: Record<string, string> = {
    apartment: 'Apartment / Flat', villa: 'Villa / Independent House', plot: 'Plot / Land', commercial: 'Commercial',
  };

  return (
    <div className="flex-1 bg-stone-50">
      <Header />
      <div className="max-w-3xl mx-auto px-6 md:px-10 py-8">
        <h1 className="font-serif text-3xl font-bold mb-1">Area Insights Tool</h1>
        <p className="text-stone-500 text-sm mb-6">Select an area to see a snapshot of price, demand, and growth.</p>

        <div className="flex flex-wrap gap-2 mb-8">
          {ALL_AREAS.map((area) => {
            const isSelected = selectedArea === area;
            const btnClass = isSelected
              ? 'px-4 py-2 rounded-full text-sm font-medium border transition-colors bg-orange-600 text-white border-orange-600'
              : 'px-4 py-2 rounded-full text-sm font-medium border transition-colors bg-white text-stone-600 border-stone-200 hover:border-orange-300';
            return (
              <button key={area} onClick={() => setSelectedArea(area)} className={btnClass}>
                {area}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="text-center text-stone-400 py-10">Loading...</div>
        ) : (
          <div>
            <div className="bg-gradient-to-br from-stone-900 to-orange-950 rounded-2xl p-6 mb-6 text-white">
              <div className="text-xs uppercase tracking-wide text-orange-300 mb-1">Selected Area</div>
              <h2 className="font-serif text-2xl font-bold">{selectedArea}</h2>
              <div className="text-sm text-stone-300 mt-1">
                {stat?.listingCount || 0} live listings on nomore2percent
                {stat ? ' (' + stat.saleCount + ' for sale, ' + stat.rentCount + ' for rent)' : ''}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <InsightCard
                label="Avg Price / sqft"
                value={stat?.avgPricePerSqft ? '₹' + stat.avgPricePerSqft.toLocaleString('en-IN') : 'No data yet'}
                tag={stat?.hasRealPriceData ? 'Live' : null}
                sub={stat?.avgPrice ? 'Avg property price: ' + fmtINR(stat.avgPrice) : 'Add listings here to populate this'}
              />

              <InsightCard
                label="Rental Yield"
                value={stat?.estimatedRentalYield !== null && stat?.estimatedRentalYield !== undefined ? stat.estimatedRentalYield + '%' : 'Not yet estimated'}
                tag={stat?.estimatedRentalYield !== null ? 'Estimated' : null}
                sub="Researched estimate, not a live calculation"
              />

              <InsightCard
                label="Demand Score"
                value={demandScore + ' / 100'}
                tag="Live"
                sub="Based on listing volume and activity on nomore2percent"
              >
                <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: demandScore + '%' }} />
                </div>
              </InsightCard>

              <InsightCard
                label="Future Growth Rating"
                value={growthRating.label}
                valueColor={growthRating.color}
                tag={stat?.estimatedGrowthPct !== null ? 'Estimated' : null}
                sub={stat?.estimatedGrowthPct !== null ? stat?.estimatedGrowthPct + '% est. YoY growth' : 'Researched estimate not yet entered for this area'}
              />
            </div>

            <div className="bg-white border border-stone-200 rounded-xl p-5 mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-stone-700">Best Property Type Here</div>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Live</span>
              </div>
              {bestType ? (
                <div>
                  <div className="font-serif text-xl font-bold text-stone-900">{typeLabels[bestType.type] || bestType.type}</div>
                  <div className="text-xs text-stone-500 mt-1">Most commonly listed type in {selectedArea} ({bestType.count} listings)</div>
                </div>
              ) : (
                <div className="text-sm text-stone-400">No listings yet in this area to determine a pattern.</div>
              )}
            </div>

            <div className="bg-white border border-stone-200 rounded-xl p-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold text-stone-700">Infrastructure and Project News</div>
                <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">Live News Search</span>
              </div>
              <p className="text-[11px] text-stone-400 mb-3">
                Real news headlines mentioning {selectedArea} and infrastructure or development. Not verified project status.
                Always confirm specifics directly with official sources before relying on this for decisions.
              </p>

              {newsLoading && <div className="text-xs text-stone-400 py-6 text-center">Searching for news...</div>}

              {!newsLoading && newsError && (
                <div className="text-xs text-stone-400 py-6 text-center">{newsError}</div>
              )}

              {!newsLoading && !newsError && news.length === 0 && (
                <div className="text-xs text-stone-400 py-6 text-center">No recent news found mentioning {selectedArea} infrastructure or development.</div>
              )}

              {!newsLoading && news.length > 0 && (
                <div className="space-y-3">
                  {news.map(function (article, i) {
                    return (
                      <a key={i} href={article.link} target="_blank" rel="noopener noreferrer" className="block border border-stone-100 rounded-lg p-3 hover:border-orange-300 hover:bg-orange-50/30 transition-colors">
                        <div className="text-sm font-medium text-stone-800 mb-1">{article.title}</div>
                        <div className="flex items-center gap-2 text-[11px] text-stone-400">
                          <span>{article.source}</span>
                          {article.publishedAt && (
                            <span>{new Date(article.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          )}
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 text-center">
              <div className="text-sm text-stone-700 mb-3">Interested in {selectedArea}? Get personalized recommendations from Sumanth.</div>
              <a
                href={'https://wa.me/917013224895?text=Hi+Sumanth%2C+I%27m+interested+in+properties+in+' + encodeURIComponent(selectedArea) + '.+Can+you+share+some+options%3F'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-orange-600 text-white rounded-lg px-5 py-2.5 text-sm font-bold hover:bg-orange-700 transition-colors"
              >
                WhatsApp About {selectedArea}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InsightCard(props: {
  label: string; value: string; valueColor?: string; tag?: string | null; sub: string; children?: React.ReactNode;
}) {
  const tagClass = props.tag === 'Live'
    ? 'text-[10px] font-semibold px-2 py-0.5 rounded-full border text-emerald-700 bg-emerald-50 border-emerald-200'
    : 'text-[10px] font-semibold px-2 py-0.5 rounded-full border text-orange-700 bg-orange-50 border-orange-200';

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs uppercase tracking-wide text-stone-400">{props.label}</div>
        {props.tag && <span className={tagClass}>{props.tag}</span>}
      </div>
      <div className={'font-serif text-xl font-bold ' + (props.valueColor || 'text-stone-900')}>{props.value}</div>
      <div className="text-xs text-stone-500 mt-1">{props.sub}</div>
      {props.children}
    </div>
  );
}
