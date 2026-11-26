/* Kaartjes voor de briefjes: ontwerpen, stickers, reacties en de inwisselstempel.
   Wordt gebruikt door briefje.html (schrijven) en index.html (de muur en het prikbord).
   Alle maten zijn in em: 1em = de lettergrootte van het briefje (--briefje-font).
   Let op voor de iPad (Safari 14): geen inset, geen aspect-ratio, geen :has(). */
(function(){
"use strict";

/* ---------- Kleine tekeningen ---------- */
var SVG={
hart:'<svg viewBox="0 0 40 40"><path d="M20 34C8 25 3 19 3 12.5 3 7.8 6.7 4 11.2 4c3.6 0 6.4 2.1 8.8 5.3C22.4 6.1 25.2 4 28.8 4 33.3 4 37 7.8 37 12.5 37 19 32 25 20 34z" fill="#d9475a"/><path d="M10 10c1.5-2 4-2.5 5.5-1.5" stroke="#fff" stroke-opacity=".55" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>',
ster:'<svg viewBox="0 0 40 40"><path d="M20 3l5.2 10.8 11.8 1.6-8.6 8.3 2.1 11.8L20 29.8 9.5 35.5l2.1-11.8L3 15.4l11.8-1.6z" fill="#f0b630" stroke="#c98b12" stroke-width="1.4" stroke-linejoin="round"/></svg>',
kus:'<svg viewBox="0 0 40 40"><path d="M3 19c4-6 9-9 12-9 2 0 3.6 1.4 5 3 1.4-1.6 3-3 5-3 3 0 8 3 12 9-5 8-11 11-17 11S8 27 3 19z" fill="#c8323f"/><path d="M5 19.5c5 1.6 10 2.2 15 2.2s10-.6 15-2.2" stroke="#8a1a26" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>',
bloem:'<svg viewBox="0 0 40 40"><g fill="#f2a7b8"><circle cx="20" cy="10" r="7"/><circle cx="29.5" cy="17" r="7"/><circle cx="26" cy="28.5" r="7"/><circle cx="14" cy="28.5" r="7"/><circle cx="10.5" cy="17" r="7"/></g><circle cx="20" cy="20" r="5.5" fill="#f4c34f"/></svg>',
zon:'<svg viewBox="0 0 40 40"><g stroke="#e9a21c" stroke-width="3" stroke-linecap="round"><path d="M20 2v6M20 32v6M2 20h6M32 20h6M7.3 7.3l4.2 4.2M28.5 28.5l4.2 4.2M7.3 32.7l4.2-4.2M28.5 11.5l4.2-4.2"/></g><circle cx="20" cy="20" r="8.5" fill="#f6c443"/></svg>',
lach:'<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" fill="#f6cf4a" stroke="#d7a21a" stroke-width="1.5"/><path d="M12 15.5c1-1.6 3-1.6 4 0M24 15.5c1-1.6 3-1.6 4 0" stroke="#5a3d0c" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M10.5 21.5c2 6 5.5 8.5 9.5 8.5s7.5-2.5 9.5-8.5z" fill="#7a2a1a"/><path d="M14.5 27c1.6 1.4 3.4 2 5.5 2s3.9-.6 5.5-2c-1.6-1.6-3.4-2.2-5.5-2.2s-3.9.6-5.5 2.2z" fill="#e66d6d"/></svg>',
kroon:'<svg viewBox="0 0 40 40"><path d="M5 30l-2-18 9 7 8-12 8 12 9-7-2 18z" fill="#f0b630" stroke="#b9840f" stroke-width="1.4" stroke-linejoin="round"/><rect x="5" y="30" width="30" height="5" rx="1" fill="#d99a16"/><circle cx="20" cy="22" r="2.6" fill="#d9475a"/></svg>',
duim:'<svg viewBox="0 0 40 40"><path d="M12 17h-6v17h6zM12 18l6-11c1-2 4.5-1.6 4.5 1.4L21 16h10.2c2.4 0 4 2.3 3.2 4.5l-3.6 10.6c-.5 1.6-2 2.6-3.6 2.6H12z" fill="#f3c08e" stroke="#9c6331" stroke-width="1.6" stroke-linejoin="round"/></svg>'
};
var STICKERS=["hart","kus","ster","bloem","zon","lach","kroon","duim"];
var REACTIES=[["hart","Lief"],["lach","Haha"],["ster","Top"],["kus","Kusje"]];

/* Versieringen per kaartje: [svg, plek-stijl] */
function deco(svg,stijl){return{svg:svg,stijl:stijl}}
function hoek(svg,stijl){return{svg:svg,stijl:stijl,hoek:1}}
var D={
gaatje:deco('<svg viewBox="0 0 60 60"><circle cx="30" cy="20" r="6" fill="#f3ede2" stroke="#8b6a3e" stroke-width="2"/><path d="M30 14C26 4 34-2 40 4" stroke="#7a5230" stroke-width="2" fill="none"/></svg>','left:50%;top:-.15em;width:1.6em;height:1.6em;margin-left:-.8em'),
bloemhoek:hoek('<svg viewBox="0 0 60 60"><path d="M8 58C20 40 30 26 42 14" stroke="#8fae86" stroke-width="2.4" fill="none"/><path d="M22 38c-6-2-9-7-8-12 5 1 9 5 8 12zM31 26c1-6 5-9 10-9-1 5-5 9-10 9z" fill="#a9c79f"/><g transform="translate(44 12)"><circle r="6" cx="0" cy="-5" fill="#efb9c4"/><circle r="6" cx="5" cy="1" fill="#efb9c4"/><circle r="6" cx="-5" cy="1" fill="#efb9c4"/><circle r="3.4" fill="#f4cf6a"/></g><circle cx="24" cy="20" r="4.5" fill="#f4cfa3"/></svg>','right:.15em;top:.15em;width:2.4em;height:2.4em'),
hartjes:deco('<svg viewBox="0 0 60 40"><path d="M14 30C6 24 3 20 3 15.5 3 12.4 5.5 10 8.5 10c2.4 0 4 1.3 5.5 3.4 1.5-2.1 3.1-3.4 5.5-3.4 3 0 5.5 2.4 5.5 5.5C25 20 22 24 14 30z" fill="#e7949e"/><path d="M42 22c-5-3.6-7-6-7-9 0-2 1.6-3.6 3.6-3.6 1.6 0 2.6.9 3.4 2.2.8-1.3 1.8-2.2 3.4-2.2 2 0 3.6 1.6 3.6 3.6 0 3-2 5.4-7 9z" fill="#d9475a" opacity=".8"/><path d="M52 34c-3-2.2-4.4-3.6-4.4-5.5 0-1.2 1-2.2 2.2-2.2 1 0 1.6.6 2.2 1.4.6-.8 1.2-1.4 2.2-1.4 1.2 0 2.2 1 2.2 2.2 0 1.9-1.4 3.3-4.4 5.5z" fill="#e7949e"/></svg>','right:.2em;bottom:1.1em;width:2.4em;height:1.6em'),
rozet:hoek('<svg viewBox="0 0 60 70"><path d="M22 36l-8 30 10-6 6 9 4-31zM38 36l8 30-10-6-6 9-4-31z" fill="#c9a43a"/><circle cx="30" cy="26" r="20" fill="#e5c25a" stroke="#b58c1f" stroke-width="2" stroke-dasharray="3 2"/><circle cx="30" cy="26" r="13" fill="#f1d77e"/><path d="M30 17l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z" fill="#b58c1f"/></svg>','right:.25em;top:.2em;width:1.9em;height:2.2em'),
klaver:hoek('<svg viewBox="0 0 60 60"><g fill="#7fb27a"><circle cx="30" cy="18" r="9"/><circle cx="42" cy="30" r="9"/><circle cx="30" cy="42" r="9"/><circle cx="18" cy="30" r="9"/></g><path d="M30 30c4 8 6 14 4 24" stroke="#5c8c57" stroke-width="2.6" fill="none" stroke-linecap="round"/></svg>','right:.25em;top:.25em;width:1.9em;height:1.9em'),
maan:hoek('<svg viewBox="0 0 80 60"><path d="M46 8a22 22 0 1 0 22 30A18 18 0 1 1 46 8z" fill="#f1e2a6"/><g fill="#f1e2a6"><circle cx="14" cy="12" r="1.8"/><circle cx="24" cy="30" r="1.2"/><circle cx="8" cy="40" r="1.4"/><circle cx="74" cy="10" r="1.2"/></g><path d="M20 8l1.2 2.6 2.8.4-2 2 .5 2.8-2.5-1.3-2.5 1.3.5-2.8-2-2 2.8-.4z" fill="#f1e2a6"/></svg>','right:.2em;top:.15em;width:2.6em;height:2em'),
zonop:hoek('<svg viewBox="0 0 80 50"><path d="M10 48a30 30 0 0 1 60 0z" fill="#f6c443"/><g stroke="#e9a21c" stroke-width="3" stroke-linecap="round"><path d="M40 4v8M14 14l5 5M66 14l-5 5M2 32h8M70 32h8"/></g></svg>','right:.25em;top:.25em;width:2.4em;height:1.5em'),
pleister:hoek('<svg viewBox="0 0 70 40"><g transform="rotate(-18 35 20)"><rect x="4" y="11" width="62" height="18" rx="9" fill="#e9c9a6" stroke="#b88d62" stroke-width="1.4"/><rect x="24" y="11" width="22" height="18" fill="#f3dcc2"/><g fill="#b88d62"><circle cx="30" cy="17" r="1"/><circle cx="35" cy="17" r="1"/><circle cx="40" cy="17" r="1"/><circle cx="30" cy="23" r="1"/><circle cx="35" cy="23" r="1"/><circle cx="40" cy="23" r="1"/></g></g></svg>','right:.2em;top:.3em;width:2.4em;height:1.4em'),
grootHart:deco('<svg viewBox="0 0 60 54"><path d="M30 50C10 36 3 27 3 17 3 9.5 9 3.5 16.5 3.5c5.6 0 10 3.2 13.5 8.2 3.5-5 7.9-8.2 13.5-8.2C51 3.5 57 9.5 57 17c0 10-7 19-27 33z" fill="none" stroke="#c23a4c" stroke-width="3"/></svg>','right:.3em;bottom:1.1em;width:2.2em;height:2em;opacity:.85'),
confetti:deco('<svg viewBox="0 0 100 40"><g><rect x="6" y="8" width="5" height="9" rx="1" fill="#e46b6b" transform="rotate(-25 8 12)"/><rect x="24" y="22" width="5" height="9" rx="1" fill="#5aa1d6" transform="rotate(30 26 26)"/><rect x="46" y="6" width="5" height="9" rx="1" fill="#f0b630" transform="rotate(15 48 10)"/><rect x="66" y="24" width="5" height="9" rx="1" fill="#7fb27a" transform="rotate(-35 68 28)"/><rect x="86" y="8" width="5" height="9" rx="1" fill="#c48ad6" transform="rotate(20 88 12)"/><circle cx="36" cy="10" r="2.6" fill="#7fb27a"/><circle cx="58" cy="30" r="2.6" fill="#e46b6b"/><circle cx="78" cy="14" r="2.6" fill="#5aa1d6"/><circle cx="16" cy="32" r="2.6" fill="#f0b630"/></g></svg>','left:0;right:0;bottom:1.05em;height:1.1em;opacity:.9'),
wolk:deco('<svg viewBox="0 0 70 56"><path d="M18 30a10 10 0 0 1 2-19.8A14 14 0 0 1 46 8a11 11 0 0 1 8 22z" fill="#a99cc0"/><g stroke="#7d6ea0" stroke-width="2.6" stroke-linecap="round"><path d="M22 37l-3 8M34 37l-3 8M46 37l-3 8M28 46l-2 5M40 46l-2 5"/></g></svg>','right:.25em;bottom:1.1em;width:2.1em;height:1.7em'),
zegel:deco('<svg viewBox="0 0 60 60"><path d="M30 4l5 5 7-1 2 7 7 3-2 7 4 6-6 4v7l-7 1-3 7-7-3-6 4-4-6-7-1 1-7-5-5 5-5-1-7 7-1 4-6 6 4z" fill="#a8312a"/><circle cx="30" cy="30" r="13" fill="none" stroke="#7d1f19" stroke-width="2"/><path d="M24 31c3-5 9-5 12 0-3 4-9 4-12 0z" fill="#7d1f19"/></svg>','right:.35em;bottom:1.15em;width:1.7em;height:1.7em'),
tekenvak:deco('<svg viewBox="0 0 100 60" preserveAspectRatio="none"><rect x="1" y="1" width="98" height="58" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="4 3" opacity=".45" vector-effect="non-scaling-stroke"/></svg>','left:18%;right:18%;top:2.25em;height:3.2em'),
lijntjes:deco('<svg viewBox="0 0 100 100" preserveAspectRatio="none"><g stroke="#9fb6d6" stroke-width=".6" vector-effect="non-scaling-stroke"><path d="M0 34h100M0 47h100M0 60h100M0 73h100M0 86h100"/></g><path d="M12 0v100" stroke="#e08a8a" stroke-width="1" vector-effect="non-scaling-stroke"/></svg>','left:0;right:0;top:0;bottom:0'),
formulier:deco('<svg viewBox="0 0 100 100" preserveAspectRatio="none"><g stroke="#9a9a92" stroke-width=".8" vector-effect="non-scaling-stroke"><path d="M6 40h88M6 54h88M6 68h88"/></g></svg>','left:0;right:0;top:0;bottom:0'),
ruitjes:deco('<svg viewBox="0 0 100 100" preserveAspectRatio="none"><g stroke="#b9c7dd" stroke-width=".5" vector-effect="non-scaling-stroke" opacity=".8"><path d="M0 10h100M0 20h100M0 30h100M0 40h100M0 50h100M0 60h100M0 70h100M0 80h100M0 90h100M10 0v100M20 0v100M30 0v100M40 0v100M50 0v100M60 0v100M70 0v100M80 0v100M90 0v100"/></g></svg>','left:0;right:0;top:0;bottom:0'),
pan:hoek('<svg viewBox="0 0 70 44"><ellipse cx="28" cy="24" rx="22" ry="12" fill="#5d5a55"/><ellipse cx="28" cy="21" rx="19" ry="8.5" fill="#86827b"/><rect x="48" y="19" width="20" height="5" rx="2.5" fill="#3f3c38" transform="rotate(-8 48 21)"/><path d="M18 8c-2-3 2-4 0-7M28 7c-2-3 2-4 0-7M38 8c-2-3 2-4 0-7" stroke="#b9b2a6" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M8 40l44-36" stroke="#c23a3a" stroke-width="3.4" stroke-linecap="round"/></svg>','right:.2em;top:.25em;width:2.2em;height:1.45em'),
kopje:hoek('<svg viewBox="0 0 60 50"><path d="M8 18h34v10a17 17 0 0 1-34 0z" fill="#fff" stroke="#9c6331" stroke-width="2"/><path d="M42 21h4a6 6 0 0 1 0 12h-5" fill="none" stroke="#9c6331" stroke-width="2"/><path d="M18 13c-2-3 2-5 0-9M26 13c-2-3 2-5 0-9M34 13c-2-3 2-5 0-9" stroke="#c8a27b" stroke-width="1.8" fill="none" stroke-linecap="round"/><ellipse cx="25" cy="47" rx="20" ry="2.5" fill="#d9c1a0"/></svg>','right:.25em;top:.2em;width:1.9em;height:1.6em'),
handjes:hoek('<svg viewBox="0 0 60 50"><path d="M10 40c4-10 8-18 14-22 3-2 5 1 3 4l-4 6 12-10c2-2 5 0 3 3l-8 9 10-7c2-1.4 4.4 1 2.8 3L34 36l6-3c2-1 3.6 1.4 2 3-6 6-12 10-20 10-6 0-10-2-12-6z" fill="#f3c08e" stroke="#9c6331" stroke-width="1.6" stroke-linejoin="round"/></svg>','right:.2em;top:.2em;width:1.9em;height:1.6em'),
glazen:hoek('<svg viewBox="0 0 60 50"><g fill="none" stroke="#7d5fa8" stroke-width="2"><path d="M12 6h12c0 9-2 14-6 15-4-1-6-6-6-15zM18 21v16M12 37h12"/><path d="M36 6h12c0 9-2 14-6 15-4-1-6-6-6-15zM42 21v16M36 37h12"/></g><path d="M13 10h10c-.4 4-2 7-5 8-3-1-4.6-4-5-8zM37 10h10c-.4 4-2 7-5 8-3-1-4.6-4-5-8z" fill="#b7485d" opacity=".75"/><path d="M26 8l4-5M30 9l5-2" stroke="#f0b630" stroke-width="1.8" stroke-linecap="round"/></svg>','right:.2em;top:.2em;width:1.9em;height:1.6em')
};

/* ---------- De kaartjes ---------- */
// kop: voorgedrukte tekst bovenaan. stijl: lettertype van de kop. ruimte: hoeveel em de kop inneemt.
// vast: kaartje heeft al genoeg tekst, dus zelf iets schrijven mag maar hoeft niet.
// extra: tweede invulveld (label + voorbeeld). bon: kan ingewisseld worden. koken: koppeling met het weekmenu.
var KAARTEN=[
{id:"dankjewel",groep:"lief",naam:"Dankjewel",kop:"dankjewel",stijl:"sierlijk",kleur:"#d6b88f",inkt:"#3a2a14",deco:["gaatje"],klasse:"label",ruimte:1.9,plaats:"voor de koffie op bed",vast:1},
{id:"zomaar",groep:"lief",naam:"Zomaar",kop:"zomaar",stijl:"sierlijk",kleur:"#fbf6ec",inkt:"#5b3a46",deco:["bloemhoek"],ruimte:1.4,plaats:"omdat het dinsdag is",vast:1},
{id:"denkaanje",groep:"lief",naam:"Ik denk aan je",kop:"ik denk aan je",stijl:"sierlijk",kleur:"#f6dcdc",inkt:"#6a2a33",deco:["hartjes"],ruimte:1.4,plaats:"(heel de dag al)",vast:1},
{id:"trots",groep:"lief",naam:"Trots op je",kop:"trots op je",stijl:"sierlijk",kleur:"#dcebd5",inkt:"#24452c",deco:["rozet"],ruimte:1.4,plaats:"omdat je dat gesprek gewoon gedaan hebt"},
{id:"sterkte",groep:"lief",naam:"Sterkte vandaag",kop:"sterkte vandaag",stijl:"sierlijk",kleur:"#dbe6f2",inkt:"#1e3550",deco:["klaver"],ruimte:2.2,plaats:"je kunt dit. ik duim de hele dag",vast:1},
{id:"goedemorgen",groep:"lief",naam:"Goedemorgen",kop:"goedemorgen zonnetje",stijl:"sierlijk",kleur:"#fbe7a6",inkt:"#5a3d0c",deco:["zonop"],ruimte:2.2,plaats:"er staat koffie klaar",vast:1},
{id:"slaaplekker",groep:"lief",naam:"Slaap lekker",kop:"slaap lekker",stijl:"sierlijk",kleur:"#2b3552",inkt:"#f1e6c8",deco:["maan"],ruimte:1.4,plaats:"droom wat moois",vast:1},
{id:"sorry",groep:"lief",naam:"Sorry",kop:"sorry",stijl:"sierlijk",kleur:"#ecebe6",inkt:"#3d3a34",deco:["pleister"],ruimte:1.4,plaats:"dat ik zo kortaf was"},
{id:"houvanje",groep:"lief",naam:"Ik hou van je",kop:"ik hou van je",stijl:"sierlijk",kleur:"#f4c6c9",inkt:"#6b1f2a",deco:["grootHart"],ruimte:1.4,plaats:"gewoon. altijd.",vast:1},
{id:"gefeliciteerd",groep:"grappig",naam:"Gefeliciteerd met…",kop:"Gefeliciteerd met:",stijl:"sierlijk",kleur:"#dfe7ee",inkt:"#24384a",deco:["confetti"],ruimte:1.45,plaats:"het vinden van je sleutels"},
{id:"jammer",groep:"grappig",naam:"Wat jammer dat…",kop:"Wat ontzettend jammer dat:",stijl:"sierlijk",kleur:"#e8e2ef",inkt:"#3a2d57",deco:["wolk"],ruimte:2.2,plaats:"de chocola op is. ik was het niet."},
{id:"oorkonde",groep:"grappig",naam:"Oorkonde",kop:"OORKONDE",sub:"uitgereikt voor",stijl:"plechtig",kleur:"#f6efe3",inkt:"#3d2f20",deco:["zegel"],klasse:"oorkonde",ruimte:2.3,plaats:"de beste stamppot van het jaar",midden:1},
{id:"bekeuring",groep:"grappig",naam:"Bekeuring",kop:"BEKEURING",sub:"Overtreding:",nummer:1,stijl:"formulier",kleur:"#f3e36f",inkt:"#3a3208",klasse:"bekeuring",ruimte:2.25,plaats:"te schattig in de ochtend",extra:{label:"Boete",plaats:"3 kusjes"}},
{id:"gezocht",groep:"grappig",naam:"Gezocht",kop:"GEZOCHT",stijl:"western",kleur:"#e8d9b8",inkt:"#4a2f17",klasse:"gezocht",ruimte:1.55,plaats:"de laatste stroopwafel",midden:1,extra:{label:"Beloning",plaats:"een knuffel"}},
{id:"rapport",groep:"grappig",naam:"Rapportcijfer",kop:"Rapport",sub:"vak:",stijl:"sierlijk",kleur:"#fdfbf5",inkt:"#233a63",deco:["lijntjes"],klasse:"rapport",ruimte:2,plaats:"afwassen zonder dat ik het vroeg",extra:{label:"Cijfer",plaats:"9½",cijfer:1}},
{id:"klacht",groep:"grappig",naam:"Officiële klacht",kop:"OFFICIËLE KLACHT",sub:"Betreft:",stijl:"formulier",kleur:"#f4f4ef",inkt:"#2f2f2f",deco:["formulier"],klasse:"klacht",ruimte:2.2,plaats:"de dekens, die weer allemaal aan jouw kant liggen",extra:{label:"Gewenste oplossing",plaats:"terug-knuffelen"}},
{id:"excuus",groep:"grappig",naam:"Excuusbriefje",kop:"Excuusbriefje",sub:"Ik heb…",stijl:"sierlijk",kleur:"#f9f1d8",inkt:"#4a3b1a",deco:["ruitjes"],ruimte:2,plaats:"jouw laatste stuk kaas opgegeten",voet:"en het spijt me (een beetje)"},
{id:"bon",groep:"bon",naam:"Tegoedbon",kop:"TEGOEDBON",sub:"goed voor:",stijl:"bon",kleur:"#fffdf7",inkt:"#2d4a5c",klasse:"bon",ruimte:2.1,plaats:"één keer een voetmassage",bon:1,extra:{label:"Geldig tot",plaats:"zondag"}},
{id:"bonkoken",groep:"bon",naam:"Niet koken",kop:"BON",sub:"jij hoeft vanavond niet te koken",stijl:"bon",kleur:"#fff8ee",inkt:"#5a3416",deco:["pan"],klasse:"bon",ruimte:3.6,plaats:"ik kook, jij zit",bon:1,koken:1,vast:1,extra:{label:"Geldig tot",plaats:"eind van de maand"}},
{id:"bonontbijt",groep:"bon",naam:"Ontbijt op bed",kop:"BON",sub:"voor ontbijt op bed",stijl:"bon",kleur:"#fff6e6",inkt:"#6a3d10",deco:["kopje"],klasse:"bon",ruimte:3.05,plaats:"met verse jus",bon:1,vast:1,extra:{label:"Geldig tot",plaats:"een zondag naar keuze"}},
{id:"bonmassage",groep:"bon",naam:"Massage",kop:"BON",sub:"voor een massage",stijl:"bon",kleur:"#f1f6ef",inkt:"#2b4a3a",deco:["handjes"],klasse:"bon",ruimte:3.05,plaats:"20 minuten, zonder zeuren",bon:1,vast:1,extra:{label:"Geldig tot",plaats:"altijd"}},
{id:"bonuitje",groep:"bon",naam:"Avondje uit",kop:"BON",sub:"voor een avondje uit",stijl:"bon",kleur:"#f6f0fa",inkt:"#47305f",deco:["glazen"],klasse:"bon",ruimte:3.05,plaats:"ik regel alles",bon:1,vast:1,extra:{label:"Geldig tot",plaats:"voor de zomer"}}
];
var GROEPEN=[["lief","Lief"],["grappig","Grappig"],["bon","Bonnen"]];
var PER_ID={};KAARTEN.forEach(function(k){PER_ID[k.id]=k});
function vind(id){return id&&PER_ID[id]||null}

/* ---------- Opmaak (één keer in de pagina gezet) ---------- */
var CSS=[
".kaart-decor{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;overflow:hidden;font-size:var(--briefje-font,25px);color:var(--briefje-inkt,#3b2f1c)}",
".kaart-deco{position:absolute;display:block}.kaart-deco svg{display:block;width:100%;height:100%}",
".kaart-kop{position:absolute;left:.55em;right:.55em;top:.42em;line-height:1.02;overflow:hidden;text-align:left}",
".kaart-hoek .kaart-kop{right:2.5em}",
".kaart-kop .k1{display:block}.kaart-kop .k2{display:block;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-weight:500;font-size:.62em;letter-spacing:0;margin-top:.18em;white-space:normal;line-height:1.1}",
".stijl-sierlijk .kaart-kop .k1{font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-weight:600;font-size:.86em;letter-spacing:.01em}",
".stijl-plechtig .kaart-kop{text-align:center}.stijl-plechtig .kaart-kop .k1{font-family:'Cormorant Garamond',Georgia,serif;font-weight:600;font-size:.72em;letter-spacing:.32em}",
".stijl-formulier .kaart-kop .k1{font-family:Georgia,serif;font-weight:700;font-size:.56em;letter-spacing:.14em;border-bottom:.09em solid currentColor;padding-bottom:.18em;display:flex;justify-content:space-between}",
".stijl-formulier .kaart-kop .k2{font-family:Georgia,serif;font-style:normal;font-size:.48em;letter-spacing:.04em;margin-top:.5em;opacity:.85}",
".stijl-western .kaart-kop{text-align:center}.stijl-western .kaart-kop .k1{font-family:Georgia,serif;font-weight:700;font-size:.92em;letter-spacing:.14em}",
".stijl-bon .kaart-kop .k1{font-family:Georgia,serif;font-weight:700;font-size:.6em;letter-spacing:.28em}.stijl-bon .kaart-kop .k2{font-size:.72em;white-space:normal}",
".kaart-label{border-radius:.5em .5em .25em .25em}",
".kaart-oorkonde .kaart-decor{border:.24em double rgba(161,121,62,.9);box-sizing:border-box}",
".kaart-oorkonde .kaart-kop .k2{font-size:.6em;margin-top:.25em}",
".kaart-bekeuring .kaart-decor{border-top:.32em solid #c9a227;box-sizing:border-box}",
".kaart-gezocht .kaart-decor{box-shadow:inset 0 0 1.6em rgba(120,80,30,.35)}",
".kaart-bon .kaart-decor{border:.11em dashed currentColor;border-radius:.2em;box-sizing:border-box;opacity:1}",
".kaart-bon .kaart-decor:before,.kaart-bon .kaart-decor:after{content:'';position:absolute;top:50%;width:.7em;height:.7em;margin-top:-.35em;border-radius:50%;background:#f7f4ed}",
".kaart-bon .kaart-decor:before{left:-.4em}.kaart-bon .kaart-decor:after{right:-.4em}",
".kaart-extra{position:absolute;left:.6em;right:.6em;bottom:1.5em;font-family:'Cormorant Garamond',Georgia,serif;font-size:.6em;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
".kaart-extra b{font-weight:600;font-style:italic;margin-right:.3em}.kaart-extra span{font-family:Caveat,cursive;font-size:1.3em}",
".kaart-cijfer{position:absolute;right:.4em;top:.35em;width:1.7em;height:1.7em;border:.08em solid #c4302b;border-radius:50%;color:#c4302b;font-family:Caveat,cursive;font-size:1.05em;line-height:1.62em;text-align:center;transform:rotate(-8deg);white-space:nowrap}",
".kaart-voet{position:absolute;left:.6em;right:.6em;bottom:1.5em;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-size:.58em;opacity:.85}",
".kaart-midden .briefje-tekst,.kaart-midden textarea{text-align:center}",
".kaart-stickers{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;font-size:var(--briefje-font,25px)}",
".kaart-sticker{position:absolute;width:1.25em;height:1.25em;margin:-.625em 0 0 -.625em;filter:drop-shadow(0 .04em .05em rgba(0,0,0,.25))}.kaart-sticker svg{display:block;width:100%;height:100%}",
".kaart-reacties{position:absolute;left:-.25em;bottom:-.45em;display:flex;pointer-events:none;font-size:var(--briefje-font,25px)}",
".kaart-reactie{width:.95em;height:.95em;margin-right:-.15em;padding:.1em;background:#fffdf8;border-radius:50%;box-shadow:0 .05em .15em rgba(0,0,0,.22)}.kaart-reactie svg{display:block;width:100%;height:100%}",
".kaart-stempel{position:absolute;left:50%;top:48%;padding:.12em .4em;border:.11em solid #b3261e;border-radius:.15em;color:#b3261e;font-family:Georgia,serif;font-weight:700;font-size:calc(var(--briefje-font,25px)*.6);letter-spacing:.14em;line-height:1.15;text-align:center;white-space:nowrap;transform:translate(-50%,-50%) rotate(-14deg);opacity:.82;pointer-events:none;background:rgba(255,255,255,.12)}",
".briefje.kaart .briefje-status{top:auto;bottom:calc(var(--briefje-font,25px)*.4)}",
".kaart-stempel small{display:block;font-size:.62em;letter-spacing:.06em;font-weight:400}"
].join("\n");
function zetCss(doc){
doc=doc||document;
if(doc.getElementById("kaartjesCss"))return;
var s=doc.createElement("style");s.id="kaartjesCss";s.textContent=CSS;(doc.head||doc.documentElement).appendChild(s);
}

/* ---------- Helpers ---------- */
function maak(tag,klasse,tekst){var e=document.createElement(tag);if(klasse)e.className=klasse;if(tekst!==undefined)e.textContent=tekst;return e}
function hash(s){s=String(s||"");var h=0;for(var i=0;i<s.length;i++){h=(h*31+s.charCodeAt(i))|0}return Math.abs(h)}
function datumKort(ms){return new Date(ms).toLocaleDateString("nl-NL",{day:"numeric",month:"short"})}

// Stickers: "hart:0.82,0.12,-10;ster:0.1,0.8,8"
function leesStickers(t){
if(!t)return[];
return String(t).split(";").map(function(p){
var m=p.match(/^([a-z]{2,8}):(\d(?:\.\d+)?),(\d(?:\.\d+)?),(-?\d{1,2})$/);
return m&&SVG[m[1]]?{soort:m[1],x:+m[2],y:+m[3],draai:+m[4]}:null;
}).filter(Boolean);
}
function schrijfStickers(lijst){return lijst.slice(0,12).map(function(s){return s.soort+":"+s.x.toFixed(3)+","+s.y.toFixed(3)+","+Math.round(s.draai)}).join(";")}
// Reacties: "Sanne=hart;Ramon=lach"
function leesReacties(t){
var uit={};
String(t||"").split(";").forEach(function(p){var m=p.match(/^(Sanne|Ramon)=([a-z]{2,8})$/);if(m&&SVG[m[2]])uit[m[1]]=m[2]});
return uit;
}
function schrijfReacties(o){return Object.keys(o).filter(function(k){return o[k]}).map(function(k){return k+"="+o[k]}).join(";")}

/* ---------- Tekenen ---------- */
// Zet de achtergrond, de voorgedrukte tekst en de versiering op een briefje-element.
// Geeft de kaart terug (of null). opties.extraVeld: laat de extra-regel weg (bv. in het schrijfscherm, waar een eigen veld staat).
function decoreer(el,b,opties){
opties=opties||{};
haalWeg(el);
var k=vind(b&&b.kaart);
if(!k)return null;
el.classList.add("kaart","kaart-"+(k.klasse||k.id),"stijl-"+k.stijl);
if(k.midden)el.classList.add("kaart-midden");
var metHoek=(k.deco||[]).some(function(n){return D[n]&&D[n].hoek});
if(metHoek)el.classList.add("kaart-hoek");
el.dataset.kaartKlassen=["kaart","kaart-"+(k.klasse||k.id),"stijl-"+k.stijl,"kaart-midden","kaart-hoek"].join(" ");
el.style.setProperty("--briefje-kleur",k.kleur);
el.style.setProperty("--briefje-inkt",k.inkt);
var laag=maak("div","kaart-decor");laag.setAttribute("aria-hidden","true");
(k.deco||[]).forEach(function(n){var d=D[n];if(!d)return;var s=maak("span","kaart-deco");s.setAttribute("style",d.stijl);s.innerHTML=d.svg;laag.appendChild(s)});
var kop=maak("div","kaart-kop");
var k1=maak("span","k1");
if(k.nummer){k1.appendChild(maak("span","",k.kop));k1.appendChild(maak("span","","Nr. "+String(1000+hash(b.id||"x")%9000)))}
else k1.textContent=k.kop;
kop.appendChild(k1);
if(k.sub)kop.appendChild(maak("span","k2",k.sub));
laag.appendChild(kop);
if(k.extra&&!opties.zonderExtra){
var waarde=String(b.extra||"").trim();
if(k.extra.cijfer){if(waarde)laag.appendChild(maak("div","kaart-cijfer",waarde))}
else if(waarde){var x=maak("div","kaart-extra");x.appendChild(maak("b","",k.extra.label+":"));x.appendChild(maak("span","",waarde));laag.appendChild(x)}
}
if(k.voet&&!opties.zonderExtra)laag.appendChild(maak("div","kaart-voet",k.voet));
el.insertBefore(laag,el.firstChild);
return k;
}
function haalWeg(el){
if(el.dataset.kaartKlassen){el.dataset.kaartKlassen.split(" ").forEach(function(c){el.classList.remove(c)});delete el.dataset.kaartKlassen}
var oud=el.querySelectorAll(":scope > .kaart-decor");
for(var i=0;i<oud.length;i++)oud[i].remove();
}
// Ruimte boven de tekst, in em.
function ruimteBoven(b){var k=vind(b&&b.kaart);return k?k.ruimte:0}
function ruimteOnder(b){var k=vind(b&&b.kaart);if(!k)return 0;return (k.extra&&!k.extra.cijfer&&b.extra)||k.voet?1.05:0}

function tekenStickers(el,tekst){
var lijst=leesStickers(tekst);
if(!lijst.length)return;
var laag=maak("div","kaart-stickers");laag.setAttribute("aria-hidden","true");
lijst.forEach(function(s){var e=maak("span","kaart-sticker");e.style.left=(s.x*100)+"%";e.style.top=(s.y*100)+"%";e.style.transform="rotate("+s.draai+"deg)";e.innerHTML=SVG[s.soort];laag.appendChild(e)});
el.appendChild(laag);
}
function tekenReacties(el,tekst){
var r=leesReacties(tekst),namen=Object.keys(r);
if(!namen.length)return;
var rij=maak("div","kaart-reacties");
namen.forEach(function(n){var e=maak("span","kaart-reactie");e.title=n;e.setAttribute("data-wie",n);e.innerHTML=SVG[r[n]];rij.appendChild(e)});
el.appendChild(rij);
}
function tekenStempel(el,b){
if(!b||!b.ingewisseld)return;
var s=maak("div","kaart-stempel","INGEWISSELD");
s.appendChild(maak("small","",datumKort(b.ingewisseld)+(b.ingewisseldDoor?" · "+b.ingewisseldDoor:"")));
el.appendChild(s);
}

/* ---------- Kaartje van de dag ---------- */
// Een rustig idee, geen verplichting. Wisselt per dag (en 's avonds iets anders).
var IDEEEN={
0:[["bonontbijt","Zondag: tijd voor een ontbijtbon?"],["zomaar","Zomaar een briefje, op zondag"]],
1:[["sterkte","Maandag: een beetje sterkte kan geen kwaad"],["goedemorgen","Begin de week met een goedemorgen"]],
2:[["zomaar","Zomaar, omdat het dinsdag is"],["trots","Waar ben je trots op bij de ander?"]],
3:[["dankjewel","Vandaag al iemand bedankt?"],["rapport","Geef eens een rapportcijfer"]],
4:[["denkaanje","Laat weten dat je aan de ander denkt"],["bekeuring","Tijd voor een bekeuring wegens schattigheid"]],
5:[["bonkoken","Vrijdag: geef een niet-koken-bon"],["bonuitje","Een avondje uit in het vooruitzicht?"]],
6:[["oorkonde","Reik een oorkonde uit"],["bonmassage","Zaterdag: massagebon?"]]
};
function vanDeDag(d){
d=d||new Date();
var lijst=IDEEEN[d.getDay()];
if(d.getHours()>=21)return{kaart:"slaaplekker",tekst:"Het is al laat: een slaap-lekker-briefje?"};
var keuze=lijst[(d.getDate()+d.getMonth())%lijst.length];
return{kaart:keuze[0],tekst:keuze[1]};
}

window.Kaartjes={
KAARTEN:KAARTEN,GROEPEN:GROEPEN,STICKERS:STICKERS,REACTIES:REACTIES,SVG:SVG,
vind:vind,zetCss:zetCss,decoreer:decoreer,haalWeg:haalWeg,ruimteBoven:ruimteBoven,ruimteOnder:ruimteOnder,
tekenStickers:tekenStickers,tekenReacties:tekenReacties,tekenStempel:tekenStempel,
leesStickers:leesStickers,schrijfStickers:schrijfStickers,leesReacties:leesReacties,schrijfReacties:schrijfReacties,
vanDeDag:vanDeDag
};
zetCss(document);
})();
