import { useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ArrowLeft, ArrowRight, Bike, Camera, Check, Clock3, CreditCard, Heart, Laptop, LayoutGrid, MapPin, Menu, Package, Plus, Projector, Search, ShieldCheck, SlidersHorizontal, Sparkles, Tag, Trash2, Undo2, Video, X, Zap } from 'lucide-react';
import { Link, Route, Switch, useLocation, useParams, Router as WouterRouter } from 'wouter';
import NotFound from '@/pages/not-found';

type Category = 'Laptops' | 'Cameras' | 'Gaming' | 'Projectors' | 'Bikes';
type Product = {
  id: string; name: string; category: Category; description: string; image: string;
  owner: string; ownerInitials: string; condition: string; location: string;
  dailyPrice: number; available: boolean; isOwnedByCurrentUser: boolean;
};
type Rental = {
  id: string; productId: string; productName: string; productImage: string;
  startDate: string; returnDate: string; totalPrice: number; status: 'active' | 'returned'; owner: string;
};

const seedProducts: Product[] = [
  { id: 'p1', name: 'ThinkPad X1 Carbon', category: 'Laptops', description: 'A fast, dependable laptop for late-night builds, studio work, and everything in between. Includes charger and a padded sleeve.', image: '/laptop.png', owner: 'Nisha Kapoor', ownerInitials: 'NK', condition: 'Like new', location: 'Maple Hall', dailyPrice: 280, available: true, isOwnedByCurrentUser: false },
  { id: 'p2', name: 'Fujifilm X-T30 II', category: 'Cameras', description: 'Compact mirrorless camera with a 23mm prime lens. Great for portraits, campus events, and film-like street shots.', image: '/camera.png', owner: 'Dev Patel', ownerInitials: 'DP', condition: 'Excellent', location: 'North Quad', dailyPrice: 350, available: true, isOwnedByCurrentUser: false },
  { id: 'p3', name: 'Anker Nebula Capsule', category: 'Projectors', description: 'Pocket cinema for movie nights and presentations. HDMI and USB-C ready, with a bright built-in speaker.', image: '/projector.png', owner: 'Arjun Mehta', ownerInitials: 'AM', condition: 'Good', location: 'Oak House', dailyPrice: 190, available: true, isOwnedByCurrentUser: true },
  { id: 'p4', name: 'Nintendo Switch OLED', category: 'Gaming', description: 'OLED console with two Joy-Con controllers and dock. Borrow it for a weekend tournament or a quiet reset.', image: '/console.png', owner: 'Maya Chen', ownerInitials: 'MC', condition: 'Like new', location: 'Lakeside Dorms', dailyPrice: 240, available: true, isOwnedByCurrentUser: false },
  { id: 'p5', name: 'City Commuter Bike', category: 'Bikes', description: 'A smooth seven-speed commuter with a lock, front basket, and lights. The easiest way to cross campus before class.', image: '/bicycle.png', owner: 'Arjun Mehta', ownerInitials: 'AM', condition: 'Very good', location: 'Oak House', dailyPrice: 160, available: true, isOwnedByCurrentUser: true },
  { id: 'p6', name: 'Dell XPS 15', category: 'Laptops', description: 'Large display and plenty of headroom for 3D work, data projects, or editing a short film.', image: '/laptop.png', owner: 'Ishaan Rao', ownerInitials: 'IR', condition: 'Good', location: 'West Village', dailyPrice: 320, available: false, isOwnedByCurrentUser: false },
  { id: 'p7', name: 'GoPro Hero 11', category: 'Cameras', description: 'Waterproof action camera with two batteries and chest mount. Ready for weekend trips beyond the quad.', image: '/camera.png', owner: 'Leah Morgan', ownerInitials: 'LM', condition: 'Excellent', location: 'Maple Hall', dailyPrice: 220, available: true, isOwnedByCurrentUser: false },
];

const seedRentals: Rental[] = [
  { id: 'r1', productId: 'p2', productName: 'Fujifilm X-T30 II', productImage: '/camera.png', startDate: '2025-03-14', returnDate: '2025-03-16', totalPrice: 700, status: 'active', owner: 'Dev Patel' },
  { id: 'r2', productId: 'p4', productName: 'Nintendo Switch OLED', productImage: '/console.png', startDate: '2025-02-21', returnDate: '2025-02-23', totalPrice: 480, status: 'returned', owner: 'Maya Chen' },
];

const categories: { name: Category; icon: typeof Laptop; tint: string }[] = [
  { name: 'Laptops', icon: Laptop, tint: 'bg-[#e7efe9]' },
  { name: 'Cameras', icon: Camera, tint: 'bg-[#f5e1d9]' },
  { name: 'Gaming', icon: Video, tint: 'bg-[#e5e7f3]' },
  { name: 'Projectors', icon: Projector, tint: 'bg-[#f7edc9]' },
  { name: 'Bikes', icon: Bike, tint: 'bg-[#dcecea]' },
];

const money = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const prettyDate = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const dateInput = (offset: number) => { const d = new Date(); d.setDate(d.getDate() + offset); return d.toISOString().slice(0, 10); };

function useLocalState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => {
    try { const saved = localStorage.getItem(key); return saved ? JSON.parse(saved) : fallback; } catch { return fallback; }
  });
  useEffect(() => { localStorage.setItem(key, JSON.stringify(value)); }, [key, value]);
  return [value, setValue] as const;
}

function Avatar({ initials, compact = false }: { initials: string; compact?: boolean }) {
  return <span className={`inline-flex shrink-0 items-center justify-center rounded-full bg-[#d7e9de] text-[#155c45] font-bold ${compact ? 'size-8 text-[11px]' : 'size-10 text-xs'}`} data-testid={`avatar-${initials}`}>{initials}</span>;
}

function Brand() {
  return <Link href="/" className="flex items-center gap-3" data-testid="link-brand"><span className="relative flex size-9 items-center justify-center rounded-[11px] bg-[#155c45] text-[#f7edc9] shadow-[3px_3px_0_#ef8d70]"><Zap size={18} fill="currentColor" strokeWidth={2.5} /></span><span className="font-display text-[21px] font-800 tracking-[-.05em] text-[#173d32]">rentchain</span></Link>;
}

function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = [
    { href: '/', label: 'Discover', icon: LayoutGrid },
    { href: '/rentals', label: 'My rentals', icon: Clock3 },
    { href: '/products', label: 'My products', icon: Package },
  ];
  const isActive = (href: string) => href === '/' ? location === '/' : location.startsWith(href);
  return <div className="noise min-h-[100dvh] bg-[#f5f2e9]">
    <header className="sticky top-0 z-30 border-b border-[#e5dfd0] bg-[#f5f2e9]/95 backdrop-blur-md">
      <div className="mx-auto flex h-[76px] max-w-[1320px] items-center justify-between px-5 sm:px-8">
        <Brand />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`group flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-bold transition ${isActive(href) ? 'bg-[#dfece3] text-[#155c45]' : 'text-[#69736b] hover:bg-[#ece8dc] hover:text-[#173d32]'}`} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}><Icon size={16} strokeWidth={2.2} />{label}</Link>)}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/products" className="hidden items-center gap-2 rounded-full border border-[#d8d5c9] bg-[#faf8f1] px-4 py-2.5 text-[12px] font-bold text-[#155c45] transition hover:-translate-y-0.5 hover:border-[#155c45] sm:flex" data-testid="link-list-item"><Plus size={15} />List an item</Link>
          <button className="rounded-full p-2 text-[#5b6860] hover:bg-[#ece8dc] md:hidden" onClick={() => setMobileOpen((v) => !v)} aria-label="Toggle menu" data-testid="button-toggle-menu">{mobileOpen ? <X size={20} /> : <Menu size={20} />}</button>
          <Avatar initials="AM" compact />
        </div>
      </div>
      {mobileOpen && <nav className="border-t border-[#e5dfd0] bg-[#f5f2e9] px-5 py-3 md:hidden" aria-label="Mobile navigation">{nav.map(({ href, label, icon: Icon }) => <Link onClick={() => setMobileOpen(false)} key={href} href={href} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold ${isActive(href) ? 'bg-[#dfece3] text-[#155c45]' : 'text-[#69736b]'}`} data-testid={`mobile-nav-${label.toLowerCase().replaceAll(' ', '-')}`}><Icon size={17} />{label}</Link>)}</nav>}
    </header>
    <main>{children}</main>
    <footer className="mx-auto mt-20 flex max-w-[1320px] flex-col gap-3 border-t border-[#e5dfd0] px-5 py-8 text-xs text-[#879088] sm:flex-row sm:items-center sm:justify-between sm:px-8"><span className="font-display font-bold text-[#5c7165]">rentchain / your campus, shared.</span><span>Made for good borrowing.</span></footer>
  </div>;
}

function ProductCard({ product }: { product: Product }) {
  const category = categories.find((c) => c.name === product.category);
  return <Link href={`/product/${product.id}`} className="group block" data-testid={`card-product-${product.id}`}>
    <article className="overflow-hidden rounded-[22px] border border-[#e5dfd0] bg-[#faf8f1] transition duration-300 hover:-translate-y-1 hover:border-[#c6d6ca] hover:shadow-[0_14px_35px_rgba(42,66,53,.1)]">
      <div className="relative aspect-[1.18] overflow-hidden bg-[#e9e4d6]">
        <img src={product.image} alt={product.name} className="size-full object-cover transition duration-500 group-hover:scale-[1.045]" />
        <span className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.1em] ${product.available ? 'bg-[#f7edc9] text-[#775b11]' : 'bg-[#f1d5cf] text-[#994d40]'}`} data-testid={`status-availability-${product.id}`}>{product.available ? 'Available' : 'On loan'}</span>
        <button onClick={(e) => e.preventDefault()} aria-label={`Save ${product.name}`} className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-[#faf8f1]/90 text-[#627168] opacity-0 transition group-hover:opacity-100 hover:text-[#d36e57]" data-testid={`button-save-${product.id}`}><Heart size={16} /></button>
      </div>
      <div className="p-5">
        <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.12em] text-[#839087]"><span className={`flex size-6 items-center justify-center rounded-md ${category?.tint} text-[#155c45]`}>{category && <category.icon size={13} />}</span>{product.category}</div>
        <div className="flex items-start justify-between gap-3"><h3 className="font-display text-[18px] font-bold leading-tight tracking-[-.03em] text-[#173d32]">{product.name}</h3><span className="shrink-0 font-mono-ui text-[12px] font-medium text-[#155c45]">{money(product.dailyPrice)}<span className="text-[#879088]">/day</span></span></div>
        <div className="mt-4 flex items-center justify-between text-xs text-[#768279]"><span className="flex items-center gap-1.5"><MapPin size={13} />{product.location}</span><span className="flex items-center gap-1.5"><Avatar initials={product.ownerInitials} compact />{product.owner === 'Arjun Mehta' ? 'You' : product.owner.split(' ')[0]}</span></div>
      </div>
    </article>
  </Link>;
}

function Home({ products }: { products: Product[] }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Category | 'All'>('All');
  const [showFilters, setShowFilters] = useState(false);
  const filtered = useMemo(() => products.filter((p) => p.available && (filter === 'All' || p.category === filter) && [p.name, p.category, p.location, p.owner].join(' ').toLowerCase().includes(query.toLowerCase())), [products, filter, query]);
  return <div>
    <section className="surface-grid relative overflow-hidden border-b border-[#e5dfd0]">
      <div className="mx-auto max-w-[1320px] px-5 pb-14 pt-14 sm:px-8 sm:pb-20 sm:pt-20">
        <div className="grid items-end gap-12 lg:grid-cols-[1fr_390px]">
          <div className="max-w-[730px] animate-rise">
            <div className="mb-5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.18em] text-[#d36e57]"><span className="size-2 rounded-full bg-[#d36e57]" />the campus lending shelf</div>
            <h1 className="font-display text-[clamp(46px,7vw,88px)] font-bold leading-[.93] tracking-[-.075em] text-[#173d32]">Good stuff,<br /><span className="text-[#d36e57]">close by.</span></h1>
            <p className="mt-7 max-w-[520px] text-[16px] leading-7 text-[#68766d]">Borrow what you need from people who get it. No shipping, no strangers — just useful things moving around campus.</p>
          </div>
          <div className="relative hidden min-h-[230px] animate-float rounded-[28px] border border-[#b8d0c2] bg-[#dfece3] p-7 lg:block">
            <div className="absolute -right-4 -top-5 flex size-20 items-center justify-center rounded-full bg-[#ef8d70] text-[#173d32] shadow-[4px_5px_0_#155c45]"><Sparkles size={27} /></div>
            <div className="absolute bottom-7 left-7 right-7"><div className="font-display text-[30px] font-bold leading-none tracking-[-.06em] text-[#155c45]">The best<br />things are<br /><span className="text-[#d36e57]">already here.</span></div><div className="mt-4 font-mono-ui text-[10px] uppercase tracking-[.18em] text-[#668373]">Oak House / 2025</div></div>
          </div>
        </div>
        <div className="relative z-10 mt-12 flex max-w-[760px] items-center rounded-[17px] border border-[#cbdacf] bg-[#faf8f1] p-2 shadow-[0_10px_30px_rgba(42,66,53,.08)]">
          <Search className="ml-3 shrink-0 text-[#779087]" size={21} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} type="search" placeholder="Search laptops, cameras, North Quad..." className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-[#173d32] outline-none placeholder:text-[#9da79f]" aria-label="Search products" data-testid="input-search-products" />
          <button onClick={() => setShowFilters((v) => !v)} className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-3 text-xs font-bold transition ${showFilters ? 'bg-[#dfece3] text-[#155c45]' : 'text-[#6e7d73] hover:bg-[#ece8dc]'}`} aria-label="Toggle filters" data-testid="button-toggle-filters"><SlidersHorizontal size={16} /><span className="hidden sm:inline">Filters</span></button>
        </div>
        {showFilters && <div className="mt-3 flex max-w-[760px] flex-wrap gap-2 animate-rise">{['All', ...categories.map((c) => c.name)].map((item) => <button key={item} onClick={() => setFilter(item as Category | 'All')} className={`rounded-full border px-4 py-2 text-xs font-bold transition ${filter === item ? 'border-[#155c45] bg-[#155c45] text-[#f5f2e9]' : 'border-[#d8d5c9] bg-[#faf8f1] text-[#6e7d73] hover:border-[#9db7a7]'}`} data-testid={`filter-${item.toString().toLowerCase()}`}>{item}</button>)}</div>}
      </div>
    </section>
    <section className="mx-auto max-w-[1320px] px-5 py-12 sm:px-8 sm:py-16">
      <div className="mb-8 flex items-end justify-between"><div><p className="mb-2 text-[11px] font-bold uppercase tracking-[.18em] text-[#d36e57]">Browse the shelf</p><h2 className="font-display text-[30px] font-bold tracking-[-.05em] text-[#173d32]">Available around you</h2></div><span className="font-mono-ui text-[11px] text-[#879088]">{filtered.length.toString().padStart(2, '0')} items</span></div>
      {filtered.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filtered.map((product, index) => <div key={product.id} className="animate-rise" style={{ animationDelay: `${index * 55}ms` }}><ProductCard product={product} /></div>)}</div> : <EmptyState title="Nothing on this shelf yet" body="Try a different search or clear the category filter." action="Clear filters" onAction={() => { setFilter('All'); setQuery(''); }} />}
    </section>
    <section className="mx-auto max-w-[1320px] px-5 pb-8 sm:px-8"><div className="grid gap-4 rounded-[26px] bg-[#155c45] p-6 text-[#f5f2e9] sm:grid-cols-[1fr_auto] sm:items-center sm:p-9"><div><div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#f3b18e]"><ShieldCheck size={14} /> Built on trust</div><h3 className="font-display text-2xl font-bold tracking-[-.04em]">Your neighbours are your network.</h3><p className="mt-2 max-w-[560px] text-sm leading-6 text-[#c7ddd0]">Every listing shows a real first name, a campus location, and a clear condition so borrowing feels as easy as asking a friend.</p></div><Link href="/products" className="flex items-center justify-center gap-2 rounded-xl bg-[#f3b18e] px-5 py-3 text-sm font-bold text-[#173d32] transition hover:-translate-y-0.5" data-testid="link-share-item">Share something <ArrowRight size={16} /></Link></div></section>
  </div>;
}

function EmptyState({ title, body, action, onAction }: { title: string; body: string; action?: string; onAction?: () => void }) {
  return <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[22px] border border-dashed border-[#cbdacf] bg-[#f1eee5] px-6 text-center"><div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-[#dfece3] text-[#155c45]"><Package size={22} /></div><h3 className="font-display text-xl font-bold tracking-[-.04em] text-[#173d32]">{title}</h3><p className="mt-2 max-w-sm text-sm leading-6 text-[#79857d]">{body}</p>{action && onAction && <button onClick={onAction} className="mt-5 rounded-xl bg-[#155c45] px-4 py-2.5 text-xs font-bold text-[#f5f2e9] transition hover:bg-[#1c7258]" data-testid="button-empty-action">{action}</button>}</div>;
}

function Detail({ products }: { products: Product[] }) {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const product = products.find((p) => p.id === id);
  if (!product) return <NotFound />;
  return <div className="mx-auto max-w-[1180px] px-5 py-8 sm:px-8 sm:py-12"><button onClick={() => window.history.back()} className="mb-8 flex items-center gap-2 text-xs font-bold text-[#768279] transition hover:text-[#155c45]" data-testid="button-back-detail"><ArrowLeft size={15} />Back to discover</button><div className="grid gap-8 lg:grid-cols-[1.15fr_.85fr] lg:gap-14"><div className="overflow-hidden rounded-[28px] bg-[#e9e4d6]"><img src={product.image} alt={product.name} className="aspect-square size-full object-cover" /></div><div className="flex flex-col justify-center"><div className="mb-5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.16em] text-[#d36e57]"><Tag size={14} />{product.category}</div><h1 className="font-display text-[clamp(38px,5vw,64px)] font-bold leading-[.95] tracking-[-.07em] text-[#173d32]">{product.name}</h1><div className="mt-7 flex flex-wrap gap-2"><span className="rounded-full bg-[#dfece3] px-3 py-1.5 text-xs font-bold text-[#155c45]">{product.condition}</span><span className={`rounded-full px-3 py-1.5 text-xs font-bold ${product.available ? 'bg-[#f7edc9] text-[#775b11]' : 'bg-[#f1d5cf] text-[#994d40]'}`}>{product.available ? 'Available now' : 'Currently on loan'}</span></div><p className="mt-7 text-[15px] leading-7 text-[#69766d]">{product.description}</p><div className="my-8 grid grid-cols-2 gap-4 border-y border-[#e5dfd0] py-5"><div><p className="mb-1 text-[10px] font-bold uppercase tracking-[.14em] text-[#9ba49d]">Daily rate</p><p className="font-mono-ui text-xl font-medium text-[#155c45]">{money(product.dailyPrice)}<span className="text-xs text-[#879088]"> / day</span></p></div><div><p className="mb-1 text-[10px] font-bold uppercase tracking-[.14em] text-[#9ba49d]">Pick-up</p><p className="flex items-center gap-1.5 text-sm font-bold text-[#344f43]"><MapPin size={14} />{product.location}</p></div></div><div className="mb-7 flex items-center gap-3"><Avatar initials={product.ownerInitials} /><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#9ba49d]">Listed by</p><p className="text-sm font-bold text-[#344f43]">{product.owner}{product.isOwnedByCurrentUser && <span className="ml-2 rounded-full bg-[#f7edc9] px-2 py-1 text-[10px] text-[#775b11]">You</span>}</p></div></div>{product.isOwnedByCurrentUser ? <Link href="/products" className="flex items-center justify-center gap-2 rounded-xl border border-[#cbdacf] bg-[#edf3ee] py-3.5 text-sm font-bold text-[#155c45] transition hover:border-[#155c45]" data-testid="link-manage-product">Manage your listing <ArrowRight size={16} /></Link> : <button disabled={!product.available} onClick={() => setLocation(`/rent/${product.id}`)} className="flex items-center justify-center gap-2 rounded-xl bg-[#155c45] py-3.5 text-sm font-bold text-[#f5f2e9] transition hover:-translate-y-0.5 hover:bg-[#1c7258] disabled:cursor-not-allowed disabled:bg-[#bdc8c0]" data-testid="button-rent-now">{product.available ? <>Rent this for a bit <ArrowRight size={16} /></> : 'Currently unavailable'}</button>}</div></div></div>;
}

function Checkout({ products, setRentals, setProducts }: { products: Product[]; setRentals: React.Dispatch<React.SetStateAction<Rental[]>>; setProducts: React.Dispatch<React.SetStateAction<Product[]>> }) {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const product = products.find((p) => p.id === id);
  const [days, setDays] = useState(2);
  const [confirmed, setConfirmed] = useState(false);
  const [start] = useState(dateInput(1));
  if (!product) return <NotFound />;
  const returnDate = dateInput(days + 0);
  const total = product.dailyPrice * days;
  const confirm = () => {
    const rental: Rental = { id: `r${Date.now()}`, productId: product.id, productName: product.name, productImage: product.image, startDate: start, returnDate, totalPrice: total, status: 'active', owner: product.owner };
    setRentals((current) => [rental, ...current]);
    setProducts((current) => current.map((item) => item.id === product.id ? { ...item, available: false } : item));
    setConfirmed(true);
  };
  if (confirmed) return <div className="mx-auto max-w-[720px] px-5 py-14 text-center sm:py-20"><div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-[#dfece3] text-[#155c45]"><Check size={34} strokeWidth={2.5} /></div><p className="mb-3 text-[11px] font-bold uppercase tracking-[.18em] text-[#d36e57]">It’s yours for a bit</p><h1 className="font-display text-[clamp(38px,6vw,62px)] font-bold leading-none tracking-[-.07em] text-[#173d32]">Rental confirmed.</h1><p className="mx-auto mt-5 max-w-md text-sm leading-7 text-[#718077]">Pick up <strong className="text-[#344f43]">{product.name}</strong> from {product.location} on {prettyDate(start)}. Your return date is {prettyDate(returnDate)}.</p><div className="mx-auto mt-9 max-w-md rounded-2xl border border-[#cbdacf] bg-[#edf3ee] p-5 text-left"><div className="flex items-center gap-3"><img src={product.image} alt="" className="size-16 rounded-xl object-cover" /><div><p className="font-bold text-[#173d32]">{product.name}</p><p className="mt-1 font-mono-ui text-xs text-[#155c45]">{money(total)} total · {days} days</p></div></div></div><Link href="/rentals" className="mx-auto mt-8 flex w-fit items-center gap-2 rounded-xl bg-[#155c45] px-5 py-3 text-sm font-bold text-[#f5f2e9] transition hover:bg-[#1c7258]" data-testid="link-view-rentals">View my rentals <ArrowRight size={16} /></Link></div>;
  return <div className="mx-auto max-w-[1080px] px-5 py-8 sm:px-8 sm:py-12"><button onClick={() => window.history.back()} className="mb-8 flex items-center gap-2 text-xs font-bold text-[#768279] hover:text-[#155c45]" data-testid="button-back-checkout"><ArrowLeft size={15} />Back to product</button><div className="grid gap-8 lg:grid-cols-[1fr_390px]"><div><p className="mb-3 text-[11px] font-bold uppercase tracking-[.18em] text-[#d36e57]">Borrow something useful</p><h1 className="font-display text-[clamp(38px,5vw,62px)] font-bold leading-[.94] tracking-[-.07em] text-[#173d32]">Make it yours<br /><span className="text-[#d36e57]">for a bit.</span></h1><div className="mt-9 flex gap-4 rounded-[22px] border border-[#e5dfd0] bg-[#faf8f1] p-4"><img src={product.image} alt={product.name} className="size-24 rounded-2xl object-cover sm:size-32" /><div className="py-1"><p className="text-[11px] font-bold uppercase tracking-[.14em] text-[#879088]">{product.category}</p><h2 className="mt-1 font-display text-xl font-bold tracking-[-.04em] text-[#173d32]">{product.name}</h2><p className="mt-2 flex items-center gap-1.5 text-xs text-[#718077]"><MapPin size={13} />{product.location}</p></div></div></div><div className="rounded-[24px] border border-[#d8d5c9] bg-[#faf8f1] p-6 shadow-[0_12px_30px_rgba(42,66,53,.06)]"><div className="mb-6 flex items-center justify-between"><h2 className="font-display text-xl font-bold tracking-[-.04em] text-[#173d32]">Your dates</h2><span className="font-mono-ui text-xs text-[#879088]">{money(product.dailyPrice)} / day</span></div><div className="mb-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-[#f1eee5] p-3"><p className="mb-1 text-[10px] font-bold uppercase tracking-[.1em] text-[#9ba49d]">Pick up</p><p className="text-sm font-bold text-[#344f43]">{prettyDate(start)}</p></div><div className="rounded-xl bg-[#f1eee5] p-3"><p className="mb-1 text-[10px] font-bold uppercase tracking-[.1em] text-[#9ba49d]">Return</p><p className="text-sm font-bold text-[#344f43]">{prettyDate(returnDate)}</p></div></div><label htmlFor="rental-days" className="mb-2 block text-xs font-bold text-[#57685d]">How many days?</label><div className="mb-7 flex items-center gap-2">{[1, 2, 3, 5, 7].map((option) => <button key={option} onClick={() => setDays(option)} className={`flex-1 rounded-xl border py-3 text-sm font-bold transition ${days === option ? 'border-[#155c45] bg-[#155c45] text-[#f5f2e9]' : 'border-[#e5dfd0] bg-[#f1eee5] text-[#68766d] hover:border-[#9db7a7]'}`} data-testid={`button-days-${option}`}>{option}</button>)}</div><div className="mb-6 flex items-center justify-between border-t border-[#e5dfd0] pt-5"><span className="text-sm text-[#718077]">Total for {days} {days === 1 ? 'day' : 'days'}</span><span className="font-mono-ui text-2xl font-medium text-[#155c45]" data-testid="text-rental-total">{money(total)}</span></div><button onClick={confirm} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#155c45] py-3.5 text-sm font-bold text-[#f5f2e9] transition hover:-translate-y-0.5 hover:bg-[#1c7258]" data-testid="button-confirm-rental"><CreditCard size={16} />Confirm rental</button><p className="mt-4 text-center text-[11px] leading-5 text-[#98a29a]">No payment is collected in this phase. This simply reserves the item with your campus details.</p></div></div></div>;
}

function Rentals({ rentals, setRentals, setProducts }: { rentals: Rental[]; setRentals: React.Dispatch<React.SetStateAction<Rental[]>>; setProducts: React.Dispatch<React.SetStateAction<Product[]>> }) {
  const [, setLocation] = useLocation();
  const active = rentals.filter((r) => r.status === 'active');
  const past = rentals.filter((r) => r.status === 'returned');
  const returnProduct = (rental: Rental) => { setRentals((all) => all.map((item) => item.id === rental.id ? { ...item, status: 'returned' } : item)); setProducts((all) => all.map((product) => product.id === rental.productId ? { ...product, available: true } : product)); };
  return <div className="mx-auto max-w-[1120px] px-5 py-10 sm:px-8 sm:py-14"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="mb-2 text-[11px] font-bold uppercase tracking-[.18em] text-[#d36e57]">Your borrowing history</p><h1 className="font-display text-[clamp(38px,6vw,62px)] font-bold leading-none tracking-[-.07em] text-[#173d32]">My rentals</h1></div><div className="rounded-full bg-[#dfece3] px-4 py-2 font-mono-ui text-[11px] text-[#155c45]">{active.length} active {active.length === 1 ? 'rental' : 'rentals'}</div></div><section className="mt-12"><SectionTitle title="In your hands" count={active.length} />{active.length ? <div className="mt-5 space-y-3">{active.map((rental) => <RentalRow key={rental.id} rental={rental} onReturn={() => returnProduct(rental)} />)}</div> : <div className="mt-5"><EmptyState title="Your shelf is empty" body="When you rent something from the campus shelf, it will show up here." action="Explore items" onAction={() => setLocation('/')} /></div>}</section><section className="mt-14"><SectionTitle title="Past rentals" count={past.length} />{past.length ? <div className="mt-5 space-y-3">{past.map((rental) => <RentalRow key={rental.id} rental={rental} />)}</div> : <p className="mt-5 text-sm text-[#879088]">Your returned items will appear here.</p>}</section></div>;
}

function SectionTitle({ title, count }: { title: string; count: number }) { return <div className="flex items-center gap-3"><h2 className="font-display text-2xl font-bold tracking-[-.05em] text-[#173d32]">{title}</h2><span className="rounded-full bg-[#ece8dc] px-2.5 py-1 font-mono-ui text-[10px] text-[#879088]">{count.toString().padStart(2, '0')}</span></div>; }
function RentalRow({ rental, onReturn }: { rental: Rental; onReturn?: () => void }) { return <article className="flex flex-col gap-4 rounded-[20px] border border-[#e5dfd0] bg-[#faf8f1] p-4 sm:flex-row sm:items-center sm:p-5"><img src={rental.productImage} alt={rental.productName} className="size-20 rounded-2xl object-cover sm:size-24" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-display text-lg font-bold tracking-[-.04em] text-[#173d32]">{rental.productName}</h3><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.08em] ${rental.status === 'active' ? 'bg-[#f7edc9] text-[#775b11]' : 'bg-[#dfece3] text-[#155c45]'}`}>{rental.status === 'active' ? 'Active' : 'Returned'}</span></div><p className="mt-2 text-xs text-[#839087]">Owned by {rental.owner}</p><div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#68766d]"><span><strong className="text-[#344f43]">Pick up</strong> {prettyDate(rental.startDate)}</span><span><strong className="text-[#344f43]">Return</strong> {prettyDate(rental.returnDate)}</span></div></div><div className="flex items-center justify-between gap-4 border-t border-[#e5dfd0] pt-3 sm:block sm:border-t-0 sm:pt-0 sm:text-right"><p className="font-mono-ui text-sm font-medium text-[#155c45]">{money(rental.totalPrice)}</p>{onReturn && <button onClick={onReturn} className="mt-2 flex items-center gap-1.5 rounded-lg border border-[#cbdacf] px-3 py-2 text-xs font-bold text-[#155c45] transition hover:border-[#155c45] hover:bg-[#edf3ee]" data-testid={`button-return-${rental.id}`}><Undo2 size={13} />Return product</button>}</div></article>; }

function Products({ products, setProducts }: { products: Product[]; setProducts: React.Dispatch<React.SetStateAction<Product[]>> }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('Laptops');
  const [price, setPrice] = useState('200');
  const owned = products.filter((p) => p.isOwnedByCurrentUser);
  const addProduct = (e: React.FormEvent) => { e.preventDefault(); if (!name.trim()) return; const initials = 'AM'; setProducts((all) => [{ id: `p${Date.now()}`, name: name.trim(), category, description: `A useful ${category.toLowerCase().slice(0, -1)} ready for a new campus adventure.`, image: category === 'Bikes' ? '/bicycle.png' : category === 'Cameras' ? '/camera.png' : category === 'Projectors' ? '/projector.png' : category === 'Gaming' ? '/console.png' : '/laptop.png', owner: 'Arjun Mehta', ownerInitials: initials, condition: 'Good', location: 'Oak House', dailyPrice: Number(price) || 200, available: true, isOwnedByCurrentUser: true }, ...all]); setName(''); setPrice('200'); setAdding(false); };
  return <div className="mx-auto max-w-[1120px] px-5 py-10 sm:px-8 sm:py-14"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="mb-2 text-[11px] font-bold uppercase tracking-[.18em] text-[#d36e57]">Your corner of the shelf</p><h1 className="font-display text-[clamp(38px,6vw,62px)] font-bold leading-none tracking-[-.07em] text-[#173d32]">My products</h1></div><button onClick={() => setAdding((v) => !v)} className="flex w-fit items-center gap-2 rounded-xl bg-[#155c45] px-4 py-3 text-sm font-bold text-[#f5f2e9] transition hover:-translate-y-0.5 hover:bg-[#1c7258]" data-testid="button-add-product">{adding ? <X size={16} /> : <Plus size={16} />}{adding ? 'Close form' : 'Add a product'}</button></div>{adding && <form onSubmit={addProduct} className="mt-8 grid gap-4 rounded-[24px] border border-[#cbdacf] bg-[#edf3ee] p-5 sm:grid-cols-2 sm:p-7 animate-rise"><div className="sm:col-span-2"><h2 className="font-display text-xl font-bold tracking-[-.04em] text-[#173d32]">Put something useful in circulation</h2><p className="mt-1 text-sm text-[#718077]">A clear name is all your neighbour needs to find it.</p></div><label className="text-xs font-bold text-[#57685d] sm:col-span-2">Product name<input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. iPad Air with pencil" className="mt-2 w-full rounded-xl border border-[#cbdacf] bg-[#faf8f1] px-3.5 py-3 text-sm outline-none transition focus:border-[#155c45]" data-testid="input-product-name" /></label><label className="text-xs font-bold text-[#57685d]">Category<select value={category} onChange={(e) => setCategory(e.target.value as Category)} className="mt-2 w-full rounded-xl border border-[#cbdacf] bg-[#faf8f1] px-3.5 py-3 text-sm outline-none" data-testid="select-product-category">{categories.map((c) => <option key={c.name}>{c.name}</option>)}</select></label><label className="text-xs font-bold text-[#57685d]">Daily price<input type="number" min="1" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-2 w-full rounded-xl border border-[#cbdacf] bg-[#faf8f1] px-3.5 py-3 text-sm outline-none" data-testid="input-product-price" /></label><div className="sm:col-span-2"><button type="submit" className="rounded-xl bg-[#d36e57] px-5 py-3 text-sm font-bold text-[#fff8eb] transition hover:bg-[#be5f4b]" data-testid="button-save-product">Publish product</button></div></form>}<section className="mt-12"><SectionTitle title="Listed by you" count={owned.length} />{owned.length ? <div className="mt-5 grid gap-4 md:grid-cols-2">{owned.map((product) => <OwnedProduct key={product.id} product={product} onToggle={() => setProducts((all) => all.map((item) => item.id === product.id ? { ...item, available: !item.available } : item))} onDelete={() => setProducts((all) => all.filter((item) => item.id !== product.id))} />)}</div> : <div className="mt-5"><EmptyState title="Your shelf is waiting" body="List something you own and help a neighbour out." action="Add your first product" onAction={() => setAdding(true)} /></div>}</section></div>;
}

function OwnedProduct({ product, onToggle, onDelete }: { product: Product; onToggle: () => void; onDelete: () => void }) {
  return <article className="flex gap-4 rounded-[20px] border border-[#e5dfd0] bg-[#faf8f1] p-4"><img src={product.image} alt={product.name} className="size-24 rounded-2xl object-cover" /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div><h3 className="font-display text-lg font-bold leading-tight tracking-[-.04em] text-[#173d32]">{product.name}</h3><p className="mt-1 font-mono-ui text-xs text-[#155c45]">{money(product.dailyPrice)} / day</p></div><button onClick={onDelete} aria-label={`Delete ${product.name}`} className="rounded-lg p-2 text-[#a6aaa1] transition hover:bg-[#f1d5cf] hover:text-[#994d40]" data-testid={`button-delete-${product.id}`}><Trash2 size={15} /></button></div><div className="mt-4 flex items-center justify-between gap-2"><span className={`flex items-center gap-1.5 text-[11px] font-bold ${product.available ? 'text-[#155c45]' : 'text-[#a25b4b]'}`}><span className={`size-2 rounded-full ${product.available ? 'bg-[#5ca97c]' : 'bg-[#d36e57]'}`} />{product.available ? 'Available to borrow' : 'Currently unavailable'}</span><button onClick={onToggle} className="rounded-lg border border-[#d8d5c9] px-3 py-1.5 text-[11px] font-bold text-[#68766d] transition hover:border-[#155c45] hover:text-[#155c45]" data-testid={`button-toggle-availability-${product.id}`}>{product.available ? 'Pause listing' : 'Make available'}</button></div></div></article>;
}

function RouterContent({ products, rentals, setProducts, setRentals }: { products: Product[]; rentals: Rental[]; setProducts: React.Dispatch<React.SetStateAction<Product[]>>; setRentals: React.Dispatch<React.SetStateAction<Rental[]>> }) {
  return <Shell><Switch><Route path="/" component={() => <Home products={products} />} /><Route path="/product/:id" component={() => <Detail products={products} />} /><Route path="/rent/:id" component={() => <Checkout products={products} setRentals={setRentals} setProducts={setProducts} />} /><Route path="/rentals" component={() => <Rentals rentals={rentals} setRentals={setRentals} setProducts={setProducts} />} /><Route path="/products" component={() => <Products products={products} setProducts={setProducts} />} /><Route component={NotFound} /></Switch></Shell>;
}

const queryClient = new QueryClient();
function App() {
  const [products, setProducts] = useLocalState<Product[]>('rentchain-products', seedProducts);
  const [rentals, setRentals] = useLocalState<Rental[]>('rentchain-rentals', seedRentals);
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><ErrorBoundary><RouterContent products={products} rentals={rentals} setProducts={setProducts} setRentals={setRentals} /></ErrorBoundary></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;