/* CLINT X — localStorage persistence + seed data. */
(function(){
  const T = window.TypeX;
  const P = 'typex_';
  const store = {
    get(k, fb){
      try {
        const raw = localStorage.getItem(P + k);
        if (raw == null) return fb;
        return JSON.parse(raw);
      } catch(e){ return fb; }
    },
    set(k, v){ try { localStorage.setItem(P + k, JSON.stringify(v)); } catch(e){} },
    del(k){ localStorage.removeItem(P + k); },
    clearAll(){ Object.keys(localStorage).filter(k=>k.indexOf(P)===0).forEach(k=>localStorage.removeItem(k)); }
  };

  const DEFAULT_SETTINGS = {
    showIntro: true,
    requireApproval: true,
    previewBeforeAction: true,
    rememberStyle: true,
    saveHistory: true,
    defaultLanguage: 'English',
    defaultTone: 'Professional',
    defaultLength: 'Medium',
    defaultFormat: 'Paragraphs',
    activeStyleId: null,
    notifications: true,
    provider: 'local'
  };

  function seedTemplates(){
    const S = (tone,language,length,format) => ({tone,language,length,format});
    return [
      {id:'tpl-email', name:'Professional Email', category:'Writing', icon:'mail',
       prompt:'Write a professional email about: {topic}', style:S('Professional','English','Medium','Email')},
      {id:'tpl-reply', name:'Customer Reply', category:'Communication', icon:'msg',
       prompt:'Write a professional but friendly reply to this customer message: {message}', style:S('Friendly','English','Short','Paragraphs')},
      {id:'tpl-job', name:'Job Application', category:'Writing', icon:'doc',
       prompt:'Write a compelling job application cover letter for this role: {role}', style:S('Professional','English','Medium','Email')},
      {id:'tpl-proposal', name:'Proposal', category:'Writing', icon:'doc',
       prompt:'Draft a clear business proposal for: {project}', style:S('Persuasive','English','Long','Paragraphs')},
      {id:'tpl-linkedin', name:'LinkedIn Response', category:'Communication', icon:'users',
       prompt:'Write a professional LinkedIn reply to: {message}', style:S('Professional','English','Short','Paragraphs')},
      {id:'tpl-caption', name:'Instagram Caption', category:'Creative', icon:'star',
       prompt:'Write an engaging Instagram caption about: {topic}', style:S('Funny','English','Short','Social Media')},
      {id:'tpl-reddit', name:'Reddit Response', category:'Communication', icon:'msg',
       prompt:'Write a helpful, natural Reddit reply to this post: {post}', style:S('Casual','English','Medium','Paragraphs')},
      {id:'tpl-translate', name:'Translation', category:'Language', icon:'translate',
       prompt:'Translate this text: {text}', style:S('Simple','Roman Urdu','Medium','Plain Text')},
      {id:'tpl-rewrite', name:'Rewrite', category:'Rewriting', icon:'refresh',
       prompt:'Rewrite this text to be clearer and more professional: {text}', style:S('Professional','English','Medium','Paragraphs')},
      {id:'tpl-summary', name:'Summary', category:'Productivity', icon:'list',
       prompt:'Summarize the key points of: {text}', style:S('Simple','English','Short','Bullets')},
      {id:'tpl-marketing', name:'Marketing Copy', category:'Creative', icon:'bolt',
       prompt:'Write persuasive marketing copy for: {product}', style:S('Persuasive','English','Medium','Social Media')},
      {id:'tpl-followup', name:'Follow-up', category:'Communication', icon:'send',
       prompt:'Write a polite follow-up message about: {topic}', style:S('Friendly','English','Short','Email')}
    ];
  }

  function seedStyles(){
    return [
      {id:'sty-pro', name:'My Professional Style', tone:'Professional + Friendly', language:'English',
       length:'Medium', format:'Paragraphs', active:true,
       rules:['Clear','Concise','Friendly','No unnecessary words']},
      {id:'sty-punchy', name:'Short & Punchy', tone:'Confident', language:'English',
       length:'Short', format:'Bullets', active:false,
       rules:['One idea per line','Strong verbs','No filler']}
    ];
  }

  function seedLeads(){
    const now = Date.now(), d = 864e5;
    return [
      {id:'lead-1', name:'Sarah Mitchell', platform:'LinkedIn', context:'Marketing manager at a DTC skincare brand; posted about needing help with email campaigns.',
       status:'Replied', lastContact: now-1*d, nextFollowUp: now+1*d,
       message:'Hi Sarah, I noticed your post about scaling your email campaigns — that is exactly where CLINT X helps teams like yours. It drafts on-brand emails in your voice in seconds. Would a quick 10-minute demo be useful this week?'},
      {id:'lead-2', name:'David Okafor', platform:'Upwork', context:'Startup founder hiring for customer-support copy; job post mentions slow response times.',
       status:'Draft Ready', lastContact: now-2*d, nextFollowUp: now+1*d,
       message:'Hi David, I saw your post about improving support response times. CLINT X drafts accurate, friendly replies from your own knowledge base so your team answers in seconds, not hours. Open to a short walkthrough?'},
      {id:'lead-3', name:'Amelia Hart', platform:'Email', context:'Real-estate agent; wants faster follow-ups with new listings.',
       status:'Sent', lastContact: now-3*d, nextFollowUp: now+2*d,
       message:'Hi Amelia, new listings move fast — CLINT X helps you send polished, personal follow-ups the moment a lead comes in. Happy to show you how it works on your actual listings.'},
      {id:'lead-4', name:'Jonas Weber', platform:'LinkedIn', context:'SaaS sales lead; team writes 50+ outreach messages daily.',
       status:'New', lastContact: null, nextFollowUp: now+1*d, message:''},
      {id:'lead-5', name:'Priya Nair', platform:'Instagram', context:'Content creator; struggles with captions in two languages.',
       status:'Analyzing', lastContact: null, nextFollowUp: now+2*d, message:''},
      {id:'lead-6', name:'Marcus Chen', platform:'Email', context:'Recruiter; needs personalized outreach at scale without sounding robotic.',
       status:'Approved', lastContact: now-1*d, nextFollowUp: now+1*d,
       message:'Hi Marcus, personalized outreach at scale is a tough balance. CLINT X writes each message around the candidate\u2019s actual background, so nothing sounds templated. Worth a 10-minute look?'},
      {id:'lead-7', name:'Elena Petrova', platform:'Fiverr', context:'Freelance designer; wants better client proposals.',
       status:'Follow-up', lastContact: now-6*d, nextFollowUp: now,
       message:'Hi Elena, just following up — CLINT X can turn your past wins into sharp, persuasive proposals in minutes. Still interested in seeing it on your own projects?'},
      {id:'lead-8', name:'Tom Becker', platform:'LinkedIn', context:'Support lead at a mid-size retailer; evaluating AI tools this quarter.',
       status:'Completed', lastContact: now-9*d, nextFollowUp: null,
       message:'Hi Tom, thanks for the chat — as discussed, CLINT X plugs into your support workflow and drafts replies your agents approve in one click. Sharing the trial link as promised.'}
    ];
  }

  function seedAutomations(){
    return [
      {id:'auto-1', name:'New message auto-draft', enabled:true,
       steps:[
         {type:'trigger', title:'New message detected', desc:'Watches the connected inbox for new relevant messages.'},
         {type:'condition', title:'Matches criteria', desc:'From a lead or customer, not spam or auto-reply.'},
         {type:'ai', title:'Analyze with CLINT X', desc:'Understands intent, context and the right tone.'},
         {type:'output', title:'Generate personalized output', desc:'Drafts the reply in your saved writing style.'},
         {type:'approval', title:'Require approval', desc:'You review and approve before anything goes out.'},
         {type:'action', title:'Type / send', desc:'Sends via the connected channel, or assisted mode.'}
       ],
       createdAt: Date.now()}
    ];
  }

  function init(){
    if (!store.get('settings')) store.set('settings', DEFAULT_SETTINGS);
    if (!store.get('templates')) store.set('templates', seedTemplates());
    if (!store.get('styles')) store.set('styles', seedStyles());
    if (!store.get('leads')) store.set('leads', seedLeads());
    if (!store.get('automations')) store.set('automations', seedAutomations());
    if (!store.get('history')) store.set('history', []);
    if (!store.get('usage')) store.set('usage',
      {tasksCompleted:0, outputsGenerated:0, timeSavedMin:0, messagesPrepared:0, messagesSent:0, approvedActions:0, replies:0});
  }

  T.store = store;
  T.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
  T.storeInit = init;
})();
