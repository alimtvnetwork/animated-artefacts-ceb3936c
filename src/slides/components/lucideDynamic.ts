/**
 * Dynamic lucide icon resolver — JSON-safe replacement for the
 * `icons` namespace from lucide-react.
 *
 * Why this exists: `import { icons } from 'lucide-react'` pulls every icon
 * (~1500, ~688 KB raw / 115 KB gzip) into the bundle because it's a
 * `import * as icons` namespace re-export — Rollup can't tree-shake it.
 *
 * Capsules need to resolve PascalCase icon names ("Compass", "Github")
 * authored in deck JSON. Instead of pre-importing all icons, we maintain
 * an explicit allow-list of icons used by capsules across the codebase
 * and resolve them statically. New icons need to be added here once —
 * a tiny price for a ~600 KB bundle saving.
 *
 * If a JSON deck names an icon outside this allow-list, the capsule
 * silently renders without an icon (existing fallback behavior in
 * `Capsule.tsx`). Author warning surfaces via the existing dev console
 * pathways in the loader.
 */
import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';

// Curated capsule allow-list. Mirror entries from the ambient registry +
// any icons a deck might name in a capsule. Keep alphabetical for diffs.
import Activity from 'lucide-react/dist/esm/icons/activity.js';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right.js';
import ArrowUpRight from 'lucide-react/dist/esm/icons/arrow-up-right.js';
import Award from 'lucide-react/dist/esm/icons/award.js';
import Book from 'lucide-react/dist/esm/icons/book.js';
import Boxes from 'lucide-react/dist/esm/icons/boxes.js';
import Braces from 'lucide-react/dist/esm/icons/braces.js';
import Bug from 'lucide-react/dist/esm/icons/bug.js';
import Calendar from 'lucide-react/dist/esm/icons/calendar.js';
import Check from 'lucide-react/dist/esm/icons/check.js';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle.js';
import CheckCircle2 from 'lucide-react/dist/esm/icons/circle-check-big.js';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right.js';
import Clipboard from 'lucide-react/dist/esm/icons/clipboard.js';
import Cloud from 'lucide-react/dist/esm/icons/cloud.js';
import Code2 from 'lucide-react/dist/esm/icons/code-xml.js';
import Compass from 'lucide-react/dist/esm/icons/compass.js';
import Container from 'lucide-react/dist/esm/icons/container.js';
import Cpu from 'lucide-react/dist/esm/icons/cpu.js';
import Database from 'lucide-react/dist/esm/icons/database.js';
import FileText from 'lucide-react/dist/esm/icons/file-text.js';
import Figma from 'lucide-react/dist/esm/icons/figma.js';
import Flag from 'lucide-react/dist/esm/icons/flag.js';
import GitBranch from 'lucide-react/dist/esm/icons/git-branch.js';
import Github from 'lucide-react/dist/esm/icons/github.js';
import Hammer from 'lucide-react/dist/esm/icons/hammer.js';
import Heart from 'lucide-react/dist/esm/icons/heart.js';
import Layers from 'lucide-react/dist/esm/icons/layers.js';
import Lightbulb from 'lucide-react/dist/esm/icons/lightbulb.js';
import Link from 'lucide-react/dist/esm/icons/link.js';
import Lock from 'lucide-react/dist/esm/icons/lock.js';
import Mail from 'lucide-react/dist/esm/icons/mail.js';
import MessageSquare from 'lucide-react/dist/esm/icons/message-square.js';
import Phone from 'lucide-react/dist/esm/icons/phone.js';
import Pin from 'lucide-react/dist/esm/icons/pin.js';
import Play from 'lucide-react/dist/esm/icons/play.js';
import Rocket from 'lucide-react/dist/esm/icons/rocket.js';
import Settings from 'lucide-react/dist/esm/icons/settings.js';
import Shield from 'lucide-react/dist/esm/icons/shield.js';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles.js';
import Star from 'lucide-react/dist/esm/icons/star.js';
import Target from 'lucide-react/dist/esm/icons/target.js';
import Terminal from 'lucide-react/dist/esm/icons/terminal.js';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up.js';
import UserCheck from 'lucide-react/dist/esm/icons/user-check.js';
import Users from 'lucide-react/dist/esm/icons/users.js';
import Video from 'lucide-react/dist/esm/icons/video.js';
import Workflow from 'lucide-react/dist/esm/icons/workflow.js';
import Zap from 'lucide-react/dist/esm/icons/zap.js';
import Globe from 'lucide-react/dist/esm/icons/globe.js';

/** PascalCase name → component. */
export const CAPSULE_ICON_REGISTRY: Record<string, ComponentType<LucideProps>> = {
  Activity, ArrowRight, ArrowUpRight, Award,
  Book, Boxes, Braces, Bug,
  Calendar, Check, CheckCircle, CheckCircle2, ChevronRight, Clipboard, Cloud,
  Code2, Compass, Container, Cpu,
  Database,
  FileText, Figma, Flag,
  GitBranch, Github, Globe,
  Hammer, Heart,
  Layers, Lightbulb, Link, Lock,
  Mail, MessageSquare,
  Phone, Pin, Play,
  Rocket,
  Settings, Shield, Sparkles, Star,
  Target, Terminal, TrendingUp,
  UserCheck, Users,
  Video,
  Workflow,
  Zap,
};

export function resolveLucideIcon(name?: string): ComponentType<LucideProps> | null {
  if (!name) return null;
  return CAPSULE_ICON_REGISTRY[name] ?? null;
}
