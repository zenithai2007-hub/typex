/* TYPE X — AI provider: local (simulated). Genuinely works offline.
   Implements: TypeX.aiProviders.local = { name:'local', generate(opts) }
   opts: { instruction, contextText, style{tone,language,length,format}, signal, onToken }
   signal: { cancelled:boolean }. Returns Promise<string> (full text).
*/
(function(){
  const T = window.TypeX;
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  /* ---------- task detection ---------- */
  const TYPES = [
    {id:'email',   w:['email','mail','newsletter']},
    {id:'reply',   w:['reply','respond','response','answer','customer']},
    {id:'rewrite', w:['rewrite','reword','rephrase','paraphrase','polish','improve writing']},
    {id:'translate',w:['translate','translation','urdu','hindi','spanish','french','arabic','german']},
    {id:'caption', w:['caption','instagram','tiktok','reel']},
    {id:'summary', w:['summar','summarize','tldr','key points','brief me']},
    {id:'proposal',w:['proposal','pitch deck','quote for','bid']},
    {id:'message', w:['message','dm','text him','text her','whatsapp','outreach']},
    {id:'ideas',   w:['ideas','brainstorm','suggest','topics','angles']},
    {id:'grammar', w:['grammar','spell','correct','proofread','fix']},
    {id:'script',  w:['script','video script','dialogue']},
    {id:'apply',   w:['job application','cover letter','resume','cv']},
    {id:'followup',w:['follow-up','follow up','followup','reminder']},
    {id:'social',  w:['post','tweet','linkedin post','social media','announcement']},
    {id:'format',  w:['format','organize','structure','bullet','list out']}
  ];
  function detectType(instr){
    const s = ' ' + instr.toLowerCase() + ' ';
    let best = 'general', bestScore = 0;
    TYPES.forEach(t => {
      let sc = 0;
      t.w.forEach(w => { if (s.indexOf(w) >= 0) sc += w.length; });
      if (sc > bestScore){ bestScore = sc; best = t.id; }
    });
    return best;
  }

  /* ---------- target extraction ---------- */
  function extractTarget(instr, ctx){
    let m = instr.match(/["“”](.+?)["“”]/s);
    if (m) return m[1].trim();
    m = instr.match(/(?:about|regarding|for|re:|subject:?)\s*[:\-]?\s*(.+)$/i);
    if (m && m[1].trim().length > 3 && m[1].length < 160) return m[1].trim().replace(/[.\s]+$/,'');
    if (ctx && ctx.trim().length > 10) return ctx.trim().slice(0, 600);
    const cleaned = instr.replace(/^(please\s+)?(write|create|draft|generate|make|compose)\b/i,'').trim();
    return cleaned.length > 4 ? cleaned : 'your request';
  }

  /* ---------- language packs ---------- */
  const L = {
    'English': {
      hello:['Hi','Hello','Hey there'], thanks:'Thanks for reaching out.',
      sign:['Best regards','Warm regards','Kind regards'], you:'you', team:'we',
      follow:'Looking forward to hearing from you.', sorry:'Sorry about that —',
      here:'Here is a clean version:', key:'Key points:', idea:'Here are some ideas:',
      avail:'Happy to jump on a quick call if helpful.'
    },
    'Roman Urdu': {
      hello:['Assalam-o-Alaikum','Salam','Hello'], thanks:'Rabta karne ka shukriya.',
      sign:['Shukriya','Best regards','Khuda Hafiz'], you:'aap', team:'hum',
      follow:'Aap ke jawab ka intezar rahega.', sorry:'Is ke liye mazrat —',
      here:'Yeh rahi saaf suthri version:', key:'Ahem points:', idea:'Kuch ideas yeh hain:',
      avail:'Agar chahen to hum call par bhi baat kar sakte hain.'
    },
    'Urdu': {
      hello:['السلام علیکم','آداب'], thanks:'رابطہ کرنے کا شکریہ۔',
      sign:['شکریہ','نیک تمنائیں'], you:'آپ', team:'ہم',
      follow:'آپ کے جواب کا انتظار رہے گا۔', sorry:'اس کے لیے معذرت —',
      here:'یہ رہی صاف ستھری عبارت:', key:'اہم نکات:', idea:'کچھ آئیڈیاز یہ ہیں:',
      avail:'اگر چاہیں تو ہم کال پر بھی بات کر سکتے ہیں۔'
    }
  };
  function pack(lang){ return L[lang] || L['English']; }

  /* ---------- tone shaping ---------- */
  function toneLine(tone, kind, p){
    const TONE = {
      'Professional':{open:p.hello[1]+',', close:p.sign[0]+','},
      'Friendly':{open:p.hello[2]+'!', close:'Cheers,'},
      'Casual':{open:'Hey!', close:'Take care,'},
      'Formal':{open:'Dear Sir/Madam,', close:'Yours faithfully,'},
      'Persuasive':{open:p.hello[1]+' — quick one,', close:'Worth 10 minutes?'},
      'Confident':{open:p.hello[0]+'.', close:'Let\u2019s get it done.'},
      'Funny':{open:'Well hello there!', close:'Stay awesome,'},
      'Simple':{open:p.hello[0]+',', close:p.sign[0]+','},
      'Technical':{open:p.hello[1]+',', close:p.sign[2]+','}
    };
    const t = TONE[tone] || TONE['Professional'];
    return kind === 'open' ? t.open : t.close;
  }
  function pick(arr, seed){ return arr[Math.abs(seed) % arr.length]; }

  /* ---------- localized sentence banks (Roman Urdu + Urdu) ---------- */
  const LANG_BANK = {
    'Roman Urdu': {
      email:['{t} ke baare mein ek zaroori update share karna chahta hoon.','Sab kuch schedule par hai, aur {team} aap ko next steps se agah rakhenge.','Agar {t} ke baare mein koi sawal ho to zaroor batayen.'],
      reply:['Rabta karne ka shukriya. {t} ke hawale se yeh confirm kar sakta hoon.','Hum ne is par ghor kiya hai aur behtareen rasta wazeh hai.','Agar {t} ke baare mein kuch aur wazeh karna ho to batayen, foran hal kar dunga.'],
      message:['{t} par ek quick note — mere khayal mein is ka ek smart hal hai.','Aage barhne se pehle aap ki raye darkar hai.','Agar chahen to hum call par bhi baat kar sakte hain.'],
      caption:['POV: {t} ab samajh aa gaya.','Ise save kar len — baad mein kaam ayega.','Chote steps, bare results. #TypeX #Productivity'],
      summary:['{t} ki asal baat teen cheezon par hai: wazeh hona, sahi waqt, aur follow-through.','Zyada tar value pehle faisle mein hai — woh durust karen, baqi khud ho jayega.','Khulasa: {t} par is hafte amal karen, agle quarter mein nahi.'],
      proposal:['Yeh proposal {t} ko mukammal cover karta hai: scope, timeline aur pricing.','Hum wazeh milestones mein deliver karenge taake aap ko hamesha maloom ho kaam kahan hai.','Maqsad simple hai — pehle 30 din mein {t} se measurable results.'],
      ideas:['Pehla angle: {t} ko before/after story banayen.','Dusra angle: woh ek sawal jo sab {t} ke baare mein poochte hain.','Teesra angle: {t} ko ek short checklist banayen jo log save karen.'],
      social:['{t} par bari update — kya badla aur kyun zaroori hai, yeh raha.','Aksar log {t} ko overthink karte hain. Simple rakhen: shuru karen, measure karen, adjust karen.','Kya khayal hai? Comment karen — main har ek parhta hoon.'],
      followup:['Bas follow-up kar raha hoon — {t} ke baare mein koi raye?','Koi jaldi nahi; jab aap tayyar hon, main ek message ki doori par hoon.','Aap ke jawab ka intezar rahega.'],
      general:['{t} par kaam shuru kar diya hai — yeh raha pehla draft.','Agar kisi hissa mein tabdeeli chahiye to batayen, foran update kar dunga.','Aap ke jawab ka intezar rahega.']
    },
    'Urdu': {
      email:['{t} کے بارے میں ایک ضروری اپ ڈیٹ شیئر کرنا چاہتا ہوں۔','سب کچھ شیڈول پر ہے، اور {team} آپ کو اگلے مراحل سے آگاہ رکھیں گے۔','اگر {t} کے بارے میں کوئی سوال ہو تو ضرور بتائیں۔'],
      reply:['رابطہ کرنے کا شکریہ۔ {t} کے حوالے سے یہ کنفرم کر سکتا ہوں۔','ہم نے اس پر غور کیا ہے اور بہترین راستہ واضح ہے۔','اگر {t} کے بارے میں کچھ مزید واضح کرنا ہو تو بتائیں، فوراً حل کر دوں گا۔'],
      message:['{t} پر ایک مختصر نوٹ — میرے خیال میں اس کا ایک اچھا حل ہے۔','آگے بڑھنے سے پہلے آپ کی رائے درکار ہے۔','اگر چاہیں تو ہم کال پر بھی بات کر سکتے ہیں۔'],
      caption:['{t} اب سمجھ آ گیا۔','اسے سیو کر لیں — بعد میں کام آئے گا۔','چھوٹے قدم، بڑے نتائج۔ #TypeX'],
      summary:['{t} کی اصل بات تین چیزوں پر ہے: وضاحت، صحیح وقت، اور فالو تھرو۔','زیادہ تر ویلیو پہلے فیصلے میں ہے۔','خلاصہ: {t} پر اس ہفتے عمل کریں۔'],
      proposal:['یہ پروپوزل {t} کو مکمل کور کرتا ہے: اسکوپ، ٹائم لائن اور پرائسنگ۔','ہم واضح مائیل اسٹونز میں ڈیلیور کریں گے۔','مقصد آسان ہے — پہلے 30 دن میں {t} سے ٹھوس نتائج۔'],
      ideas:['پہلا اینگل: {t} کو before/after کہانی بنائیں۔','دوسرا اینگل: وہ ایک سوال جو سب {t} کے بارے میں پوچھتے ہیں۔','تیسرا اینگل: {t} کی چیک لسٹ بنائیں جو لوگ سیو کریں۔'],
      social:['{t} پر بڑی اپ ڈیٹ — کیا بدلا اور کیوں ضروری ہے۔','اکثر لوگ {t} کو overthink کرتے ہیں۔ آسان رکھیں۔','کیا خیال ہے؟ کمنٹ کریں۔'],
      followup:['بس فالو اپ کر رہا ہوں — {t} کے بارے میں کوئی رائے؟','کوئی جلدی نہیں؛ جب آپ تیار ہوں، میں ایک پیغام کی دوری پر ہوں۔','آپ کے جواب کا انتظار رہے گا۔'],
      general:['{t} پر کام شروع کر دیا ہے — یہ رہا پہلا ڈرافٹ۔','اگر کسی حصے میں تبدیلی چاہیے تو بتائیں۔','آپ کے جواب کا انتظار رہے گا۔']
    }
  };

  /* ---------- core builders ---------- */
  function sentenceFor(type, target, p, tone, i, lang){
    const you = p.you, team = p.team;
    const bank = {
      email:[
        'I wanted to share a quick update regarding ' + target + '.',
        'Everything is on track, and ' + team + ' will keep ' + you + ' posted on next steps.',
        'Please let me know if ' + you + ' have any questions about ' + target + '.'
      ],
      reply:[
        p.thanks + ' Regarding ' + target + ', here is what I can confirm.',
        team.charAt(0).toUpperCase()+team.slice(1) + ' have looked into this and the best path forward is clear.',
        'If anything about ' + target + ' is still unclear, just tell me and I will sort it right away.'
      ],
      message:[
        'Quick note on ' + target + ' — I think there is a smart way to handle this.',
        'Would love your take before ' + team + ' move ahead.',
        p.avail
      ],
      caption:[
        'POV: ' + target + ' finally makes sense.',
        'Save this for later — ' + you + ' will thank yourself.',
        'Small steps, big results. #TypeX #Productivity'
      ],
      summary:[
        'The core of ' + target + ' comes down to three things: clarity, timing, and follow-through.',
        'Most of the value sits in the first decision — get that right and the rest follows.',
        'Bottom line: act on ' + target + ' this week, not next quarter.'
      ],
      proposal:[
        'This proposal covers ' + target + ' end to end: scope, timeline, and pricing.',
        team.charAt(0).toUpperCase()+team.slice(1) + ' will deliver in clear milestones so ' + you + ' always know where things stand.',
        'The goal is simple — measurable results from ' + target + ' within the first 30 days.'
      ],
      ideas:[
        'Angle one: frame ' + target + ' as a before/after story.',
        'Angle two: answer the single question everyone asks about ' + target + '.',
        'Angle three: turn ' + target + ' into a short checklist people can save.'
      ],
      social:[
        'Big update on ' + target + ' — here is what changed and why it matters.',
        'Most people overthink ' + target + '. Keep it simple: start, measure, adjust.',
        'Thoughts? Drop a comment — I read every one.'
      ],
      script:[
        '[HOOK] ' + target + ' — in the next 60 seconds, everything clicks.',
        '[BODY] Here is the part nobody tells ' + you + ' about ' + target + '.',
        '[CTA] Try it today and see the difference.'
      ],
      apply:[
        'I am excited to apply — my experience maps directly onto ' + target + '.',
        'In my last role I owned outcomes like these end to end, and I bring that same ownership here.',
        'I would welcome the chance to discuss how I can contribute from day one.'
      ],
      followup:[
        'Just floating this back up — any thoughts on ' + target + '?',
        'No rush at all; whenever ' + you + ' are ready, I am one message away.',
        p.follow
      ]
    };
    const arr = bank[type] || bank.message;
    const lb = LANG_BANK[lang] && (LANG_BANK[lang][type] || LANG_BANK[lang].general);
    const src = lb || arr;
    const raw = pick(src, target.length + i * 7 + type.length);
    return raw.split('{t}').join(target).split('{team}').join(team).split('{you}').join(you);
  }

  function buildBody(type, target, style){
    const p = pack(style.language);
    const tone = style.tone || 'Professional';
    const len = style.length || 'Medium';
    const n = len === 'Short' ? 2 : len === 'Long' ? 6 : 3;
    const out = [];
    for (let i = 0; i < n; i++) out.push(sentenceFor(type, target, p, tone, i, style.language));
    return {lines: out, pack: p};
  }

  function applyFormat(type, body, style, target, instr){
    const p = body.pack, lines = body.lines, tone = style.tone || 'Professional';
    const open = toneLine(tone, 'open', p), close = toneLine(tone, 'close', p);
    const fmt = style.format || 'Paragraphs';
    if (type === 'translate') return translateText(instr, style);
    if (type === 'grammar' || type === 'rewrite'){
      const src = extractTarget(instr, '');
      const cleaned = src.replace(/\s+/g,' ').replace(/\bi\b/g,'I').trim();
      const head = p.here;
      if (fmt === 'Bullets' || fmt === 'Numbered List'){
        const items = type === 'grammar'
          ? ['Fixed capitalization and spacing.', 'Tightened sentence structure.', 'Kept your original meaning intact.']
          : ['Clearer and more direct wording.', 'Stronger, more professional tone.', 'Same meaning, better flow.'];
        return head + '\n\n' + cleaned.charAt(0).toUpperCase() + cleaned.slice(1) +
          '\n\n' + items.map((x,i)=> fmt==='Bullets' ? '• ' + x : (i+1) + '. ' + x).join('\n');
      }
      return head + '\n\n' + cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
    switch(fmt){
      case 'Bullets': return lines.map(x => '• ' + x).join('\n');
      case 'Numbered List': return lines.map((x,i) => (i+1) + '. ' + x).join('\n');
      case 'Email': {
        const subj = target.length > 60 ? target.slice(0,57) + '...' : target;
        return 'Subject: ' + subj.charAt(0).toUpperCase() + subj.slice(1) + '\n\n' + open + '\n\n' +
          lines.join('\n\n') + '\n\n' + close + '\nType X';
      }
      case 'Social Media': return lines.join('\n\n') + '\n\n#TypeX #AI #Productivity';
      case 'Plain Text': return lines.join(' ');
      default: return open + ' ' + lines.join(' ') + '\n\n' + close + '\nType X';
    }
  }

  /* ---------- tiny genuine translator (en <-> roman <-> ur) ---------- */
  const DICT = [
    ['hello','salam','السلام علیکم'],['hi','salam','سلام'],['thank you','shukriya','شکریہ'],
    ['thanks','shukriya','شکریہ'],['please','meherbani','مہربانی'],['yes','jee haan','جی ہاں'],
    ['no','nahein','نہیں'],['good','acha','اچھا'],['morning','subah','صبح'],
    ['how are you','aap kaise hain','آپ کیسے ہیں'],['welcome','khush aamdeed','خوش آمدید'],
    ['friend','dost','دوست'],['work','kaam','کام'],['time','waqt','وقت'],
    ['today','aaj','آج'],['tomorrow','kal','کل'],['price','qeemat','قیمت'],
    ['message','paigham','پیغام'],['reply','jawab','جواب'],['email','email','ای میل'],
    ['business','karobar','کاروبار'],['customer','gahak','گاہک']
  ];
  function translateText(instr, style){
    let src = extractTarget(instr, '');
    const lang = style.language || 'English';
    const lower = src.toLowerCase();
    let out = src;
    DICT.slice().sort((a,b)=>b[0].length-a[0].length).forEach(row => {
      const [en, ro, ur] = row;
      const tgt = lang === 'Urdu' ? ur : lang === 'Roman Urdu' ? ro : en;
      const re = new RegExp('\\b' + en.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + '\\b', 'gi');
      out = out.replace(re, tgt);
    });
    const note = lang === 'English' ? '' :
      '\n\n—\nTranslated toward ' + lang + ' (v1 demo dictionary; full neural translation arrives with the Phase-2 backend).';
    return out + note;
  }

  /* ---------- public generate ---------- */
  async function generate(opts){
    const instr = (opts.instruction || '').trim();
    if (!instr) throw new Error('empty');
    if (/^\s*test error\b/i.test(instr)){ await sleep(700); throw new Error('simulated'); }
    const style = Object.assign({tone:'Professional', language:'English', length:'Medium', format:'Paragraphs'}, opts.style||{});
    const type = detectType(instr);
    const target = extractTarget(instr, opts.contextText || '');
    await sleep(450 + Math.random()*350); // "understanding" beat
    if (opts.signal && opts.signal.cancelled) throw new Error('cancelled');
    const body = buildBody(type, target, style);
    const text = applyFormat(type, body, style, target, instr);
    // stream tokens
    const tokens = text.match(/\S+\s*/g) || [text];
    let acc = '';
    for (const tk of tokens){
      if (opts.signal && opts.signal.cancelled) throw new Error('cancelled');
      acc += tk;
      if (opts.onToken) opts.onToken(tk, acc);
      await sleep(14 + Math.random()*22);
    }
    return acc;
  }

  T.aiProviders = T.aiProviders || {};
  T.aiProviders.local = { name:'local', label:'Type X Local Engine', generate, detectType };
})();
