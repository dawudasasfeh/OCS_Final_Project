import {
  ArrowRight, Bath, BedDouble, Calendar, ChevronDown, ChevronLeft, ChevronRight,
  Clock, Heart, Mail, MapPin, MessageCircle, Phone, Scaling, Search, Sofa, X,
} from "lucide-react";

/**
 * Every icon in the app comes through here.
 *
 * The page was using whatever glyph happened to be in the font — ✉ ☎ ⌂ ◷ for
 * the contact details, ♡ for the wishlist, ▾ for the account menu, and a
 * colour emoji (💬) for WhatsApp. Three problems with that: ⌂ and ◷ render
 * completely differently on Windows, macOS and Android; an emoji is coloured
 * art on a phone and a flat dingbat on Windows, so the same button looked like
 * two different designs; and none of them share a stroke weight or an optical
 * size with any of the others, which is what made the set read as ugly rather
 * than any one of them being wrong.
 *
 * Lucide rather than react-icons on purpose. react-icons is a bag of a dozen
 * different families — Font Awesome next to Material next to Bootstrap — and
 * mixing families is exactly how you get the problem we are fixing. Lucide is
 * one family drawn on one 24px grid at one stroke weight, so icons picked
 * independently still look like a set.
 *
 * 1.75 rather than Lucide's default 2: at the sizes used here 2 reads heavier
 * than the surrounding text, and the design system is a light one.
 */
const STROKE = 1.75;

function make(Glyph, { directional = false } = {}) {
  return function Icon({ size = 18, className = "", ...rest }) {
    const classes = [directional ? "icon-dir" : "", className].filter(Boolean).join(" ");
    return (
      <Glyph
        size={size}
        strokeWidth={STROKE}
        className={classes || undefined}
        aria-hidden="true"
        focusable="false"
        {...rest}
      />
    );
  };
}

/* Directional ones carry .icon-dir, which the stylesheet mirrors under
   :root.rtl. A chevron meaning "next" has to point the way the language
   reads, and transform has no idea which way that is. */
export const IconNext = make(ChevronRight, { directional: true });
export const IconPrev = make(ChevronLeft, { directional: true });
export const IconArrow = make(ArrowRight, { directional: true });

export const IconCaret = make(ChevronDown);
export const IconClose = make(X);
export const IconMail = make(Mail);
export const IconPhone = make(Phone);
export const IconChat = make(MessageCircle);
export const IconPlace = make(MapPin);
export const IconClock = make(Clock);
export const IconSearch = make(Search);
export const IconCalendar = make(Calendar);
export const IconBeds = make(BedDouble);
export const IconBaths = make(Bath);
export const IconArea = make(Scaling);
export const IconFurnished = make(Sofa);

/**
 * The wishlist heart, which is the one icon with two states. Lucide strokes
 * rather than fills by default, so "saved" fills the path with the same colour
 * the stroke already uses — an outline and a solid of the same shape, which is
 * the convention every listing site uses and needs no second glyph.
 */
export function IconHeart({ filled = false, size = 18, className = "", ...rest }) {
  return (
    <Heart
      size={size}
      strokeWidth={STROKE}
      fill={filled ? "currentColor" : "none"}
      className={className || undefined}
      aria-hidden="true"
      focusable="false"
      {...rest}
    />
  );
}
