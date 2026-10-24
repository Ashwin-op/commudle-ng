import {
  IconDefinition,
  faBolt,
  faBuilding,
  faCalendar,
  faChartLine,
  faCheck,
  faCircle,
  faCode,
  faGlobe,
  faGraduationCap,
  faHeart,
  faLightbulb,
  faLink,
  faQrcode,
  faRocket,
  faShareNodes,
  faShieldHalved,
  faTag,
  faTrophy,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';

/**
 * Shared string-keyed icon lookup for page sections whose config carries an
 * icon *name* (plain content) rather than an icon object. Keeps section
 * configs free of Angular / FontAwesome imports.
 *
 * Unknown keys resolve to `faCircle` via {@link resolveSectionIcon} so a bad
 * config value can never break rendering.
 */
export const SECTION_ICON_MAP: Record<string, IconDefinition> = {
  bolt: faBolt,
  building: faBuilding,
  calendar: faCalendar,
  chart: faChartLine,
  check: faCheck,
  code: faCode,
  globe: faGlobe,
  graduationCap: faGraduationCap,
  heart: faHeart,
  lightbulb: faLightbulb,
  link: faLink,
  qrcode: faQrcode,
  rocket: faRocket,
  shareNodes: faShareNodes,
  shield: faShieldHalved,
  tag: faTag,
  trophy: faTrophy,
  users: faUsers,
};

export type SectionIconKey = keyof typeof SECTION_ICON_MAP;

export const SECTION_ICON_FALLBACK: IconDefinition = faCircle;

export function resolveSectionIcon(key: string | undefined): IconDefinition {
  return (key && SECTION_ICON_MAP[key]) || SECTION_ICON_FALLBACK;
}
