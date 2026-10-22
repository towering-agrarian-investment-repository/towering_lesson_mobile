#!/usr/bin/env python3
"""Reconstruct editable flat-vector decorative art from user-supplied 511x637 share-card reference.
No HappyGolf logo is generated or exported.
"""
from pathlib import Path
import io, json, calendar
import cairosvg
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent
SVG = ROOT/'assets/svg'; PNG = ROOT/'assets/png'; PRE = ROOT/'reference'; SPEC=ROOT/'spec'
for p in (SVG,PNG,PRE,SPEC): p.mkdir(parents=True, exist_ok=True)
SOURCE=PRE/'user_reference.png' if (PRE/'user_reference.png').exists() else Path('/mnt/data/image(20261022-064924).png')
REF_W,REF_H=511,637

# Screenshot palette, sampled at source pixel level and slightly normalized to solid, flat fills.
C={
 'cyan':'#5FDCFC','paper':'#FEFEFE','ink':'#061630','heading':'#485C7F',
 'muted':'#617291','grid':'#F1F3F5','green':'#00B875',
 'orange':'#FFAA12','separator':'#E2EAF0','sun':'#FFF0B3',
 'sky':'#BDEFFA','sky2':'#D4F6FC','hill-light':'#79E3A6',
 'hill':'#44D991','hill2':'#26CD85','hill-dark':'#009D68','flag':'#FF536E'
}

FRAME='''<rect width="511" height="637" fill="#5FDCFC"/>
<rect x="19" y="23" width="475" height="591" rx="21" fill="#FEFEFE"/>'''

SKY='''
<!-- Wavy upper-right sky; this edge is purposefully within the card, not clipped flat. -->
<path d="M 260 23 H 472 Q 493 23 493 45 L 493 123 C 475 108 459 114 443 116 C 420 118 408 131 392 127 C 375 121 361 98 342 93 C 315 87 300 88 287 70 C 278 57 280 37 260 23 Z" fill="#BCEFFA"/>
<path d="M 279 23 C 292 41 291 64 317 81 C 335 91 352 88 364 102 C 374 113 380 122 394 124" fill="none" stroke="#D3F6FB" stroke-width="4" opacity="0.22" />
<path d="M 353 63 C 355 57 359 55 364 56 C 365 49 371 45 378 46 C 381 39 388 37 394 42 C 402 42 404 47 405 53 C 412 51 418 57 420 63 Z" fill="#F4FBFE"/>
<path d="M 286 123 C 289 117 295 115 300 117 C 302 109 308 105 316 109 C 321 111 321 116 323 116 C 329 114 333 118 335 124 Z" fill="#DEF6FC"/>
<path d="M 380 128 C 383 122 391 121 396 124 C 398 116 405 110 413 115 C 417 118 418 125 418 128 Z" fill="#F6FCFD"/>
<path d="M 468 75 C 473 66 481 66 487 73 C 491 71 493 72 493 76 L 493 81 L 465 81 Z" fill="#F2FBFF"/>
'''
HILLS_FLAG='''
<!-- Right-hand layered golf green and flag. -->
<path d="M 356 206 C 377 202 386 171 406 156 C 427 141 458 143 476 131 C 483 126 488 123 493 122 L 493 244 C 474 225 443 225 423 223 C 401 222 377 220 356 206 Z" fill="#7BE7A8"/>
<path d="M 359 207 C 392 202 393 167 427 162 C 453 159 472 143 493 154 L 493 243 C 473 222 438 220 412 219 C 387 218 371 214 359 207 Z" fill="#44D995"/>
<path d="M 358 210 C 388 211 409 187 443 183 C 462 181 482 183 493 187 L 493 243 C 470 227 445 224 418 223 C 389 222 370 219 358 210 Z" fill="#00B978"/>
<ellipse cx="416.5" cy="181.2" rx="19" ry="5.4" fill="#06895F" opacity="0.75"/>
<path d="M 416 81 L 416 180" stroke="#061630" stroke-width="7.4" stroke-linecap="round"/>
<path d="M 419.5 88 L 456.5 105.5 Q 458 107 455.4 109 L 419.5 122 Z" fill="#FF526D"/>
<g stroke="#00B77C" stroke-width="5.5" stroke-linecap="round">
<path d="M 452 84 L 459 69"/><path d="M 465 87 L 475 78"/>
</g>
'''

BOTTOM='''
<!-- Contained lower landscape. White card remains visible around profile/logo. -->
<path d="M 19 542 C 46 546 64 574 79 600 C 99 616 141 626 189 618 C 227 611 246 599 277 596 C 313 592 353 609 383 611 C 412 611 441 583 468 574 C 477 570 486 569 493 570 L 493 613 L 19 613 Z" fill="#82E7A9" />
<path d="M 19 562 C 46 573 62 603 85 615 C 123 627 174 630 213 613 C 245 600 263 596 291 601 C 321 605 335 616 371 617 C 411 617 450 584 493 584 L 493 613 L 19 613 Z" fill="#4BD993" />
<path d="M 19 594 C 58 595 69 633 115 635 C 164 637 201 622 238 609 C 275 597 302 605 332 616 C 352 625 363 632 386 634 C 421 641 454 607 493 605 L 493 637 L 19 637 Z" fill="#2ACD83"/>
<path d="M 0 541 C 31 545 44 558 53 587 C 65 611 82 619 93 637 L 0 637 Z" fill="#008B67" />
<path d="M 0 573 C 36 577 58 605 76 637 L 0 637 Z" fill="#0AA879" />
<path d="M 165 637 C 218 624 243 605 287 598 C 338 591 367 619 404 630 C 439 636 458 608 511 605 L 511 637 Z" fill="#03B979"/>
<path d="M 239 637 C 302 595 344 596 395 631 C 423 646 469 602 511 610 L 511 637 Z" fill="#00A36D"/>
<!-- Sprigs: leaves made as simple rounded stems. -->
<g fill="#00B477">
<path d="M 120 610 C 110 603 111 594 116 594 C 121 594 125 605 125 605 C 126 595 132 593 134 598 C 136 603 128 609 127 612 C 136 602 141 606 139 611 C 136 615 129 615 120 610 Z"/>
<path d="M 359 621 C 353 614 354 604 359 605 C 364 605 366 614 366 615 C 368 608 373 605 376 610 C 378 615 369 624 365 625 Z"/>
<path d="M 481 573 C 474 565 476 553 482 557 C 487 560 485 567 485 567 C 489 559 493 559 496 565 C 498 572 491 578 485 580 Z"/>
</g>
'''

BALL='''
<!-- The lower-left dimply ball is a crop of a white circular asset, not a photo. -->
<defs>
  <clipPath id="ballshape"><circle cx="10" cy="610" r="46"/></clipPath>
  <pattern id="dimples" width="14" height="13" patternUnits="userSpaceOnUse">
     <circle cx="5" cy="5" r="3.1" fill="#E5ECEF"/><circle cx="12" cy="11" r="1.2" fill="#EFF3F5"/>
  </pattern>
</defs>
<circle cx="10" cy="610" r="46" fill="#FFFFFF" stroke="#E3EBEC" stroke-width="1.2"/>
<circle cx="10" cy="610" r="45" fill="url(#dimples)" clip-path="url(#ballshape)"/>
'''

SPARKLES='''
<g stroke="#03B77B" stroke-width="5" stroke-linecap="round" fill="none">
  <path d="M 51 95 L 57 103"/><path d="M 40 116 L 54 122"/><path d="M 44 146 L 56 136"/>
  <path d="M 482 482 L 478 496"/><path d="M 497 489 L 487 502"/>
</g>
<g stroke="#FFCA2F" stroke-width="5.6" stroke-linecap="round" fill="none">
  <path d="M 15 415 L 26 433"/><path d="M 6 435 L 23 445"/><path d="M 9 469 L 24 460"/>
</g>
'''
CLOCK='''
<circle cx="25" cy="25" r="25" fill="#FFF1B8"/>
<circle cx="25" cy="25" r="12.6" fill="none" stroke="#071932" stroke-width="3.3"/>
<path d="M 25 17.3 L 25 25 L 30.3 28.1" fill="none" stroke="#071932" stroke-width="3.3" stroke-linecap="round" stroke-linejoin="round"/>
'''

def wrapper(content, box=(0,0,511,637), full=False):
 x,y,w,h=box
 return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="{x} {y} {w} {h}" fill="none">\n{content}\n</svg>'''

def save(name, content, box, scale=3):
 src=wrapper(content,box)
 (SVG/f'{name}.svg').write_text(src,encoding='utf-8')
 try:
  pngbytes=cairosvg.svg2png(bytestring=src.encode(),output_width=box[2]*scale,output_height=box[3]*scale)
  (PNG/f'{name}@3x.png').write_bytes(pngbytes)
  (PNG/f'{name}.png').write_bytes(cairosvg.svg2png(bytestring=src.encode(),output_width=box[2],output_height=box[3]))
 except Exception as ex:
  print('ERROR exporting',name,ex)
  raise

# Native sized components, all anchored to screenshot x/y coordinates.
# To make the curves exactly align, place these at the positions in manifest.json.
save('frame_background', FRAME, (0,0,511,637))
save('sky_clouds', SKY,(258,23,236,137))
save('flag_hills',HILLS_FLAG,(355,75,139,169))
save('bottom_hills',BOTTOM,(0,539,511,98))
save('golf_ball',BALL,(0,563,58,74))
save('sparkles',SPARKLES,(0,0,511,637))
save('clock_badge',CLOCK,(0,0,50,50))
# Full background decoration (no words, logo or user photo).
# background order is important: frame, sky, hills and ball, sparks.
# Bottom art extends beyond the white frame just as in screenshot.
merged=FRAME+SKY+HILLS_FLAG+BOTTOM+BALL+SPARKLES
save('all_decorations',merged,(0,0,511,637))

if SOURCE.exists():
 im=Image.open(SOURCE).convert('RGBA')
 im.save(PRE/'user_reference.png')
 # low-res reference-only sample. Never hardcode the captured avatar in a production component.
 avatar=im.crop((58,528,114,584))
 alpha=Image.new('L',(56,56),0)
 ImageDraw.Draw(alpha).ellipse((0,0,55,55),fill=255)
 avatar.putalpha(alpha)
 avatar.resize((168,168),Image.Resampling.LANCZOS).save(PRE/'avatar_sample_reference_only.png')

manifest={
 'description':'HappyGolf October 2026 card specification, measured approximately from supplied 511x637 raster. All coordinates are design pixels; values are not device dp.',
 'referenceSize':{'width':511,'height':637},
 'preferredExportSize':{'width':1080,'height':1350},
 'colorTokens':C,
 'assets':[
  {'file':'all_decorations','x':0,'y':0,'width':511,'height':637,'layer':0,'note':'Use alone as combined static background instead of placing all individual art pieces'},
  {'file':'frame_background','x':0,'y':0,'width':511,'height':637,'layer':0},
  {'file':'sky_clouds','x':258,'y':23,'width':236,'height':137,'layer':1},
  {'file':'flag_hills','x':355,'y':75,'width':139,'height':169,'layer':2},
  {'file':'bottom_hills','x':0,'y':539,'width':511,'height':98,'layer':3},
  {'file':'golf_ball','x':0,'y':563,'width':58,'height':74,'layer':4},
  {'file':'sparkles','x':0,'y':0,'width':511,'height':637,'layer':5},
  {'file':'clock_badge','x':244,'y':149,'width':50,'height':50,'layer':11},
 ],
 'textBoxes':[
  {'name':'monthYear','x':52,'y':46,'width':215,'height':23,'fontSize':15,'lineHeight':19,'weight':'700','letterSpacing':3.6,'color':C['heading']},
  {'name':'reservationCount','x':66,'y':73,'width':112,'height':113,'fontSize':132,'lineHeight':127,'weight':'900','color':'#00B66E'},
  {'name':'reservationsLabel','x':42,'y':176,'width':185,'height':33,'fontSize':25,'lineHeight':29,'weight':'900','color':C['ink']},
  {'name':'statsSeparator','x':227,'y':119,'width':1.5,'height':93,'color':C['separator']},
  {'name':'timeValue','x':303,'y':153,'width':84,'height':38,'fontSize':32,'lineHeight':37,'weight':'850','color':C['ink']},
  {'name':'timeLabel','x':303,'y':187,'width':84,'height':16,'fontSize':9,'lineHeight':13,'weight':'800','letterSpacing':0.55,'color':C['heading']},
  {'name':'weekdayHeader','x':74,'y':228,'width':360,'height':16,'fontSize':9.5,'lineHeight':12,'weight':'800','color':C['heading']},
  {'name':'footerDivider','x':49,'y':515,'width':414,'height':1,'color':C['separator']},
  {'name':'avatar','x':58,'y':528,'width':56,'height':56,'borderRadius':28},
  {'name':'memberName','x':124,'y':538,'width':192,'height':27,'fontSize':20,'lineHeight':25,'weight':'800','color':C['ink']},
  {'name':'memberSubtitle','x':124,'y':566,'width':170,'height':15,'fontSize':9,'lineHeight':12,'weight':'700','letterSpacing':2.4,'color':C['heading']},
  {'name':'existingHappyGolfLogo','x':320,'y':535,'width':136,'height':43,'fit':'contain','generate':False},
 ],
 'calendar':{
  'x':74,'y':250,'columns':7,'rowsForOctober2026':5,'firstDayOfWeek':'monday',
  'cellWidth':45,'cellHeight':45,'cellRadius':8,'columnGap':7.7,'rowGap':4.5,
  'weekdayHeaderCenters':[96.5,149.2,201.8,254.4,307.0,359.6,412.2],
  'weekdays': ['MON','TUE','WED','THU','FRI','SAT','SUN'],
  'exampleMarkedDays':{'2':'green','6':'green','13':'orange','21':'green','28':'orange'},
  'placeholderFill':C['grid'],'greenFill':C['green'],'orangeFill':C['orange'],
  'dateFontSize':12.5,'dateFontWeight':'500','selectedDateFontWeight':'750',
  'dateTextColor':C['heading'],'selectedDateTextColor':'#FFFFFF',
  'sixWeekMonths':'Use 38px square cells, 5px vertical gaps, center same 7 column slots, keeping bottom limit <=497.'
 },
 'example':{'year':2026,'month':10,'reservationCount':8,'hoursOnCourse':6.7,'displayName':'Alexis DE',
            'daysWithActivity': [2,6,13,21,28],
            'explanation':'Numbers and marked days in screenshot are demonstrative; derive from actual backend data when used in app.'}
}
(SPEC/'measurements.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')

# Render illustration-only image as preview, plus a composite of accurate calendar/text. Do not export a logo asset.
full_svg=(SVG/'all_decorations.svg').read_bytes()
bg=Image.open(io.BytesIO(cairosvg.svg2png(bytestring=full_svg,output_width=1533,output_height=1911))).convert('RGBA')
S=3
font_reg='/usr/share/fonts/opentype/inter/InterDisplay-Regular.otf'
font_med='/usr/share/fonts/opentype/inter/InterDisplay-Medium.otf'
font_bold='/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf'
font_black='/usr/share/fonts/opentype/inter/InterDisplay-Black.otf'
font_extra='/usr/share/fonts/opentype/inter/InterDisplay-ExtraBold.otf'

def font(size,path=font_reg): return ImageFont.truetype(path, int(size*S))
layer=Image.new('RGBA',bg.size,(0,0,0,0))
d=ImageDraw.Draw(layer)
def text(x,y,st,size,color,weight='regular',anchor=None):
    f={'regular':font_reg,'medium':font_med,'bold':font_bold,'black':font_black,'extra':font_extra}[weight]
    d.text((x*S,y*S),st,font=font(size,f),fill=color,anchor=anchor,stroke_width=0)

def tracked(txt,x,y,size,spacing,col='heading',weight='bold'):
    xx=x
    f=font(size,font_bold if weight=='bold' else font_med)
    for ch in txt:
        d.text((int(xx*S),int(y*S)),ch,font=f,fill=C.get(col,col))
        xx+=d.textlength(ch,font=f)/S+spacing

tracked('OCTOBER 2026',52,44,14.7,3.5)
# Shared metrics
text(68,45,'8',132,'#00B66E','black')
text(42,172,'reservations',25,C['ink'],'black')
d.rectangle((int(227*S),int(119*S),int(228*S),int(211*S)),fill=C['separator'])
clock_im=Image.open(PNG/'clock_badge@3x.png').convert('RGBA')
layer.alpha_composite(clock_im,(244*S,149*S))
d=ImageDraw.Draw(layer)
text(303,148,'6.7h',32,C['ink'],'extra')
tracked('ON COURSE',303,184,9,0.55,C['heading'])
# weekdays and day cells
weekdays=['MON','TUE','WED','THU','FRI','SAT','SUN']
for i,name in enumerate(weekdays):
    xx=(74+(45+7.7)*i+22.5)*S
    d.text((int(xx),int(236*S)),name,font=font(9.3,font_bold),fill=C['heading'],anchor='mm')
weekrows=calendar.monthcalendar(2026,10)
colored={2:'green',6:'green',13:'orange',21:'green',28:'orange'}
for ri,week in enumerate(weekrows):
 for ci,date in enumerate(week):
    x=(74+(45+7.7)*ci)*S; y=(250+(45+4.5)*ri)*S
    fill=C.get(colored.get(date,'grid'),C['grid'])
    d.rounded_rectangle((round(x),round(y),round(x+45*S),round(y+45*S)),radius=8*S,fill=fill)
    if date:
      d.text((round(x+45*S/2),round(y+45*S/2)),str(date),font=font(12.4,font_bold if date in colored else font_med),
             fill='#FFFFFF' if date in colored else C['heading'],anchor='mm')
# divider and text
d.line(((49*S,515*S),(463*S,515*S)),fill=C['separator'],width=3)
if (PRE/'avatar_sample_reference_only.png').exists():
    avatar=Image.open(PRE/'avatar_sample_reference_only.png').convert('RGBA')
    layer.alpha_composite(avatar,(58*S,528*S))
d=ImageDraw.Draw(layer)
text(124,533,'Alexis DE',20,C['ink'],'extra')
tracked('ON HAPPY GOLF',124,562,8.2,2.2,C['heading'])
# We do not redraw or include the existing HappyGolf logo, but show its reserved region.
# Give the placeholder unobtrusive dash border in reference preview only.
d.rounded_rectangle((320*S,537*S,456*S,577*S),radius=3*S,outline='#B8C6CF',width=2)
text(388,547,'Existing app logo',8.7,'#8593A7','medium',anchor='mt')
result=Image.alpha_composite(bg,layer)
result.resize((1022,1274),Image.Resampling.LANCZOS).save(PRE/'rendered_preview_no_logo.png')
# Visual-only mock with original logo pixels from user's own reference (not a generated/exported logo asset).
if SOURCE.exists():
    photo=Image.open(SOURCE).convert('RGBA').resize((1533,1911),Image.Resampling.LANCZOS)
    # restore the actual reference logo rectangle over placeholder on rendered preview
    composite=Image.alpha_composite(bg,layer)
    dcomp=ImageDraw.Draw(composite)
    dcomp.rounded_rectangle((319*S,535*S,458*S,580*S),radius=4*S,fill='#FEFEFE')
    region=photo.crop((318*S,533*S,460*S,580*S))
    composite.alpha_composite(region,(318*S,533*S))
    composite.resize((1022,1274),Image.Resampling.LANCZOS).save(PRE/'visual_mock_with_original_logo.png')

print('Created',len(list(SVG.glob('*.svg'))),'SVG assets and',len(list(PNG.glob('*.png'))),'PNG 3x exports.')
