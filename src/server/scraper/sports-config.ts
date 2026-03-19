export interface SportConfig {
  /** Canonical name stored in our DB (e.g. "Football", "Men's Basketball") */
  name: string
  /**
   * URL slugs to try, in order of preference.
   * The scraper tries each slug until it gets a 200 response.
   * Most schools follow Sidearm Sports conventions.
   */
  slugs: string[]
}

export const SPORTS: SportConfig[] = [
  // ─── Revenue sports ──────────────────────────────────────────────────────────
  {
    name: 'Football',
    slugs: ['football'],
  },
  {
    name: "Men's Basketball",
    slugs: ['mens-basketball', 'men-s-basketball', 'mbasketball', 'basketball'],
  },
  {
    name: "Women's Basketball",
    slugs: ['womens-basketball', 'women-s-basketball', 'wbasketball'],
  },

  // ─── Baseball / Softball ─────────────────────────────────────────────────────
  {
    name: 'Baseball',
    slugs: ['baseball'],
  },
  {
    name: 'Softball',
    slugs: ['softball'],
  },

  // ─── Soccer ──────────────────────────────────────────────────────────────────
  {
    name: "Men's Soccer",
    slugs: ['mens-soccer', 'men-s-soccer', 'msoccer'],
  },
  {
    name: "Women's Soccer",
    slugs: ['womens-soccer', 'women-s-soccer', 'wsoccer'],
  },

  // ─── Volleyball ──────────────────────────────────────────────────────────────
  {
    name: 'Volleyball',
    slugs: ['volleyball', 'womens-volleyball', 'women-s-volleyball', 'wvolleyball'],
  },
  {
    name: "Men's Volleyball",
    slugs: ['mens-volleyball', 'men-s-volleyball', 'mvolleyball'],
  },
  {
    name: 'Beach Volleyball',
    slugs: ['beach-volleyball', 'bvolleyball'],
  },

  // ─── Tennis ──────────────────────────────────────────────────────────────────
  {
    name: "Men's Tennis",
    slugs: ['mens-tennis', 'men-s-tennis', 'mtennis'],
  },
  {
    name: "Women's Tennis",
    slugs: ['womens-tennis', 'women-s-tennis', 'wtennis'],
  },

  // ─── Golf ─────────────────────────────────────────────────────────────────────
  {
    name: "Men's Golf",
    slugs: ['mens-golf', 'men-s-golf', 'mgolf'],
  },
  {
    name: "Women's Golf",
    slugs: ['womens-golf', 'women-s-golf', 'wgolf'],
  },

  // ─── Track & Field / Cross Country ───────────────────────────────────────────
  {
    name: "Men's Track & Field",
    slugs: ['mens-track-and-field', 'mens-track-field', 'men-s-track-and-field', 'mtrack', 'mens-indoor-track-and-field'],
  },
  {
    name: "Women's Track & Field",
    slugs: ['womens-track-and-field', 'womens-track-field', 'women-s-track-and-field', 'wtrack', 'womens-indoor-track-and-field'],
  },
  {
    name: "Men's Cross Country",
    slugs: ['mens-cross-country', 'men-s-cross-country', 'mcross-country'],
  },
  {
    name: "Women's Cross Country",
    slugs: ['womens-cross-country', 'women-s-cross-country', 'wcross-country'],
  },

  // ─── Swimming & Diving ────────────────────────────────────────────────────────
  {
    name: "Men's Swimming & Diving",
    slugs: ['mens-swimming-and-diving', 'mens-swimming-diving', 'men-s-swimming-and-diving', 'mswimming'],
  },
  {
    name: "Women's Swimming & Diving",
    slugs: ['womens-swimming-and-diving', 'womens-swimming-diving', 'women-s-swimming-and-diving', 'wswimming'],
  },

  // ─── Gymnastics ───────────────────────────────────────────────────────────────
  {
    name: "Men's Gymnastics",
    slugs: ['mens-gymnastics', 'men-s-gymnastics', 'mgymnastics'],
  },
  {
    name: "Women's Gymnastics",
    slugs: ['womens-gymnastics', 'women-s-gymnastics', 'wgymnastics', 'gymnastics'],
  },

  // ─── Lacrosse ─────────────────────────────────────────────────────────────────
  {
    name: "Men's Lacrosse",
    slugs: ['mens-lacrosse', 'men-s-lacrosse', 'mlacrosse'],
  },
  {
    name: "Women's Lacrosse",
    slugs: ['womens-lacrosse', 'women-s-lacrosse', 'wlacrosse'],
  },

  // ─── Field Hockey ─────────────────────────────────────────────────────────────
  {
    name: 'Field Hockey',
    slugs: ['field-hockey', 'fieldhockey'],
  },

  // ─── Ice Hockey ───────────────────────────────────────────────────────────────
  {
    name: "Men's Ice Hockey",
    slugs: ['mens-ice-hockey', 'men-s-ice-hockey', 'mice-hockey', 'hockey'],
  },
  {
    name: "Women's Ice Hockey",
    slugs: ['womens-ice-hockey', 'women-s-ice-hockey', 'wice-hockey'],
  },

  // ─── Wrestling ────────────────────────────────────────────────────────────────
  {
    name: 'Wrestling',
    slugs: ['wrestling'],
  },

  // ─── Rowing ───────────────────────────────────────────────────────────────────
  {
    name: 'Rowing',
    slugs: ['rowing', 'womens-rowing', 'crew'],
  },

  // ─── Water Polo ───────────────────────────────────────────────────────────────
  {
    name: "Men's Water Polo",
    slugs: ['mens-water-polo', 'men-s-water-polo', 'mwater-polo'],
  },
  {
    name: "Women's Water Polo",
    slugs: ['womens-water-polo', 'women-s-water-polo', 'wwater-polo', 'water-polo'],
  },
]

/** Find a sport config by canonical name (case-insensitive) */
export function findSport(name: string): SportConfig | undefined {
  const n = name.toLowerCase()
  return SPORTS.find(s => s.name.toLowerCase() === n)
}
