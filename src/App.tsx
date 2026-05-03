import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Droplets, 
  Leaf, 
  ShoppingBag, 
  Wind, 
  Award, 
  Search, 
  Brain, 
  ArrowRight, 
  Ticket, 
  MapPin, 
  TreePine, 
  Recycle, 
  Waves, 
  CloudRain, 
  Heart,
  Mic,
  ArrowUp,
  Paperclip,
  X,
  Plus,
  ThumbsUp,
  Trophy,
  ExternalLink,
  Camera,
  LogIn,
  LogOut,
  User,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Music,
  Star,
  Trash2
} from 'lucide-react';
import { chatWithBloom } from './services/geminiService';
import ReactMarkdown from 'react-markdown';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  updateDoc, 
  doc, 
  setDoc, 
  getDoc,
  limit,
  increment,
  writeBatch,
  deleteDoc
} from 'firebase/firestore';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { db, auth, signIn, signOut } from './lib/firebase';

// --- Types ---
type Section = 'home' | 'relic' | 'store' | 'music' | 'rewards' | 'cinema';

interface Message {
  role: 'user' | 'model';
  text: string;
}

// --- Components ---

const Header = ({ user }: { user: FirebaseUser | null }) => (
  <header className="fixed top-0 w-full z-[60] bg-ocean-surface/60 backdrop-blur-2xl border-b border-white/10 px-6 md:px-16 py-5 flex justify-between items-center group">
    <div className="text-xl font-bold tracking-tighter text-white font-display">
      Eco-Eilish
    </div>
    <div className="flex items-center gap-6">
      <Search className="w-5 h-5 text-slate-400 cursor-pointer hover:text-bioluminescence transition-colors" />
      {user ? (
        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <div className="text-[8px] font-black text-bioluminescence uppercase tracking-widest">{user.displayName}</div>
            <div className="text-[10px] font-black text-white italic">REWARD TIER: DEEP</div>
          </div>
          <div 
            onClick={() => signOut()}
            className="w-10 h-10 rounded-full border border-bioluminescence/30 flex items-center justify-center bg-bioluminescence/5 cursor-pointer hover:bg-bioluminescence/10 transition-all overflow-hidden"
          >
            {user.photoURL ? (
              <img src={user.photoURL} className="w-full h-full object-cover" alt="Profile" />
            ) : (
              <User className="text-bioluminescence w-5 h-5" />
            )}
          </div>
        </div>
      ) : (
        <button 
          onClick={() => signIn()}
          className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest hover:border-bioluminescence transition-all text-slate-400 hover:text-bioluminescence"
        >
          <LogIn className="w-4 h-4" />
          Join Collective
        </button>
      )}
    </div>
  </header>
);

const NavItem = ({ active, icon: Icon, label, onClick }: { active: boolean, icon: any, label: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300 ${active ? 'text-bioluminescence' : 'text-slate-500 hover:text-slate-300'}`}
  >
    <div className={`relative ${active ? 'scale-110' : ''}`}>
      <Icon className={`w-6 h-6 ${active ? 'fill-current drop-shadow-[0_0_8px_rgba(0,229,255,0.6)]' : ''}`} />
      {active && (
        <motion.div 
          layoutId="nav-active" 
          className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-bioluminescence rounded-full shadow-[0_0_10px_rgba(0,229,255,1)]" 
        />
      )}
    </div>
    <span className="text-[10px] uppercase font-bold tracking-widest">{label}</span>
  </button>
);

const MobileNav = ({ activeSection, setSection }: { activeSection: Section, setSection: (s: Section) => void }) => (
  <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 h-20 bg-ocean-surface/80 backdrop-blur-3xl border-t border-white/10 flex justify-around items-center px-2">
    <NavItem active={activeSection === 'home'} icon={Droplets} label="Home" onClick={() => setSection('home')} />
    <NavItem active={activeSection === 'relic'} icon={Leaf} label="Relic" onClick={() => setSection('relic')} />
    <NavItem active={activeSection === 'store'} icon={ShoppingBag} label="Store" onClick={() => setSection('store')} />
    <NavItem active={activeSection === 'music'} icon={Music} label="Music" onClick={() => setSection('music')} />
    <NavItem active={activeSection === 'rewards'} icon={Award} label="Rewards" onClick={() => setSection('rewards')} />
    <NavItem active={activeSection === 'cinema'} icon={Ticket} label="Cinema" onClick={() => setSection('cinema')} />
  </nav>
);

const DesktopNav = ({ activeSection, setSection }: { activeSection: Section, setSection: (s: Section) => void }) => (
  <nav className="hidden md:flex fixed top-0 left-1/2 -translate-x-1/2 h-[72px] z-[70] items-center gap-10">
    {(['home', 'relic', 'store', 'music', 'rewards', 'cinema'] as Section[]).map((s) => (
      <button 
        key={s} 
        onClick={() => setSection(s)}
        className={`text-sm font-bold uppercase tracking-widest transition-colors ${activeSection === s ? 'text-bioluminescence' : 'text-slate-400 hover:text-white'}`}
      >
        {s}
        {activeSection === s && (
          <motion.div layoutId="desktop-active" className="absolute -bottom-1 left-0 w-full h-[2px] bg-bioluminescence" />
        )}
      </button>
    ))}
  </nav>
);

const HomeSection = ({ setSection }: { setSection: (s: Section) => void }) => (
  <div className="flex flex-col items-center justify-center min-h-[85vh] text-center gap-12 py-20 relative overflow-hidden">
    {/* Atmospheric Background Video/Image */}
    <video 
      autoPlay 
      loop 
      muted 
      playsInline
      className="absolute inset-0 w-full h-full object-cover opacity-30 -z-10 grayscale brightness-75"
    >
      <source src="/assets/hero_bg.mp4" type="video/mp4" />
    </video>
    
    <div className="absolute inset-0 bg-gradient-to-b from-ocean-depths/40 via-ocean-depths/10 to-ocean-depths -z-10" />
    
    {/* Higher Contrast Atmospheric Glow */}
    <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-bioluminescence rounded-full blur-[180px] opacity-10 pointer-events-none" />

    <div className="flex flex-col gap-2 z-10">
      <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white uppercase italic leading-none">HIT ME HARD</h1>
      <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent stroke-text uppercase italic leading-none">AND SOFT</h1>
    </div>

    <div className="flex flex-col items-center gap-10 mt-4 z-10">
      <button 
        onClick={() => setSection('store')}
        className="bg-transparent border border-white/20 text-white px-14 py-5 font-bold uppercase tracking-[0.3em] backdrop-blur-xl hover:bg-white/10 hover:border-bioluminescence/40 transition-all text-xs glow-cyan"
      >
        Explore The Collective
      </button>
    </div>
  </div>
);

const StoreSection = ({ onPurchase, setSection }: { onPurchase: (p: any) => void, setSection: (s: Section) => void }) => (
  <div className="flex flex-col gap-16 py-12">
    <div className="flex items-center justify-between border-b border-white/5 pb-12">
      <div className="flex flex-col gap-4">
        <h1 className="text-6xl md:text-8xl font-black text-white italic uppercase tracking-tighter">The Depot</h1>
        <p className="text-xl text-slate-400 max-w-2xl font-medium tracking-tight">Access exclusive sustainable threads and secure tour relics from the underwater realm.</p>
      </div>
      <div className="hidden lg:flex items-center gap-12">
        <div className="text-right">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Impact Verified</div>
          <div className="text-2xl font-black text-white italic">100% RECYCLED</div>
        </div>
        <div className="w-16 h-16 rounded-full border border-bioluminescence/30 flex items-center justify-center animate-spin-slow">
           <Leaf className="text-bioluminescence w-8 h-8" />
        </div>
      </div>
    </div>

    {/* Hero Bento */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[550px]">
      <div className="col-span-1 md:col-span-2 relative glass-panel rounded-[32px] overflow-hidden group backdrop-blur-md bg-white/5 border border-white/10 shadow-2xl">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110"
          style={{ backgroundImage: `url('/assets/vinyl_featured.png')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ocean-depths/80 via-transparent to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 flex justify-between items-end">
          <div>
            <span className="bg-primary-container text-white px-4 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-[0.2em] italic mb-6 inline-block shadow-[0_0_20px_rgba(0,57,180,0.4)]">Featured Release</span>
            <h2 className="text-4xl md:text-6xl font-black mt-4 uppercase italic tracking-tighter text-white">HMHAS Vinyl</h2>
          </div>
          <button 
            onClick={() => onPurchase({ name: 'HMHAS Vinyl', price: 35, offset: 1.75 })}
            className="bg-bioluminescence text-black px-10 py-5 rounded-none font-black uppercase tracking-[0.3em] text-xs hover:scale-105 transition-all glow-cyan italic"
          >
            Shop Now
          </button>
        </div>
      </div>
      <div className="relative glass-panel rounded-[32px] overflow-hidden group backdrop-blur-md bg-white/5 border border-white/10 shadow-2xl">
        <div 
          className="absolute inset-0 bg-cover bg-center brightness-50 contrast-125"
          style={{ backgroundImage: `url('/assets/live_box_office.png')` }}
        />
        <div className="absolute inset-0 p-10 flex flex-col justify-end bg-gradient-to-t from-black via-transparent to-transparent">
          <Ticket className="text-bioluminescence w-12 h-12 mb-6" />
          <h2 className="text-4xl font-black mb-4 uppercase italic tracking-tighter text-white">Box Office</h2>
          <p className="text-slate-400 mb-8 text-sm font-medium leading-relaxed">Secure passes to immersive tour experiences and screenings.</p>
          <button className="w-full bg-white/5 backdrop-blur-md border border-white/10 py-5 rounded-none font-black text-xs uppercase tracking-[0.3em] hover:bg-white/10 transition-all italic text-white/40">Coming Soon</button>
        </div>
      </div>
    </div>

    {/* Section Filter UI */}
    <div className="flex flex-wrap items-center justify-between gap-6 border-b border-white/5 pb-8">
      <div>
        <h2 className="text-3xl font-black uppercase italic tracking-tight">Latest Works</h2>
        <p className="text-slate-500 text-sm mt-1">Refining the textures of sound into physical form.</p>
      </div>
      <div className="flex gap-4">
         <button className="px-6 py-2 bg-bioluminescence/10 text-bioluminescence border border-bioluminescence/20 rounded-full text-[10px] uppercase font-bold tracking-widest">Apparel</button>
         <button onClick={() => setSection('music')} className="px-6 py-2 bg-white/5 text-slate-500 border border-white/10 rounded-full text-[10px] uppercase font-bold tracking-widest hover:text-white transition-colors">Music</button>
         <button onClick={() => setSection('relic')} className="px-6 py-2 bg-white/5 text-slate-500 border border-white/10 rounded-full text-[10px] uppercase font-bold tracking-widest hover:text-white transition-colors">Relics</button>
      </div>
    </div>

    {/* Product Grid */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
      {[
        { name: 'HMHAS Hoodie & CD', price: '$85.00', raw: 85, img: '/assets/product_hoodie.png' },
        { name: 'Tour Jersey 01', price: '$65.00', raw: 65, img: '/assets/product_jersey.png' },
        { name: 'HMHAS Tour Relic', price: '$45.00', raw: 45, img: '/assets/product_relic.png' },
        { name: 'Eilish Fragrance', price: '$72.00', raw: 72, img: 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=1000' }
      ].map((p, i) => (
        <div 
          key={i} 
          onClick={() => onPurchase({ name: p.name, price: p.raw, offset: (p.raw * 0.05).toFixed(2) })}
          className="glass-panel group cursor-pointer border border-white/5 hover:border-bioluminescence/30 transition-all overflow-hidden flex flex-col backdrop-blur-lg bg-white/5 shadow-xl"
        >
          <div className="aspect-square bg-[#0a0a0a] overflow-hidden relative">
             <img 
              src={p.img} 
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105" 
              alt={p.name}
            />
            <div className="absolute top-4 left-4">
               <span className="text-[8px] font-black bg-black/60 px-2 py-1 text-bioluminescence tracking-widest border border-bioluminescence/20 shadow-[0_0_10px_rgba(0,229,255,0.2)]">BE3-COLLECTIVE</span>
            </div>
          </div>
          <div className="p-6 bg-white/[0.02]">
            <h3 className="font-black text-xs uppercase tracking-widest mb-1 italic text-white/90">{p.name}</h3>
            <p className="text-bioluminescence font-black text-sm tracking-tighter">{p.price}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);


const CountingNumber = ({ value, suffix = "" }: { value: number; suffix?: string }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 2000;
    const increment = end / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  return <>{count.toLocaleString()}{suffix}</>;
};

const RelicSection = () => (
  <div className="flex flex-col gap-12 py-8">
    <div className="flex flex-col gap-4">
      <h1 className="text-7xl md:text-9xl font-black text-white italic uppercase tracking-tighter">Your Relic.</h1>
      <p className="text-xl text-slate-400 max-w-2xl font-medium tracking-tight leading-relaxed">Tracking every drop. Your collective environmental impact within the ecosystem.</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mt-8">
      <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div className="glass-panel p-10 rounded-[40px] relative overflow-hidden group backdrop-blur-md bg-white/5 border-white/20">
          <TreePine className="absolute -top-4 -right-4 w-40 h-40 text-bioluminescence opacity-10" />
          <div className="flex items-center gap-3 mb-8">
            <span className="w-12 h-12 rounded-full bg-bioluminescence/10 flex items-center justify-center border border-bioluminescence/30">
              <TreePine className="w-6 h-6 text-bioluminescence" />
            </span>
            <span className="uppercase text-[10px] font-black tracking-[0.3em] text-slate-500">Trees Planted</span>
          </div>
          <div className="text-8xl font-black text-white mb-2 tracking-tighter">
            <CountingNumber value={142} />
          </div>
          <p className="text-slate-400 font-medium">Equivalent to 3.2 tons of CO2 offset.</p>
          <div className="mt-10 h-2 bg-white/5 rounded-full overflow-hidden">
             <motion.div initial={{ width: 0 }} animate={{ width: '71%' }} className="h-full bg-bioluminescence glow-cyan" />
          </div>
        </div>
        <div className="glass-panel p-10 rounded-[40px] relative overflow-hidden group backdrop-blur-md bg-white/5 border-white/20">
          <Recycle className="absolute -top-4 -right-4 w-40 h-40 text-bioluminescence opacity-10" />
          <div className="flex items-center gap-3 mb-8">
            <span className="w-12 h-12 rounded-full bg-bioluminescence/10 flex items-center justify-center border border-bioluminescence/30">
              <Recycle className="w-6 h-6 text-bioluminescence" />
            </span>
            <span className="uppercase text-[10px] font-black tracking-[0.3em] text-slate-500">Items Recycled</span>
          </div>
          <div className="text-8xl font-black text-white mb-2 tracking-tighter">
            <CountingNumber value={845} />
          </div>
          <p className="text-slate-400 font-medium tracking-tight">Waste diverted and textiles repurposed.</p>
          <div className="mt-10 h-2 bg-white/5 rounded-full overflow-hidden">
             <motion.div initial={{ width: 0 }} animate={{ width: '84%' }} className="h-full bg-bioluminescence glow-cyan" />
          </div>
        </div>
      </div>

      <div className="md:col-span-4 glass-panel p-10 rounded-[40px] flex flex-col gap-12 backdrop-blur-md bg-white/10 border-white/20">
        <h2 className="text-3xl font-black text-bioluminescence border-b border-white/5 pb-4 uppercase italic tracking-tighter">Global Impact</h2>
        <div className="space-y-12">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-primary-container/20 border border-primary-container flex items-center justify-center glow-blue">
              <Waves className="text-bioluminescence w-8 h-8" />
            </div>
            <div>
              <div className="text-4xl font-black tracking-tighter">
                 <CountingNumber value={2} suffix=".5M+" />
              </div>
              <div className="text-[10px] uppercase font-bold tracking-[0.3em] text-slate-500">Gallons Saved</div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <CloudRain className="text-slate-400 w-8 h-8" />
            </div>
            <div>
              <div className="text-4xl font-black tracking-tighter">
                <CountingNumber value={850} suffix="K" />
              </div>
              <div className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500">Tons Offset</div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <Heart className="text-slate-400 w-8 h-8" />
            </div>
            <div>
              <div className="text-4xl font-black tracking-tighter">
                $<CountingNumber value={1.2} suffix="M" />
              </div>
              <div className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500">Raised for Oceans</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);


const MusicSection = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Hello. The water is calm today. How are the currents feeling in your mind right now?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [promptIndex, setPromptIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const tracks = [
    { id: 1, title: "SKINNY", mood: "Vocal Layering", duration: "3:42", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
    { id: 2, title: "LUNCH", mood: "Groovy Beat", duration: "2:59", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
    { id: 3, title: "CHIHIRO", mood: "Hypnotic Isolation", duration: "5:03", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
    { id: 4, title: "BIRDS OF A FEATHER", mood: "Melodic Reflection", duration: "3:30", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
    { id: 5, title: "WILDFLOWER", mood: "Natural Acoustic", duration: "4:21", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
    { id: 6, title: "THE GREATEST", mood: "Ethereal Depth", duration: "4:50", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" },
    { id: 7, title: "L'AMOUR DE MA VIE", mood: "Vibrant Contrast", duration: "5:33", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3" },
    { id: 8, title: "THE DINER", mood: "Atmospheric Noir", duration: "3:06", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3" },
    { id: 9, title: "BITTERSUITE", mood: "Complex Texture", duration: "4:58", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3" },
    { id: 10, title: "BLUE", mood: "Final Submersion", duration: "5:43", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3" }
  ];

  const [activeTrack, setActiveTrack] = useState(tracks[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const prompts = [
    "ARE YOU BREATHING DEEPLY?",
    "HOW DOES THE BLUE FEEL TODAY?",
    "RELEASE THE WEIGHT OF THE SURFACE.",
    "FIND THE STILLNESS IN THE ECHO.",
    "SUBMERGE INTO THE SOUND."
  ];

  const nextPrompt = () => setPromptIndex((i) => (i + 1) % prompts.length);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.log("Audio play failed:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, activeTrack]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    const history = messages.map(m => ({
      role: m.role,
      text: m.text
    }));

    const response = await chatWithBloom(userMsg, history);
    setMessages(prev => [...prev, { role: 'model', text: response }]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-12 py-8 relative">
      <div className="fixed bottom-10 right-10 z-50">
        <motion.div 
          onClick={nextPrompt}
          whileHover={{ scale: 1.05 }}
          className="glass-panel p-6 rounded-2xl cursor-pointer bg-bioluminescence/5 border border-bioluminescence/30 backdrop-blur-2xl shadow-[0_0_30px_rgba(0,229,255,0.2)] max-w-xs"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 bg-bioluminescence rounded-full animate-pulse" />
            <span className="text-[10px] font-black tracking-widest text-bioluminescence">BLOOM'S THOUGHT</span>
          </div>
          <p className="text-xs font-black italic text-white leading-relaxed uppercase">{prompts[promptIndex]}</p>
        </motion.div>
      </div>

      <div className="relative rounded-[48px] overflow-hidden min-h-[450px] flex items-center p-8 md:p-16 border border-white/10 group shadow-[0_0_50px_rgba(0,229,255,0.1)] backdrop-blur-xl bg-white/5">
        <div 
          className="absolute inset-0 -z-10 bg-cover bg-center brightness-50 scale-105 group-hover:scale-110 transition-transform duration-1000"
          style={{ backgroundImage: `url('/assets/global_bg.jpg')` }}
        />
        <div className="max-w-2xl relative z-10">
          <span className="text-bioluminescence uppercase tracking-[0.5em] font-black text-xs mb-6 block animate-pulse italic underline underline-offset-8">Discography</span>
          <h1 className="text-7xl md:text-9xl font-black mb-8 leading-none tracking-tighter uppercase italic drop-shadow-2xl">HMHAS MUSIC</h1>
          <p className="text-xl text-slate-200 leading-relaxed font-bold tracking-tight">The auditory core of the ecosystem. Every frequency, every breath, every submerged beat.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mt-4">
        <div className="md:col-span-12 glass-panel rounded-[40px] p-12 flex flex-col gap-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-bioluminescence/10 border border-bioluminescence/30 flex items-center justify-center glow-cyan">
                <Music className="text-bioluminescence w-8 h-8" />
              </div>
              <h2 className="text-5xl font-black uppercase italic tracking-tighter">HMHAS Tracklist</h2>
            </div>
            {isPlaying && (
              <div className="flex items-center gap-1">
                 {[1,2,3,4,5].map(i => (
                   <motion.div 
                    key={i}
                    animate={{ height: [8, 24, 8] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                    className="w-1 bg-bioluminescence rounded-full"
                   />
                 ))}
              </div>
            )}
          </div>

          <div className="flex flex-col xl:flex-row gap-12">
            {/* Player Interface */}
            <div className="flex-1 flex flex-col gap-10">
              <div className="relative aspect-video md:aspect-[21/9] rounded-[40px] overflow-hidden group shadow-2xl border border-white/10">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-slate-950 to-black" />
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-64 h-64 rounded-full border-2 border-white/5 flex items-center justify-center animate-spin-slow">
                      <div className="w-56 h-56 rounded-full border border-bioluminescence/20 flex items-center justify-center">
                         <div className="w-48 h-48 rounded-full border border-bioluminescence/10 flex items-center justify-center bg-bioluminescence/5">
                            <Music className="text-bioluminescence w-16 h-16 opacity-30" />
                         </div>
                      </div>
                   </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-12 bg-gradient-to-t from-black via-black/80 to-transparent">
                  <div className="text-[10px] uppercase font-black tracking-[0.4em] text-bioluminescence mb-3 flex items-center gap-2">
                    <div className="w-1 h-1 bg-bioluminescence rounded-full animate-ping" />
                    HIT ME HARD AND SOFT
                  </div>
                  <h3 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter mb-2">{activeTrack.title}</h3>
                  <p className="text-slate-400 text-sm font-medium tracking-widest uppercase">{activeTrack.mood}</p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-col gap-8 bg-white/5 p-10 rounded-[40px] border border-white/10">
                <div className="flex flex-col gap-3">
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden cursor-pointer group">
                    <motion.div 
                      className="h-full bg-bioluminescence shadow-[0_0_15px_rgba(0,229,255,0.6)] relative"
                      initial={{ width: "0%" }}
                      animate={{ width: isPlaying ? "100%" : "35%" }}
                      transition={{ duration: isPlaying ? 240 : 1, ease: "linear" }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-xl scale-0 group-hover:scale-100 transition-transform" />
                    </motion.div>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-[10px] font-black text-slate-500 font-mono tracking-tighter">0:00</span>
                     <span className="text-[10px] font-black text-slate-500 font-mono tracking-tighter">{activeTrack.duration}</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-14">
                  <SkipBack 
                    onClick={() => {
                      const currentIndex = tracks.findIndex(t => t.id === activeTrack.id);
                      const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
                      setActiveTrack(tracks[prevIndex]);
                      setIsPlaying(true);
                    }}
                    className="w-10 h-10 text-slate-500 cursor-pointer hover:text-white transition-colors" 
                  />
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-24 h-24 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_0_50px_rgba(255,255,255,0.2)]"
                  >
                    {isPlaying ? <Pause className="w-12 h-12" /> : <Play className="w-12 h-12 translate-x-1" />}
                  </button>
                  <SkipForward 
                    onClick={() => {
                      const currentIndex = tracks.findIndex(t => t.id === activeTrack.id);
                      const nextIndex = (currentIndex + 1) % tracks.length;
                      setActiveTrack(tracks[nextIndex]);
                      setIsPlaying(true);
                    }}
                    className="w-10 h-10 text-slate-500 cursor-pointer hover:text-white transition-colors" 
                  />
                </div>
                
                <div className="flex items-center justify-center gap-6 text-slate-500 border-t border-white/5 pt-8">
                  <Volume2 className="w-5 h-5" />
                  <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="w-4/5 h-full bg-bioluminescence/40" />
                  </div>
                </div>
              </div>
              
              <audio ref={audioRef} src={activeTrack.url} onEnded={() => setIsPlaying(false)} />
            </div>

            {/* Track List */}
            <div className="xl:w-96 flex flex-col gap-6">
               <div className="flex items-center justify-between px-4">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 italic">Navigation Log</h4>
                 <span className="text-[10px] font-black text-bioluminescence">{tracks.length} MODES</span>
               </div>
               <div className="flex flex-col gap-4">
                 {tracks.map((t) => (
                   <motion.div 
                     whileHover={{ x: 10 }}
                     key={t.id}
                     onClick={() => {
                        setActiveTrack(t);
                        setIsPlaying(true);
                     }}
                     className={`p-8 rounded-[32px] border transition-all cursor-pointer group flex items-start justify-between relative overflow-hidden ${
                       activeTrack.id === t.id 
                         ? 'bg-bioluminescence/5 border-bioluminescence/40 shadow-[0_0_30px_rgba(0,229,255,0.1)]' 
                         : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
                     }`}
                   >
                     {activeTrack.id === t.id && (
                       <motion.div 
                        layoutId="track-active"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-bioluminescence" 
                       />
                     )}
                     <div className="flex flex-col gap-2">
                       <div className="flex items-center gap-3">
                         <span className={`text-[10px] font-black uppercase tracking-widest ${activeTrack.id === t.id ? 'text-bioluminescence' : 'text-slate-600'}`}>0{t.id}</span>
                         <span className={`text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded-sm ${activeTrack.id === t.id ? 'bg-bioluminescence/20 text-bioluminescence' : 'bg-white/5 text-slate-700'}`}>{t.mood}</span>
                       </div>
                       <span className={`text-xl font-black italic tracking-tight ${activeTrack.id === t.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>{t.title}</span>
                     </div>
                     <span className="text-[10px] font-black text-slate-700 mt-1">{t.duration}</span>
                   </motion.div>
                 ))}
               </div>

               <div className="mt-8 p-10 bg-bioluminescence/5 border border-bioluminescence/20 rounded-[40px] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                    <Heart className="text-bioluminescence w-20 h-20 -rotate-12" />
                  </div>
                  <h5 className="text-white font-black uppercase italic tracking-tighter text-2xl mb-4">Isolation Audio</h5>
                  <p className="text-slate-400 text-xs font-medium leading-relaxed uppercase tracking-wider">Tracks mixed specifically for deep-sea frequency resonance. <span className="text-bioluminescence italic underline underline-offset-4">Verified by the collective.</span></p>
               </div>
            </div>
          </div>
        </div>

        {/* Bloom Chat */}
        <div className="md:col-span-12 glass-panel rounded-[40px] overflow-hidden flex flex-col md:flex-row h-[700px] mt-8">
          <div className="w-full md:w-96 bg-ocean-surface/60 border-b md:border-b-0 md:border-r border-white/5 p-12 flex flex-col items-center justify-center text-center relative">
            <div className="w-32 h-32 rounded-full bg-surface-container flex items-center justify-center border border-bioluminescence/30 shadow-[0_0_40px_rgba(0,229,255,0.2)] mb-10 group cursor-pointer hover:scale-105 transition-transform">
              <Brain className="w-16 h-16 text-bioluminescence" />
              <div className="absolute inset-x-0 bottom-0 h-1 bg-bioluminescence/20 blur-xl animate-pulse" />
            </div>
            <h3 className="text-5xl font-black text-white mb-6 tracking-tighter uppercase italic">Bloom</h3>
            <p className="text-slate-400 font-medium">Your digital companion. Here to listen, reflect, and guide you through the stillness.</p>
          </div>
          <div className="flex-1 flex flex-col p-10 bg-black/20 relative">
            <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-8 pr-6 mb-8 scroll-smooth hide-scrollbar">
              <AnimatePresence initial={false}>
                {messages.map((m, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={i} 
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[75%] px-10 py-6 rounded-[32px] ${
                      m.role === 'user' 
                        ? 'bg-bioluminescence/10 text-bioluminescence rounded-tr-sm border border-bioluminescence/20 italic font-black shadow-[0_0_20px_rgba(0,229,255,0.05)]' 
                        : 'bg-white/5 text-slate-300 rounded-tl-sm border border-white/5 font-medium'
                    }`}>
                      <div className="prose prose-invert prose-sm tracking-tight leading-relaxed">
                        <ReactMarkdown>{m.text}</ReactMarkdown>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {loading && (
                <div className="flex gap-2 ml-4">
                  <span className="w-2 h-2 bg-bioluminescence rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-bioluminescence rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 bg-bioluminescence rounded-full animate-bounce [animation-delay:-0.3s]" />
                </div>
              )}
            </div>
            <div className="relative">
              <input 
                value={input}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                onChange={(e) => setInput(e.target.value)}
                placeholder="RELEASE YOUR THOUGHTS..."
                className="w-full bg-white/5 border border-white/10 rounded-full py-6 pl-14 pr-24 text-[13px] font-black uppercase tracking-[0.2em] focus:border-bioluminescence focus:ring-0 outline-none transition-all placeholder:text-slate-700"
              />
              <Mic className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 w-5 h-5 cursor-pointer hover:text-bioluminescence transition-colors" />
              <button 
                onClick={handleSend}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-14 h-14 bg-bioluminescence text-black rounded-full flex items-center justify-center hover:scale-105 transition-all shadow-[0_0_30px_rgba(0,229,255,0.3)]"
              >
                <ArrowUp className="w-7 h-7" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


const RewardsSection = ({ user }: { user: FirebaseUser | null }) => {
  const [acts, setActs] = useState<any[]>([]);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [votedActs, setVotedActs] = useState<Set<string>>(new Set());

  useEffect(() => {
    const q = query(collection(db, 'acts'), orderBy('timestamp', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setActs(docs);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !description || !imageUrl) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'acts'), {
        userId: user.uid,
        userName: user.displayName,
        description,
        imageUrl,
        votes: 0,
        timestamp: serverTimestamp()
      });
      setDescription('');
      setImageUrl('');
    } catch (error) {
      console.error("Error adding act:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (actId: string) => {
    if (!user || votedActs.has(actId)) return;

    try {
      const batch = writeBatch(db);
      const actRef = doc(db, 'acts', actId);
      const voteRef = doc(db, 'acts', actId, 'votes', user.uid);

      batch.set(voteRef, { userId: user.uid, timestamp: serverTimestamp() });
      batch.update(actRef, { votes: increment(1) });

      await batch.commit();
      setVotedActs(prev => new Set(prev).add(actId));
    } catch (error) {
      console.error("Error voting:", error);
    }
  };

  const leaderboard = [...acts].sort((a, b) => (b.votes || 0) - (a.votes || 0)).slice(0, 3);

  return (
    <div className="flex flex-col gap-16 py-12">
      <div className="flex flex-col gap-6">
        <h1 className="text-6xl md:text-8xl font-black text-white italic uppercase tracking-tighter">The Deep Rewards</h1>
        <p className="text-xl text-slate-400 max-w-2xl font-medium tracking-tight">Journal your environmental actions, upload proof, and rise through the collective ranks to earn exclusive shop credits.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Leaderboard & Stats */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="glass-panel p-8 rounded-[32px] border-bioluminescence/20 bg-bioluminescence/5">
            <div className="flex items-center gap-3 mb-8">
              <Trophy className="text-bioluminescence w-6 h-6" />
              <h2 className="text-xl font-black uppercase italic tracking-tighter text-bioluminescence">Collective Leaders</h2>
            </div>
            <div className="flex flex-col gap-6">
              {leaderboard.map((a, i) => (
                <div key={a.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-4">
                    <span className="text-bioluminescence font-black text-xs">#{i + 1}</span>
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[10px]">
                      {a.userName?.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-black uppercase text-white truncate w-32">{a.userName}</div>
                      <div className="text-[10px] text-bioluminescence font-bold uppercase">{a.votes || 0} Credits Earned</div>
                    </div>
                  </div>
                  <Award className={`w-5 h-5 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-300' : 'text-amber-600'}`} />
                </div>
              ))}
              {leaderboard.length === 0 && <p className="text-xs text-slate-600 italic">Calculating the depths...</p>}
            </div>
          </div>

          <div className="glass-panel p-8 rounded-[32px] border-white/10 bg-white/5">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6">Redemption Rates</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-slate-300 uppercase">10 Votes</span>
                <span className="text-bioluminescence">Artifact Voucher</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold">
                 <span className="text-slate-300 uppercase">50 Votes</span>
                 <span className="text-bioluminescence">Tour Jersey Tier</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold">
                 <span className="text-slate-300 uppercase">100 Votes</span>
                 <span className="text-bioluminescence">Personal Eco-Relic</span>
              </div>
            </div>
          </div>
        </div>

        {/* Middle: Action Feed */}
        <div className="lg:col-span-8 flex flex-col gap-10">
          {/* Submit Form */}
          <div className="glass-panel p-8 md:p-10 rounded-[40px] border-white/10 bg-white/5 shadow-2xl">
            <form onSubmit={handleSubmit} className="flex flex-col gap-8">
              <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                <div className="w-12 h-12 rounded-full bg-bioluminescence/10 flex items-center justify-center border border-bioluminescence/30">
                  <Plus className="text-bioluminescence w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black uppercase italic text-white">Journal Your Act</h3>
              </div>
              
              <div className="flex flex-col gap-6">
                 <div>
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3 block">Description</label>
                   <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Wht did you do today? (e.g. Cleaned a local beach, sorted community e-waste...)"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-sm font-medium focus:border-bioluminescence outline-none transition-all min-h-[120px] resize-none"
                   />
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                     <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3 block">Proof (Image URL)</label>
                     <div className="relative">
                       <input 
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="Paste image URL here..."
                        className="w-full bg-black/40 border border-white/10 rounded-full py-4 px-12 text-xs font-medium focus:border-bioluminescence outline-none transition-all"
                       />
                       <Camera className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" />
                     </div>
                   </div>
                   <div className="flex items-end">
                     <button 
                      disabled={isSubmitting || !user}
                      type="submit"
                      className="w-full bg-bioluminescence text-black py-4 rounded-full font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg glow-cyan disabled:opacity-50"
                     >
                       {isSubmitting ? 'SECURE LOGGING...' : 'POST TO THE DEEP'}
                     </button>
                   </div>
                 </div>
              </div>
              {!user && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
                  <LogIn className="text-red-500 w-4 h-4" />
                  <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Sign in to submit your journey.</span>
                </div>
              )}
            </form>
          </div>

          {/* Feed */}
          <div className="space-y-8">
            {acts.map((act) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={act.id} 
                className="glass-panel overflow-hidden rounded-[32px] border-white/5 bg-white/[0.02]"
              >
                <div className="flex flex-col md:flex-row h-auto md:h-64">
                   <div className="w-full md:w-64 h-64 md:h-full bg-slate-900 border-r border-white/5 relative group">
                     {act.imageUrl && (
                       <img src={act.imageUrl} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-all duration-700" alt="Proof" />
                     )}
                     <div className="absolute top-4 left-4">
                        <span className="text-[8px] font-black bg-black/60 px-2 py-1 text-bioluminescence tracking-[0.2em] border border-bioluminescence/20 uppercase italic">Proof Verified</span>
                     </div>
                   </div>
                   <div className="flex-1 p-8 flex flex-col justify-between">
                     <div>
                       <div className="flex items-center gap-3 mb-4">
                         <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[8px] uppercase">{act.userName?.charAt(0)}</div>
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{act.userName}</span>
                         <span className="text-[10px] text-slate-700">• {act.timestamp ? act.timestamp.toDate().toLocaleDateString() : 'Just now'}</span>
                       </div>
                       <p className="text-sm font-medium text-slate-300 leading-relaxed italic border-l-2 border-bioluminescence/30 pl-4">"{act.description}"</p>
                     </div>
                     
                     <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => handleVote(act.id)}
                            className={`flex items-center gap-2 group transition-all ${votedActs.has(act.id) ? 'text-bioluminescence' : 'text-slate-500 hover:text-white'}`}
                          >
                            <ThumbsUp className={`w-5 h-5 ${votedActs.has(act.id) ? 'fill-current' : 'group-hover:scale-110'}`} />
                            <span className="text-xs font-black">{act.votes || 0}</span>
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest italic">Act of the Day</span>
                           <div className="w-2 h-2 rounded-full bg-bioluminescence/40 animate-pulse" />
                        </div>
                     </div>
                   </div>
                </div>
              </motion.div>
            ))}
            {acts.length === 0 && (
              <div className="py-20 text-center flex flex-col items-center gap-4 border-2 border-dashed border-white/5 rounded-[40px]">
                <Plus className="w-12 h-12 text-slate-700 mb-2" />
                <p className="text-slate-500 font-black uppercase text-xs tracking-widest italic">The depths are quiet. Be the first to journal.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const CinemaSection = ({ user }: { user: FirebaseUser | null }) => {
  const [loading, setLoading] = useState(false);
  const [cinemas, setCinemas] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'movieReviews'), orderBy('timestamp', 'desc'), limit(20));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;
    setSubmittingReview(true);
    try {
      await addDoc(collection(db, 'movieReviews'), {
        userId: user.uid,
        userName: user.displayName || 'Anonymous Player',
        userPhoto: user.photoURL,
        rating,
        comment: newComment,
        timestamp: serverTimestamp()
      });
      setNewComment('');
      setRating(5);
    } catch (e) {
      console.error("Review submission failed:", e);
    } finally {
      setSubmittingReview(false);
    }
  };

  const deleteReview = async (id: string) => {
    if (!window.confirm("ARE YOU SURE YOU WANT TO REMOVE THIS FREQUENCY?")) return;
    try {
      await deleteDoc(doc(db, 'movieReviews', id));
    } catch (e) {
      console.error("Delete failed:", e);
    }
  };

  const findCinemas = () => {
    setLoading(true);
    setError(null);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // In a real app we'd fetch from an API. Here we'll simulate finding results
          // and provide a direct link to Google Maps.
          setTimeout(() => {
            setCinemas([
              { name: "Oceanic Cineplex", distance: "0.8 miles", address: "Pier 39, Underwater District", rating: 4.8 },
              { name: "Deep Blue IMAX", distance: "1.5 miles", address: "Coral Plaza, Trench Way", rating: 4.9 },
              { name: "Submerged Screenings", distance: "2.3 miles", address: "Glow Cove Mall", rating: 4.5 }
            ]);
            setLoading(false);
          }, 1500);
        },
        (err) => {
          setError("Location access denied. Please enable geolocation.");
          setLoading(false);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-16 py-12">
      <div className="flex flex-col gap-6 text-center md:text-left">
        <div className="flex items-center gap-4 justify-center md:justify-start">
          <Ticket className="text-bioluminescence w-10 h-10" />
          <h1 className="text-5xl md:text-7xl font-black text-white italic uppercase tracking-tighter">Premiere Finder</h1>
        </div>
        <p className="text-xl text-slate-400 max-w-2xl font-medium tracking-tight">Billie's new film experience is descending. Locate the nearest biological screening collective.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-12 glass-panel p-12 rounded-[40px] border-bioluminescence/20 bg-bioluminescence/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-bioluminescence rounded-full blur-[150px] opacity-10 -mr-48 -mt-48" />
          
          <div className="relative z-10 flex flex-col items-center gap-12">
            <div className="w-24 h-24 rounded-full border-2 border-bioluminescence/30 flex items-center justify-center animate-pulse">
               <MapPin className="text-bioluminescence w-10 h-10" />
            </div>
            
            <div className="text-center flex flex-col gap-4">
              <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">Locate Your Coordinate</h2>
              <p className="text-slate-400 text-sm uppercase tracking-widest font-black">Sync your biological location for the nearest decryption</p>
            </div>

            <button 
              onClick={findCinemas}
              disabled={loading}
              className="px-12 py-6 bg-bioluminescence text-black rounded-full font-black text-xl uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_50px_rgba(0,229,255,0.3)] disabled:opacity-50"
            >
              {loading ? 'SYNCING CURRENTS...' : 'FIND CINEMAS NEAR ME'}
            </button>

            {error && (
              <p className="text-red-500 font-black uppercase text-[10px] tracking-widest">{error}</p>
            )}
          </div>
        </div>

        {cinemas.length > 0 && (
          <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            {cinemas.map((c, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={c.name}
                className="glass-panel p-8 rounded-[32px] border-white/10 bg-white/5 hover:border-bioluminescence/30 transition-all group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-bioluminescence font-black text-[10px] uppercase tracking-widest">{c.distance}</span>
                    <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">{c.name}</h3>
                  </div>
                  <div className="bg-bioluminescence/10 px-2 py-1 rounded border border-bioluminescence/20">
                    <span className="text-bioluminescence font-black text-[10px]">★ {c.rating}</span>
                  </div>
                </div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-8">{c.address}</p>
                <a 
                  href={`https://www.google.com/maps/search/cinemas+near+me`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 border border-white/10 rounded-full text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:bg-white group-hover:text-black transition-all block"
                >
                  NAVIGATE TO THEATRE
                </a>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-12">
        <div className="lg:col-span-12 flex flex-col gap-8">
          <div className="flex items-center justify-between border-b border-white/5 pb-8">
            <div className="flex items-center gap-4">
              <Heart className="text-bioluminescence w-8 h-8" />
              <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Collective Echoes</h2>
            </div>
            <span className="text-[10px] font-black text-bioluminescence uppercase tracking-widest">{reviews.length} REVIEWS SUBMERGED</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Post Review */}
            <div className="glass-panel p-10 rounded-[40px] border-white/10 bg-white/5 h-fit">
              {!user ? (
                <div className="text-center py-12 flex flex-col items-center gap-6">
                  <LogIn className="w-12 h-12 text-slate-700" />
                  <p className="text-slate-500 font-black uppercase text-xs tracking-widest italic">Sync with the collective to leave a review.</p>
                  <button type="button" onClick={() => signIn()} className="px-8 py-3 border border-bioluminescence/30 text-bioluminescence rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-bioluminescence/10 transition-all">Join Collective</button>
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="flex flex-col gap-8">
                  <div className="flex flex-col gap-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Your Frequency (Rating)</label>
                    <div className="flex gap-3">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star 
                          key={s}
                          onClick={() => setRating(s)}
                          className={`w-8 h-8 cursor-pointer transition-all ${s <= rating ? 'text-bioluminescence fill-current drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]' : 'text-slate-700 hover:text-slate-500'}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Reflection</label>
                    <textarea 
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="How did the visuals hit you? What did the silence say? Describe the immersion..."
                      className="bg-black/40 border border-white/10 rounded-3xl p-8 text-sm font-medium focus:border-bioluminescence outline-none transition-all min-h-[160px] resize-none"
                    />
                  </div>

                  <button 
                    disabled={submittingReview || !newComment.trim()}
                    type="submit"
                    className="w-full bg-bioluminescence text-black py-5 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50"
                  >
                    {submittingReview ? 'TRANSMITTING...' : 'POST REVIEW'}
                  </button>
                </form>
              )}
            </div>

            {/* Review List */}
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-8">
                {reviews.map((r, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={r.id}
                    className="glass-panel p-8 rounded-[32px] border-white/5 bg-white/[0.02] flex flex-col gap-6 relative group"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden bg-slate-900">
                          {r.userPhoto ? (
                            <img src={r.userPhoto} className="w-full h-full object-cover" alt={r.userName} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-black">{r.userName?.charAt(0)}</div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black uppercase tracking-tight text-white">{r.userName}</span>
                          <div className="flex gap-1 mt-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'text-bioluminescence fill-current' : 'text-slate-800'}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[9px] font-black text-slate-700 uppercase">{r.timestamp?.toDate().toLocaleDateString()}</span>
                        {user?.uid === r.userId && (
                          <Trash2 
                            onClick={() => deleteReview(r.id)}
                            className="w-4 h-4 text-red-500/30 hover:text-red-500 cursor-pointer transition-colors"
                          />
                        )}
                      </div>
                    </div>
                    <p className="text-sm font-medium text-slate-400 leading-relaxed italic pr-4">"{r.comment}"</p>
                  </motion.div>
                ))}
                {reviews.length === 0 && (
                  <div className="py-20 text-center flex flex-col items-center gap-4 border-2 border-dashed border-white/5 rounded-[40px]">
                    <Wind className="w-12 h-12 text-slate-700 mb-2" />
                    <p className="text-slate-500 font-black uppercase text-xs tracking-widest italic leading-relaxed">No echoes yet. The screen is silent. <br/>Be the first to submerge your thoughts.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 p-12 bg-white/5 border border-white/10 rounded-[48px] flex flex-col md:flex-row items-center gap-12 overflow-hidden relative">
         <div className="absolute inset-0 bg-gradient-to-r from-bioluminescence/5 to-transparent pointer-events-none" />
         <div className="relative z-10 text-center md:text-left flex-1">
           <h4 className="text-white font-black uppercase italic tracking-tighter text-4xl mb-6 leading-none">Can't Find a collective?</h4>
           <p className="text-slate-400 text-sm font-medium uppercase tracking-widest leading-relaxed">We're expanding the deep. Sign up for biological alerts when screenings descend on your sector.</p>
         </div>
         <div className="flex items-center gap-4 relative z-10">
            <input 
              placeholder="YOUR BIO-SECTOR (EMAIL)" 
              className="bg-black border border-white/10 rounded-full px-8 py-4 text-[10px] font-black uppercase tracking-widest w-full md:w-64 outline-none focus:border-bioluminescence transition-all"
            />
            <button className="p-4 bg-white text-black rounded-full hover:scale-110 transition-all">
              <ArrowRight className="w-5 h-5" />
            </button>
         </div>
      </div>
    </div>
  );
};

export default function App() {
  const [section, setSection] = useState<Section>('home');
  const [purchase, setPurchase] = useState<any>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Ensure user document exists for credits etc.
        const userRef = doc(db, 'users', u.uid);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
          await setDoc(userRef, {
            displayName: u.displayName,
            photoURL: u.photoURL,
            credits: 0,
            joinedAt: serverTimestamp()
          });
        }
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen pb-32 md:pb-12 md:pt-28 overflow-x-hidden selection:bg-bioluminescence selection:text-black">
      <AnimatePresence>
        {purchase && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glass-panel p-12 rounded-[40px] max-w-lg w-full border border-bioluminescence/30 shadow-[0_0_100px_rgba(0,229,255,0.2)] overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 p-8">
                <X onClick={() => setPurchase(null)} className="text-slate-500 w-8 h-8 cursor-pointer hover:text-white" />
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-bioluminescence/10 flex items-center justify-center mb-8 border border-bioluminescence/30 animate-pulse">
                  <Leaf className="text-bioluminescence w-12 h-12" />
                </div>
                <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white mb-2">Sustainable Receipt</h2>
                <p className="text-slate-400 font-medium mb-12 uppercase tracking-widest text-[10px]">Impact Verified Transaction</p>
                
                <div className="w-full border-y border-white/10 py-8 mb-12 flex flex-col gap-6">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Artifact</span>
                    <span className="text-xl font-black text-white italic uppercase tracking-tight">{purchase.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Price</span>
                    <span className="text-xl font-black text-bioluminescence">${purchase.price}</span>
                  </div>
                  <div className="flex justify-between items-center pt-6 border-t border-white/5">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-bioluminescence italic underline underline-offset-4">Carbon Offset</span>
                    <span className="text-xl font-black text-bioluminescence">{purchase.offset}kg CO2</span>
                  </div>
                </div>

                <div className="bg-bioluminescence/5 p-8 rounded-3xl border border-bioluminescence/20 w-full mb-12">
                   <p className="text-xs text-slate-300 font-medium leading-relaxed">This purchase directly contributes to the <span className="text-bioluminescence font-black italic">Eco-Eilish Climate Fund</span>, supporting deep-sea restoration and sustainable textile innovation.</p>
                </div>

                <button 
                  onClick={() => setPurchase(null)}
                  className="w-full bg-bioluminescence text-black py-6 rounded-full font-black text-xl uppercase tracking-widest glow-cyan hover:scale-105 transition-all"
                >
                  DECRYPT RECEIPT
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    <div className="fixed inset-0 bg-[url('/assets/global_bg.jpg')] bg-cover bg-center opacity-10 pointer-events-none -z-10" />
    <div className="fixed -top-40 -left-40 w-[700px] h-[700px] bg-bioluminescence rounded-full blur-[180px] opacity-[0.08] pointer-events-none z-0" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-blue-900 rounded-full blur-[150px] opacity-[0.1] pointer-events-none z-0" />
      
      <Header user={user} />
      <DesktopNav activeSection={section} setSection={setSection} />
      
      <main className="max-w-[1600px] mx-auto px-6 md:px-16 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={section}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {section === 'home' && <HomeSection setSection={setSection} />}
            {section === 'store' && <StoreSection onPurchase={setPurchase} setSection={setSection} />}
            {section === 'relic' && <RelicSection />}
            {section === 'music' && <MusicSection />}
            {section === 'rewards' && <RewardsSection user={user} />}
            {section === 'cinema' && <CinemaSection user={user} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <MobileNav activeSection={section} setSection={setSection} />

      <footer className="mt-40 border-t border-white/5 py-32 bg-black relative z-10 overflow-hidden">
         <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-20">
           <div className="flex flex-col gap-8">
             <div className="text-[10px] uppercase font-black text-bioluminescence tracking-[1em]">Eco-Eilish</div>
             <p className="text-white/30 text-[10px] uppercase font-black leading-relaxed tracking-wider">A digital collective designed for the next era of sustainable sound and immersive design. Submerge into the currents of the deep.</p>
           </div>
           
           <div className="flex flex-col gap-6">
             <h4 className="text-white font-black uppercase italic tracking-tighter text-sm mb-4">Impact Partners</h4>
             <div className="grid grid-cols-1 gap-4">
               {[
                 { name: 'Support My Charity', url: 'https://supportmycharity.org' },
                 { name: 'Oceanic Global', url: 'https://oceanic.global' },
                 { name: 'REVERB Eco-Action', url: 'https://reverb.org' }
               ].map((c) => (
                 <a 
                  key={c.name}
                  href={c.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center justify-between p-4 bg-white/5 border border-white/5 hover:border-bioluminescence/30 transition-all group"
                 >
                   <span className="text-[10px] font-black uppercase text-white/50 group-hover:text-white transition-colors">{c.name}</span>
                   <ExternalLink className="w-4 h-4 text-white/20 group-hover:text-bioluminescence" />
                 </a>
               ))}
             </div>
           </div>

           <div className="flex flex-col gap-6">
             <h4 className="text-white font-black uppercase italic tracking-tighter text-sm mb-4">Nav Protocol</h4>
             <div className="flex flex-col gap-4 text-[9px] uppercase font-black tracking-[0.3em] text-white/30">
               <a href="#" className="hover:text-bioluminescence transition-colors">Sustainability Report</a>
               <a href="#" className="hover:text-bioluminescence transition-colors">Carbon Offset</a>
               <a href="#" className="hover:text-bioluminescence transition-colors">Global Outreach</a>
             </div>
           </div>
         </div>
         <div className="mt-24 text-center border-t border-white/5 pt-12">
            <p className="text-[8px] uppercase tracking-widest text-white/10">© 2024 Eco-Eilish Collective. ALL RIGHTS RESERVED.</p>
         </div>
      </footer>
    </div>
  );
}
