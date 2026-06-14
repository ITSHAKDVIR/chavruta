/**
 * Centralized icon component.
 *
 * Backed by lucide-react-native (thin-line outline style, 2px stroke,
 * rounded caps). All icons share the same visual weight and grid so
 * mixing them across the app looks consistent.
 *
 * Usage:
 *   <Icon name="clock" size={24} />
 *   <Icon name="book" size={32} color={colors.primary} />
 */
import React from 'react';
import {
  Clock, BookOpen, MapPin, Calendar, Wrench, Home, Settings, Bell,
  Search, Menu, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  X, Plus, Minus, Check, Info, AlertTriangle, AlertCircle,
  Heart, Star, Flame, Sparkles, Moon, MoonStar, Sun, Sunrise, Sunset,
  Camera, Image as ImageIcon, Mic, Volume2, VolumeX, Play, Pause,
  Trash2, Share2, Copy, Download, Upload, ExternalLink, Link,
  User, Users, MessageCircle, Phone, Mail,
  Compass, Navigation, Map, Globe,
  Ruler, Scale, Hash, Percent,
  Coffee, Wheat, Beef, Fish, Apple, Droplet, Wine, Utensils,
  ScrollText, FileText, Notebook, Library, GraduationCap,
  Lock, Unlock, Eye, EyeOff,
  Award, Trophy, Bookmark,
  CheckCircle2, XCircle, HelpCircle, MoreHorizontal, MoreVertical,
  Filter, ArrowRight, ArrowLeft, ArrowUp, ArrowDown,
  Cog, RotateCw, RefreshCw, Save,
  CalendarDays, CalendarClock, Timer,
  Building2, Building, Tent,
  Cpu, Zap,
  // ─── New icons for unique-per-tool cluster (chavruta 2.9.0) ───
  CloudRain, CloudSunRain, CloudMoon,
  Feather, Bird, Bandage, HeartHandshake, UsersRound,
  Unlink, Coins, CookingPot, Citrus, Leaf, Palmtree, ShieldHalf, Trees,
  VenetianMask, Music2, Flashlight, UtensilsCrossed,
  Waves, ListChecks, CheckCheck, Bug, Brush, LeafyGreen, Calculator,
  Croissant, Sprout, Flower, Flower2,
  Layers, BookText, LibraryBig, Puzzle, History, Target, BookMarked,
  PenLine, MessagesSquare,
  Baby, CircleDollarSign, HeartPulse, HeartCrack, BookHeart,
  Car, Droplets, MapPinned,
  Cake, PiggyBank, MessageSquareOff, PhoneCall,
} from 'lucide-react-native';

export const ICONS = {
  // Navigation / system
  clock: Clock, zmanim: Clock,
  book: BookOpen, learn: BookOpen,
  pin: MapPin, location: MapPin,
  calendar: Calendar,
  calendarHebrew: CalendarDays,
  calendarTime: CalendarClock,
  wrench: Wrench, tools: Wrench,
  home: Home,
  settings: Settings, cog: Cog,
  bell: Bell, notification: Bell,
  search: Search,
  menu: Menu,

  // Arrows / chevrons
  chevronLeft: ChevronLeft, chevronRight: ChevronRight,
  chevronDown: ChevronDown, chevronUp: ChevronUp,
  arrowRight: ArrowRight, arrowLeft: ArrowLeft,
  arrowUp: ArrowUp, arrowDown: ArrowDown,

  // Basic actions
  close: X, plus: Plus, minus: Minus, check: Check,
  info: Info, warning: AlertTriangle, alert: AlertCircle,
  more: MoreHorizontal, moreVertical: MoreVertical,
  filter: Filter,

  // Status
  checkCircle: CheckCircle2, xCircle: XCircle, helpCircle: HelpCircle,

  // Time / nature
  moon: Moon, moonStar: MoonStar,
  sun: Sun, sunrise: Sunrise, sunset: Sunset,
  flame: Flame, candle: Flame,
  sparkles: Sparkles, timer: Timer,
  cloudRain: CloudRain, cloudSunRain: CloudSunRain, cloudMoon: CloudMoon,

  // Media
  camera: Camera, image: ImageIcon,
  mic: Mic, volume: Volume2, mute: VolumeX,
  play: Play, pause: Pause,
  flashlight: Flashlight,

  // File ops
  trash: Trash2, share: Share2, copy: Copy,
  download: Download, upload: Upload,
  externalLink: ExternalLink, link: Link,
  save: Save, refresh: RefreshCw, rotate: RotateCw,
  unlink: Unlink,

  // People / contact
  user: User, users: Users, usersRound: UsersRound,
  message: MessageCircle, phone: Phone, mail: Mail,
  messagesSquare: MessagesSquare, messageSquareOff: MessageSquareOff,
  phoneCall: PhoneCall,
  heartHandshake: HeartHandshake,

  // Map / navigation
  compass: Compass, navigate: Navigation,
  map: Map, globe: Globe, mapPinned: MapPinned, car: Car,

  // Measurement / calc
  ruler: Ruler, scale: Scale, hash: Hash, percent: Percent,
  calculator: Calculator,

  // Food / kashrut
  coffee: Coffee, wheat: Wheat, leafyGreen: LeafyGreen,
  meat: Beef, beef: Beef,
  fish: Fish, fruit: Apple, apple: Apple,
  water: Droplet, droplet: Droplet, droplets: Droplets,
  wine: Wine, utensils: Utensils, utensilsCrossed: UtensilsCrossed,
  bread: Croissant, croissant: Croissant,
  bug: Bug, brush: Brush, cookingPot: CookingPot,
  cake: Cake,

  // Plants / nature
  leaf: Leaf, citrus: Citrus, palmtree: Palmtree,
  trees: Trees, flower: Flower, flower2: Flower2,
  sprout: Sprout, feather: Feather, bird: Bird,
  waves: Waves,

  // Learning / texts
  scroll: ScrollText, scrollText: ScrollText,
  document: FileText, notebook: Notebook,
  library: Library, libraryBig: LibraryBig,
  graduation: GraduationCap, graduationCap: GraduationCap,
  bookText: BookText, bookMarked: BookMarked, bookHeart: BookHeart,
  penLine: PenLine, layers: Layers, puzzle: Puzzle,
  history: History, target: Target, listChecks: ListChecks,
  checkCheck: CheckCheck,

  // Privacy
  lock: Lock, unlock: Unlock, eye: Eye, eyeOff: EyeOff,

  // Achievement
  award: Award, trophy: Trophy, bookmark: Bookmark,
  star: Star, heart: Heart, heartPulse: HeartPulse, heartCrack: HeartCrack,

  // Misc
  building: Building2, building2: Building2, smallBuilding: Building,
  tent: Tent, venetianMask: VenetianMask, mask: VenetianMask,
  bandage: Bandage,
  coins: Coins, circleDollarSign: CircleDollarSign, piggyBank: PiggyBank,
  music2: Music2,
  shieldHalf: ShieldHalf,
  cpu: Cpu, ai: Sparkles, bolt: Zap,
} as const;

export type IconName = keyof typeof ICONS;

type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export function Icon({ name, size = 24, color = '#FFFFFF', strokeWidth = 1.75 }: IconProps) {
  const LucideComponent = ICONS[name];
  if (!LucideComponent) {
    if (__DEV__) {
      console.warn(`[Icon] Unknown icon name: "${name}"`);
    }
    return null;
  }
  return <LucideComponent size={size} color={color} strokeWidth={strokeWidth} />;
}
