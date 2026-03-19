export interface NcaaSchool {
  /** Must match the `name` column in the `schools` table */
  name: string
  shortName: string
  conference: 'Big Ten' | 'SEC' | 'Big 12' | 'ACC'
  /** Athletics site domain (no trailing slash) */
  domain: string
  /**
   * Roster URL template. Use `{sport}` as the slug placeholder.
   * Most schools use the Sidearm Sports platform:
   *   https://{domain}/sports/{sport}/roster
   */
  rosterUrlTemplate: string
}

function sidearm(domain: string): string {
  return `https://${domain}/sports/{sport}/roster`
}

export const NCAA_SCHOOLS: NcaaSchool[] = [
  // ─── Big Ten (18) ───────────────────────────────────────────────────────────
  { name: 'University of Michigan', shortName: 'Michigan', conference: 'Big Ten', domain: 'mgoblue.com', rosterUrlTemplate: sidearm('mgoblue.com') },
  { name: 'Ohio State University', shortName: 'Ohio State', conference: 'Big Ten', domain: 'ohiostatebuckeyes.com', rosterUrlTemplate: sidearm('ohiostatebuckeyes.com') },
  { name: 'Penn State University', shortName: 'Penn State', conference: 'Big Ten', domain: 'gopsusports.com', rosterUrlTemplate: sidearm('gopsusports.com') },
  { name: 'Michigan State University', shortName: 'Michigan State', conference: 'Big Ten', domain: 'msuspartans.com', rosterUrlTemplate: sidearm('msuspartans.com') },
  { name: 'University of Wisconsin', shortName: 'Wisconsin', conference: 'Big Ten', domain: 'uwbadgers.com', rosterUrlTemplate: sidearm('uwbadgers.com') },
  { name: 'University of Iowa', shortName: 'Iowa', conference: 'Big Ten', domain: 'hawkeyesports.com', rosterUrlTemplate: sidearm('hawkeyesports.com') },
  { name: 'University of Nebraska', shortName: 'Nebraska', conference: 'Big Ten', domain: 'huskers.com', rosterUrlTemplate: sidearm('huskers.com') },
  { name: 'University of Minnesota', shortName: 'Minnesota', conference: 'Big Ten', domain: 'gophersports.com', rosterUrlTemplate: sidearm('gophersports.com') },
  { name: 'University of Illinois', shortName: 'Illinois', conference: 'Big Ten', domain: 'fightingillini.com', rosterUrlTemplate: sidearm('fightingillini.com') },
  { name: 'Indiana University', shortName: 'Indiana', conference: 'Big Ten', domain: 'iuhoosiers.com', rosterUrlTemplate: sidearm('iuhoosiers.com') },
  { name: 'Purdue University', shortName: 'Purdue', conference: 'Big Ten', domain: 'purduesports.com', rosterUrlTemplate: sidearm('purduesports.com') },
  { name: 'Northwestern University', shortName: 'Northwestern', conference: 'Big Ten', domain: 'nusports.com', rosterUrlTemplate: sidearm('nusports.com') },
  { name: 'University of Maryland', shortName: 'Maryland', conference: 'Big Ten', domain: 'umterps.com', rosterUrlTemplate: sidearm('umterps.com') },
  { name: 'Rutgers University', shortName: 'Rutgers', conference: 'Big Ten', domain: 'scarletknights.com', rosterUrlTemplate: sidearm('scarletknights.com') },
  { name: 'UCLA', shortName: 'UCLA', conference: 'Big Ten', domain: 'uclabruins.com', rosterUrlTemplate: sidearm('uclabruins.com') },
  { name: 'University of Southern California', shortName: 'USC', conference: 'Big Ten', domain: 'usctrojans.com', rosterUrlTemplate: sidearm('usctrojans.com') },
  { name: 'University of Washington', shortName: 'Washington', conference: 'Big Ten', domain: 'gohuskies.com', rosterUrlTemplate: sidearm('gohuskies.com') },
  { name: 'University of Oregon', shortName: 'Oregon', conference: 'Big Ten', domain: 'goducks.com', rosterUrlTemplate: sidearm('goducks.com') },

  // ─── SEC (16) ────────────────────────────────────────────────────────────────
  { name: 'University of Alabama', shortName: 'Alabama', conference: 'SEC', domain: 'rolltide.com', rosterUrlTemplate: sidearm('rolltide.com') },
  { name: 'University of Georgia', shortName: 'Georgia', conference: 'SEC', domain: 'georgiadogs.com', rosterUrlTemplate: sidearm('georgiadogs.com') },
  { name: 'University of Florida', shortName: 'Florida', conference: 'SEC', domain: 'floridagators.com', rosterUrlTemplate: sidearm('floridagators.com') },
  { name: 'University of Tennessee', shortName: 'Tennessee', conference: 'SEC', domain: 'utsports.com', rosterUrlTemplate: sidearm('utsports.com') },
  { name: 'Louisiana State University', shortName: 'LSU', conference: 'SEC', domain: 'lsusports.net', rosterUrlTemplate: sidearm('lsusports.net') },
  { name: 'Texas A&M University', shortName: 'Texas A&M', conference: 'SEC', domain: '12thman.com', rosterUrlTemplate: sidearm('12thman.com') },
  { name: 'Auburn University', shortName: 'Auburn', conference: 'SEC', domain: 'auburntigers.com', rosterUrlTemplate: sidearm('auburntigers.com') },
  { name: 'Mississippi State University', shortName: 'Mississippi State', conference: 'SEC', domain: 'hailstate.com', rosterUrlTemplate: sidearm('hailstate.com') },
  { name: 'University of Mississippi', shortName: 'Ole Miss', conference: 'SEC', domain: 'olemisssports.com', rosterUrlTemplate: sidearm('olemisssports.com') },
  { name: 'University of Arkansas', shortName: 'Arkansas', conference: 'SEC', domain: 'arkansasrazorbacks.com', rosterUrlTemplate: sidearm('arkansasrazorbacks.com') },
  { name: 'University of Missouri', shortName: 'Missouri', conference: 'SEC', domain: 'mutigers.com', rosterUrlTemplate: sidearm('mutigers.com') },
  { name: 'University of Kentucky', shortName: 'Kentucky', conference: 'SEC', domain: 'ukathletics.com', rosterUrlTemplate: sidearm('ukathletics.com') },
  { name: 'University of South Carolina', shortName: 'South Carolina', conference: 'SEC', domain: 'gamecocksonline.com', rosterUrlTemplate: sidearm('gamecocksonline.com') },
  { name: 'Vanderbilt University', shortName: 'Vanderbilt', conference: 'SEC', domain: 'vucommodores.com', rosterUrlTemplate: sidearm('vucommodores.com') },
  { name: 'University of Texas', shortName: 'Texas', conference: 'SEC', domain: 'texassports.com', rosterUrlTemplate: sidearm('texassports.com') },
  { name: 'University of Oklahoma', shortName: 'Oklahoma', conference: 'SEC', domain: 'soonersports.com', rosterUrlTemplate: sidearm('soonersports.com') },

  // ─── Big 12 (16) ─────────────────────────────────────────────────────────────
  { name: 'University of Kansas', shortName: 'Kansas', conference: 'Big 12', domain: 'kuathletics.com', rosterUrlTemplate: sidearm('kuathletics.com') },
  { name: 'Kansas State University', shortName: 'Kansas State', conference: 'Big 12', domain: 'kstatesports.com', rosterUrlTemplate: sidearm('kstatesports.com') },
  { name: 'Oklahoma State University', shortName: 'Oklahoma State', conference: 'Big 12', domain: 'okstate.com', rosterUrlTemplate: sidearm('okstate.com') },
  { name: 'Iowa State University', shortName: 'Iowa State', conference: 'Big 12', domain: 'cyclones.com', rosterUrlTemplate: sidearm('cyclones.com') },
  { name: 'Texas Christian University', shortName: 'TCU', conference: 'Big 12', domain: 'gofrogs.com', rosterUrlTemplate: sidearm('gofrogs.com') },
  { name: 'Baylor University', shortName: 'Baylor', conference: 'Big 12', domain: 'baylorbears.com', rosterUrlTemplate: sidearm('baylorbears.com') },
  { name: 'Texas Tech University', shortName: 'Texas Tech', conference: 'Big 12', domain: 'texastech.com', rosterUrlTemplate: sidearm('texastech.com') },
  { name: 'West Virginia University', shortName: 'West Virginia', conference: 'Big 12', domain: 'wvusports.com', rosterUrlTemplate: sidearm('wvusports.com') },
  { name: 'University of Cincinnati', shortName: 'Cincinnati', conference: 'Big 12', domain: 'gobearcats.com', rosterUrlTemplate: sidearm('gobearcats.com') },
  { name: 'University of Central Florida', shortName: 'UCF', conference: 'Big 12', domain: 'ucfknights.com', rosterUrlTemplate: sidearm('ucfknights.com') },
  { name: 'University of Houston', shortName: 'Houston', conference: 'Big 12', domain: 'uhcougars.com', rosterUrlTemplate: sidearm('uhcougars.com') },
  { name: 'Brigham Young University', shortName: 'BYU', conference: 'Big 12', domain: 'byucougars.com', rosterUrlTemplate: sidearm('byucougars.com') },
  { name: 'University of Arizona', shortName: 'Arizona', conference: 'Big 12', domain: 'arizonawildcats.com', rosterUrlTemplate: sidearm('arizonawildcats.com') },
  { name: 'Arizona State University', shortName: 'Arizona State', conference: 'Big 12', domain: 'thesundevils.com', rosterUrlTemplate: sidearm('thesundevils.com') },
  { name: 'University of Colorado', shortName: 'Colorado', conference: 'Big 12', domain: 'cubuffs.com', rosterUrlTemplate: sidearm('cubuffs.com') },
  { name: 'University of Utah', shortName: 'Utah', conference: 'Big 12', domain: 'utahutes.com', rosterUrlTemplate: sidearm('utahutes.com') },

  // ─── ACC (18) ─────────────────────────────────────────────────────────────────
  { name: 'Clemson University', shortName: 'Clemson', conference: 'ACC', domain: 'clemsontigers.com', rosterUrlTemplate: sidearm('clemsontigers.com') },
  { name: 'Florida State University', shortName: 'Florida State', conference: 'ACC', domain: 'seminoles.com', rosterUrlTemplate: sidearm('seminoles.com') },
  { name: 'University of Miami', shortName: 'Miami', conference: 'ACC', domain: 'miamihurricanes.com', rosterUrlTemplate: sidearm('miamihurricanes.com') },
  { name: 'University of North Carolina', shortName: 'UNC', conference: 'ACC', domain: 'goheels.com', rosterUrlTemplate: sidearm('goheels.com') },
  { name: 'NC State University', shortName: 'NC State', conference: 'ACC', domain: 'gopack.com', rosterUrlTemplate: sidearm('gopack.com') },
  { name: 'Duke University', shortName: 'Duke', conference: 'ACC', domain: 'goduke.com', rosterUrlTemplate: sidearm('goduke.com') },
  { name: 'University of Virginia', shortName: 'Virginia', conference: 'ACC', domain: 'virginiasports.com', rosterUrlTemplate: sidearm('virginiasports.com') },
  { name: 'Virginia Tech', shortName: 'Virginia Tech', conference: 'ACC', domain: 'hokiesports.com', rosterUrlTemplate: sidearm('hokiesports.com') },
  { name: 'Georgia Tech', shortName: 'Georgia Tech', conference: 'ACC', domain: 'ramblinwreck.com', rosterUrlTemplate: sidearm('ramblinwreck.com') },
  { name: 'University of Pittsburgh', shortName: 'Pittsburgh', conference: 'ACC', domain: 'pittsburghpanthers.com', rosterUrlTemplate: sidearm('pittsburghpanthers.com') },
  { name: 'Syracuse University', shortName: 'Syracuse', conference: 'ACC', domain: 'cuse.com', rosterUrlTemplate: sidearm('cuse.com') },
  { name: 'Boston College', shortName: 'Boston College', conference: 'ACC', domain: 'bceagles.com', rosterUrlTemplate: sidearm('bceagles.com') },
  { name: 'University of Notre Dame', shortName: 'Notre Dame', conference: 'ACC', domain: 'und.com', rosterUrlTemplate: sidearm('und.com') },
  { name: 'University of Louisville', shortName: 'Louisville', conference: 'ACC', domain: 'gocards.com', rosterUrlTemplate: sidearm('gocards.com') },
  { name: 'Wake Forest University', shortName: 'Wake Forest', conference: 'ACC', domain: 'godeacs.com', rosterUrlTemplate: sidearm('godeacs.com') },
  { name: 'Stanford University', shortName: 'Stanford', conference: 'ACC', domain: 'gostanford.com', rosterUrlTemplate: sidearm('gostanford.com') },
  { name: 'University of California', shortName: 'Cal', conference: 'ACC', domain: 'calbears.com', rosterUrlTemplate: sidearm('calbears.com') },
  { name: 'Southern Methodist University', shortName: 'SMU', conference: 'ACC', domain: 'smumustangs.com', rosterUrlTemplate: sidearm('smumustangs.com') },
]

/** Look up a school by case-insensitive shortName or name fragment */
export function findSchool(query: string): NcaaSchool | undefined {
  const q = query.toLowerCase()
  return NCAA_SCHOOLS.find(
    s => s.shortName.toLowerCase() === q || s.name.toLowerCase().includes(q)
  )
}
