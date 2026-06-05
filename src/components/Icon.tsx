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
 *
 * Adding a new icon:
 *   1. Find the icon at https://lucide.dev/icons/
 *   2. Add it to ICONS below as: `iconName: LucideIconName`
 *
 * The reason we wrap rather than importing Lucide directly everywhere:
 *   - Single source of truth — easy to swap icon library later
 *   - Default size, stroke-width, and color in one place
 *   - String-based names avoid 200+ imports across the codebase
 */
import React from 'react';
import {
  Clock, BookOpen, MapPin, Calendar, Wrench, Home, Settings, Bell,
  Search, Menu, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  X, Plus, Minus, Check, Info, AlertTriangle, AlertCircle,
  Heart, Star, Flame, Sparkles, Moon, Sun, Sunrise, Sunset,
  Camera, Image as ImageIcon, Mic, Volume2, VolumeX, Play, Pause,
  Trash2, Share2, Copy, Download, Upload, ExternalLink, Link,
  User, Users, MessageCircle, Phone, Mail,
  Compass, Navigation, Map, Globe,
  Ruler, Scale, Hash, Hash as Pound, Percent,
  Coffee, Wheat, Beef, Fish, Apple, Droplet, Wine, Utensils,
  ScrollText, FileText, Notebook, Library, GraduationCap,
  Lock, Unlock, Eye, EyeOff,
  Award, Trophy, Bookmark,
  CheckCircle2, XCircle, HelpCircle, MoreHorizontal, MoreVertical,
  Filter, ArrowRight, ArrowLeft, ArrowUp, ArrowDown,
  Cog, RotateCw, RefreshCw, Save,
  CalendarDays, CalendarClock, Timer,
  Building2, Building, Tent, Church,
  Cpu, Zap, Eye as Search2,
} from 'lucide-react-native';

// Map our app-specific icon keys → Lucide components.
// Keys are written in semantic terms ("zmanim", "learn") so screens don't
// need to know the underlying Lucide name.
export const ICONS = {
  // Navigation / system
  clock: Clock,
  zmanim: Clock,
  book: BookOpen,
  learn: BookOpen,
  pin: MapPin,
  location: MapPin,
  calendar: Calendar,
  calendarHebrew: CalendarDays,
  calendarTime: CalendarClock,
  wrench: Wrench,
  tools: Wrench,
  home: Home,
  settings: Settings,
  cog: Cog,
  bell: Bell,
  notification: Bell,
  search: Search,
  menu: Menu,

  // Arrows / chevrons
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  arrowRight: ArrowRight,
  arrowLeft: ArrowLeft,
  arrowUp: ArrowUp,
  arrowDown: ArrowDown,

  // Basic actions
  close: X,
  plus: Plus,
  minus: Minus,
  check: Check,
  info: Info,
  warning: AlertTriangle,
  alert: AlertCircle,
  more: MoreHorizontal,
  moreVertical: MoreVertical,
  filter: Filter,

  // Status
  checkCircle: CheckCircle2,
  xCircle: XCircle,
  helpCircle: HelpCircle,

  // Time / nature (zmanim section)
  moon: Moon,
  sun: Sun,
  sunrise: Sunrise,
  sunset: Sunset,
  flame: Flame,
  candle: Flame,
  sparkles: Sparkles,
  timer: Timer,

  // Media
  camera: Camera,
  image: ImageIcon,
  mic: Mic,
  volume: Volume2,
  mute: VolumeX,
  play: Play,
  pause: Pause,

  // File ops
  trash: Trash2,
  share: Share2,
  copy: Copy,
  download: Download,
  upload: Upload,
  externalLink: ExternalLink,
  link: Link,
  save: Save,
  refresh: RefreshCw,
  rotate: RotateCw,

  // People / contact
  user: User,
  users: Users,
  message: MessageCircle,
  phone: Phone,
  mail: Mail,

  // Map / navigation
  compass: Compass,
  navigate: Navigation,
  map: Map,
  globe: Globe,

  // Measurement
  ruler: Ruler,
  scale: Scale,
  hash: Hash,
  percent: Percent,

  // Food / kashrut
  coffee: Coffee,
  wheat: Wheat,
  meat: Beef,
  fish: Fish,
  fruit: Apple,
  water: Droplet,
  wine: Wine,
  utensils: Utensils,

  // Learning / texts
  scroll: ScrollText,
  document: FileText,
  notebook: Notebook,
  library: Library,
  graduation: GraduationCap,

  // Privacy
  lock: Lock,
  unlock: Unlock,
  eye: Eye,
  eyeOff: EyeOff,

  // Achievement
  award: Award,
  trophy: Trophy,
  bookmark: Bookmark,
  star: Star,
  heart: Heart,

  // Buildings (synagogue / mikvah / sukkah)
  building: Building2,
  smallBuilding: Building,
  tent: Tent,
  shul: Church,

  // Misc
  cpu: Cpu,
  ai: Sparkles,
  bolt: Zap,
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
    // Unknown icon — render nothing rather than crash. Caller will see a gap.
    if (__DEV__) {
      console.warn(`[Icon] Unknown icon name: "${name}"`);
    }
    return null;
  }
  return <LucideComponent size={size} color={color} strokeWidth={strokeWidth} />;
}
