export const DEFAULT_SEED = {
  meta: { created: new Date().toISOString(), version: 1 },
  nodes: [
    { id:"keeper-grove",  name:"Keeper Grove",  glyph:"K", kind:"grove",  weight:2, x:0.2, y:0.55 },
    { id:"mother-spiral", name:"Mother Spiral", glyph:"M", kind:"spiral", weight:3, x:0.72, y:0.62 },
    { id:"trailhead",     name:"Trailhead",     glyph:"T", kind:"path",   weight:1, x:0.48, y:0.30 },
  ],
  links: [
    { id:"root", source:"keeper-grove", target:"mother-spiral", kind:"thread" },
    { id:"trail", source:"trailhead", target:"mother-spiral", kind:"path" },
  ]
};
