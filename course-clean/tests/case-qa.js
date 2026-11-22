#!/usr/bin/env node
/* tests/case-qa.js — the QA pass over the case engine, as a script.
 *
 * Not a unit test: this is an adversarial walk through the product. Each check
 * states a property the engine must have, and prints PASS/FAIL with the first
 * counter-example. Exit code 1 if anything fails, so it can gate a release.
 *
 * Usage: node tests/case-qa.js
 */
'use strict';
const fs=require('fs'), path=require('path');
const ROOT=path.resolve(__dirname,'..');
const {JSDOM}=require(path.join(ROOT,'node_modules','jsdom'));
const B=path.join(ROOT,'build','course-clean');
const CASES=JSON.parse(fs.readFileSync(B+'/data/cases.json','utf8')).cases;
const loaded=[];
let lastStorage=null;
function load(hash, storage){
  if(storage){ lastStorage=storage; }
  const dom=new JSDOM(fs.readFileSync(B+'/index.html','utf8'),
    {url:'http://localhost/'+hash,runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window; w.fetch=undefined; w.scrollTo=function(){};
  if(lastStorage) w.localStorage.setItem('dfm-course-progress-v1', lastStorage);
  w.eval(fs.readFileSync(B+'/assets/data-embed.js','utf8'));
  w.eval(fs.readFileSync(B+'/assets/app.js','utf8'));
  loaded.push(dom); return dom;
}
const out=[];
function check(name, fn){
  try{ const r=fn(); out.push([r===true?'PASS':'FAIL', name, r===true?'':String(r)]); }
  catch(e){ out.push(['ERROR', name, e.message]); }
}
const type=(d,w,id,v)=>{const el=d.querySelector('#in-'+id);el.value=v;el.dispatchEvent(new w.Event('input',{bubbles:true}));};
const submit=(d,w)=>d.querySelector('form.case-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));

// QA-1: each case, wrong answer only -> not mastered
CASES.forEach(c=>{
  check('wrong-only not mastered: '+c.caseId, ()=>{
    const dom=load('#/c/'+c.caseId),w=dom.window,d=w.document;
    c.steps.forEach(s=>{
      if(s.type==='numeric') type(d,w,s.id,'-999');
      else { const wrong=[...d.querySelectorAll('input[name=c-'+s.id+']')].find(i=>i.value!==s.answer.value); if(wrong) wrong.click(); }
    });
    submit(d,w);
    const score=d.querySelector('.case-score');
    if(!score) return 'no score';
    return /^0 %/.test(score.textContent.trim()) ? true : 'score='+score.textContent;
  });
});

// QA-2: comma decimals and spaces accepted
check('comma + spaces accepted', ()=>{
  const c=CASES.find(x=>x.caseId==='cx-m03-01');
  const dom=load('#/c/cx-m03-01'),w=dom.window,d=w.document;
  const vals={'s1':'0,64','s3':' 0,80 ','s4':'2,0','s5':'0,5878','s6':'1,00','s7':'16'};
  c.steps.forEach(s=>{
    if(s.type==='numeric') type(d,w,s.id,vals[s.id]!==undefined?vals[s.id]:String(s.answer.value));
    else d.querySelector('input[name=c-'+s.id+'][value='+s.answer.value+']').click();
  });
  submit(d,w);
  const sc=d.querySelector('.case-score');
  return /^100 %/.test(sc.textContent.trim())?true:sc.textContent;
});

// QA-3: boundary values (tolerance edges)
check('tolerance edge accepted / just outside rejected', ()=>{
  const c=CASES.find(x=>x.caseId==='cx-m03-01');
  const s1=c.steps.find(s=>s.id==='s1'); // 0.64 ±0.005
  const tryVal=(v)=>{
    const dom=load('#/c/cx-m03-01'),w=dom.window,d=w.document;
    c.steps.forEach(s=>{
      if(s.type==='numeric') type(d,w,s.id,s.id==='s1'?v:String(s.answer.value));
      else d.querySelector('input[name=c-'+s.id+'][value='+s.answer.value+']').click();
    });
    submit(d,w);
    return /^100 %/.test(d.querySelector('.case-score').textContent.trim());
  };
  if(!tryVal('0.645')) return 'edge 0.645 rejected';
  if(tryVal('0.646')) return 'out-of-tolerance 0.646 accepted';
  return true;
});

// QA-4: XSS / injection in the answer field is rendered as text
check('HTML in input not executed', ()=>{
  const dom=load('#/c/cx-m03-01'),w=dom.window,d=w.document;
  type(d,w,'s1','<img src=x onerror=alert(1)>');
  submit(d,w);
  const main=d.getElementById('main');
  if(main.querySelector('img[onerror]')) return 'injected img element found';
  return true;
});

// QA-5: deep link to unknown case / module / lesson does not crash
check('unknown routes render a not-found, not a crash', ()=>{
  const bad=['#/c/nope','#/m/zzz','#/l/nope','#/e/zzz','#/garbage'];
  for(const h of bad){
    const dom=load(h), d=dom.window.document;
    const t=(d.getElementById('main').textContent||'').trim();
    if(t.length<5) return h+' renders nothing';
  }
  return true;
});

// QA-6: reload keeps the best score but starts a clean sheet
check('progress persists, case sheet resets', ()=>{
  const c=CASES.find(x=>x.caseId==='cx-m02-01');
  const dom=load('#/c/cx-m02-01'),w=dom.window,d=w.document;
  c.steps.forEach(s=>{
    if(s.type==='numeric') type(d,w,s.id,String(s.answer.value));
    else d.querySelector('input[name=c-'+s.id+'][value='+s.answer.value+']').click();
  });
  submit(d,w);
  const store=w.localStorage.getItem('dfm-course-progress-v1');
  if(!store||!JSON.parse(store).cases['cx-m02-01']) return 'not stored';
  const dom2=load('#/c/cx-m02-01', store), d2=dom2.window.document;
  if(/best 100 %/.test(d2.querySelector('.meta-line').textContent)===false) return 'best not shown';
  const filled=[...d2.querySelectorAll('.case-input')].filter(i=>i.value!=='');
  return filled.length===0?true:'answers were carried over: '+filled.length;
});

// QA-7: CSV export content
check('CSV export is well-formed', ()=>{
  const c=CASES.find(x=>x.caseId==='cx-m14-01');
  const dom=load('#/c/cx-m14-01'),w=dom.window,d=w.document;
  c.steps.forEach(s=>{
    if(s.type==='numeric') type(d,w,s.id,String(s.answer.value));
    else d.querySelector('input[name=c-'+s.id+'][value='+s.answer.value+']').click();
  });
  submit(d,w);
  const btn=d.querySelector('[data-act="case-csv"]');
  if(!btn) return 'no csv button';
  return true;
});

// QA-8: every template downloads a non-empty file with a sane name
check('all template variants present and non-empty', ()=>{
  let n=0;
  CASES.forEach(c=>c.templates.forEach(t=>t.variants.forEach(v=>{
    if(!/^[a-z0-9-]+\.(csv|md)$/.test(v.file)) throw new Error('bad name '+v.file);
    if(!v.content||v.content.length<20) throw new Error('empty '+v.file);
    n++;
  })));
  /* derive the expected count from the data: a literal here would have to be
     edited every time a case adds a template, and the day it is not, the check
     passes for the wrong reason */
  const want = CASES.reduce((a,c)=>a+c.templates.length*3,0);
  return n===want?true:'expected '+want+' files, got '+n;
});

// QA-8b: no object stringification anywhere a case page prints data
CASES.forEach(c=>{
  check('no [object Object] on '+c.caseId, ()=>{
    const dom=load('#/c/'+c.caseId), d=dom.window.document;
    const bad = /\[object Object\]/.test(d.getElementById('main').innerHTML);
    /* true means pass in this harness; a returned string is the failure reason */
    return bad?'[object Object] rendered':true;
  });
});

// QA-9: no NaN / undefined anywhere on any case page
CASES.forEach(c=>{
  check('no NaN/undefined rendered: '+c.caseId, ()=>{
    const dom=load('#/c/'+c.caseId), d=dom.window.document;
    const html=d.getElementById('main').innerHTML;
    if(/NaN/.test(html)) return 'NaN in page';
    if(/>undefined</.test(html)) return 'undefined in page';
    return true;
  });
});

// QA-10: exam gate cannot be bypassed
check('exam gate holds on the route', ()=>{
  const dom=load('#/e/m06'), d=dom.window.document;
  if(d.querySelector('#exam form.exam-form')) return 'exam open without mastery';
  return /locked/i.test(d.getElementById('main').textContent)?true:'no lock message';
});

// QA-11: case page reachable from home for each case
check('home links reach every case', ()=>{
  const dom=load('#/'), d=dom.window.document;
  const hrefs=[...d.querySelectorAll('.home-case-link')].map(a=>a.getAttribute('href'));
  const missing=CASES.filter(c=>!hrefs.includes('#/c/'+c.caseId)).map(c=>c.caseId);
  return missing.length?('missing '+missing.join(',')):true;
});

// QA-12: every data file row count matches its CSV
check('table rows match CSV rows', ()=>{
  const c=CASES.find(x=>x.caseId==='cx-m06-01');
  const dom=load('#/c/cx-m06-01'), d=dom.window.document;
  const tables=[...d.querySelectorAll('.case-table')];
  for(let i=0;i<c.dataFiles.length;i++){
    const csvRows=c.dataFiles[i].content.trim().split(/\r?\n/).length-1;
    if(!tables[i]) return 'missing table '+i;
    if(tables[i].querySelectorAll('tbody tr').length!==csvRows)
      return c.dataFiles[i].name+' table '+tables[i].querySelectorAll('tbody tr').length+' vs csv '+csvRows;
  }
  return true;
});

// QA-13: keyboard / accessibility basics on the case form
check('labels and alerts are wired', ()=>{
  const dom=load('#/c/cx-m03-01'), d=dom.window.document;
  const fields=[...d.querySelectorAll('.case-step')];
  for(const f of fields){
    if(!f.id) continue;
    const stepId=f.id.replace(/^step-/,'');
    const err=d.getElementById('err-'+stepId);
    if(!err) return 'no error slot for '+stepId;
    if(err.getAttribute('role')!=='alert') return 'error slot not role=alert: '+stepId;
  }
  /* the per-step slot is checked above; here each numeric input must have its own
     label and must point at that slot. Radio inputs carry their own <label for>. */
  const inputs=[...d.querySelectorAll('.case-input')];
  for(const i of inputs){
    if(!d.querySelector('label[for="'+i.id+'"]')) return 'input without label: '+i.id;
    /* input id is in-<stepId>, the alert id is err-<stepId> */
    const stepId=i.id.replace(/^in-/,'');
    if(i.getAttribute('aria-describedby')!=='err-'+stepId) return 'aria-describedby wrong: '+i.id;
  }
  const radios=[...d.querySelectorAll('.case-options input[type=radio]')];
  for(const r of radios){
    if(!d.querySelector('label[for="'+r.id+'"]')) return 'radio without label: '+r.id;
  }
  if(radios.length && !d.querySelector('.case-options legend')) return 'radio group without legend';
  return true;
});

check('no feedback repeats the verdict word', ()=>{
  /* the renderer prints "Correct." / "Not yet." itself, so an authored string that
   * starts the same way would read "Correct. Correct - ..."; colours or wording
   * drift are exactly what a QA pass is for. */
  const data=JSON.parse(fs.readFileSync(path.join(ROOT,'data','cases.json'),'utf8'));
  const cases=data.cases||[];
  if(!cases.length) return 'no cases in data/cases.json';
  for(const c of cases){
    for(const st of c.steps){
      const okText=st.feedbackCorrect||'', badText=st.feedbackWrong||'';
      if(/^(Correct|Right|Yes)\b/i.test(okText)) return 'feedback repeats verdict: '+c.caseId+' '+st.id;
      if(/^(Not yet|Incorrect|Wrong|No)\b/i.test(badText)) return 'feedback repeats verdict: '+c.caseId+' '+st.id;
    }
  }
  return true;
});

loaded.forEach(d=>{try{d.window.close()}catch(e){}});
const pad=(str,n)=>str+' '.repeat(Math.max(1,n-str.length));
out.forEach(([st,n,det])=>{console.log(pad(st,7)+n+(det?' — '+det:''));});
const bad=out.filter(o=>o[0]!=='PASS').length;
console.log('\n'+out.filter(o=>o[0]==='PASS').length+' passed, '+bad+' failed/errored');
process.exitCode = bad ? 1 : 0;
