import {el,button} from '../view.js';
const field=(label,input)=>el('div',{class:'field'},el('label',{for:input.id},label),input);
export function accountView(api){
  const a=api.auth,s=api.session,body=el('div',{class:'account-layout'});
  const privacy=el('section',{class:'panel'},el('h2',{},'하나의 계정, 앱별 학습 기록'),el('p',{},'기존 인터넷보안 계정의 이메일과 비밀번호를 그대로 사용하세요. 정보처리기사와 인터넷보안 기록은 따로 저장됩니다.'),el('ul',{class:'account-notes'},
    el('li',{},'로그인은 선택입니다. 비로그인 기록은 이 브라우저에 남으며, 가져오기를 선택할 때만 계정에 합쳐집니다.'),
    el('li',{},'이메일과 이 앱의 풀이·오답 분류·표시 문제·시험·설정을 저장합니다. 비밀번호와 세션은 Neon 인증 서비스가 처리합니다. 접속 IP·브라우저 정보가 인증 기록에 포함될 수 있습니다.'),
    el('li',{},'이 브라우저의 로그아웃은 두 학습실에 반영됩니다. 비밀번호는 공통입니다. 학습 기록 초기화는 이 앱에만 적용됩니다.'),
    el('li',{},'다른 기기로 옮기기 전에 동기화 완료를 확인하세요. 진행 중 시험을 두 기기에서 동시에 수정하면 충돌 확인이 필요합니다.'),
    el('li',{},'풀이 2,048건·표시 128개·완료 시험 20회·기록 1,048,576자 한도입니다. 새 기록은 오래된 기록부터 정리하며, 가져오기·충돌 병합이 한도를 넘으면 멈추고 백업을 안내합니다.'),
    el('li',{},'대기 기록은 기기에 계정별로 남습니다. 같은 GitHub Pages 출처의 앱은 브라우저 저장 공간을 공유합니다. 공용 기기에서는 동기화·백업 후 로그아웃하고 사이트 데이터를 지워 주세요.')),
    el('p',{class:'small muted'},'타사 쿠키 차단이나 무료 서비스 한도로 연결이 제한될 수 있습니다. 연결이 안 되면 비로그인 학습과 파일 백업을 이용할 수 있습니다.'),
    el('a',{href:'https://hyungminyoon1.github.io/internet-security-study/#account'},'인터넷보안 학습실의 계정 화면 ↗'));
  const panel=el('section',{class:'panel account-panel'});
  if(s&&a.mode==='account'){
    panel.append(el('h2',{},a.user.email),el('p',{id:'account-sync-state',role:'status'},s.blocked?'동기화 확인 필요':s.busy?'계정 기록을 확인하고 있습니다.':s.pendingCount?'기기에 저장 · 서버 전송 대기':s.lastSynced?'동기화 완료 · '+new Date(s.lastSynced).toLocaleString('ko-KR'):'아직 계정 기록을 불러오지 못했습니다.'),
      el('div',{class:'row section-gap'},button('지금 동기화',()=>api.sync(),'button',{disabled:s.busy}),button('이 브라우저 기록 가져오기',()=>api.importGuest(),'button subtle',{disabled:s.busy||!s.available}),button('로그아웃',()=>api.signOut(),'button subtle',{disabled:s.busy})),
      el('div',{class:'row section-gap'},button('대기 기록 원본 내려받기',()=>api.backupPending(),'link-button'),button('비로그인 학습으로 전환',()=>api.useGuest(),'link-button')));
    if(s.error)panel.append(el('p',{class:'notice'},s.error));
    if(s.conflicts.length)panel.append(el('h3',{class:'section-gap'},'두 기기의 변경이 다릅니다'),el('p',{},s.conflicts.join(' · ')),el('div',{class:'row'},button('계정의 값 유지',()=>api.resolve('remote'),'button subtle'),button('이 기기의 값 적용',()=>api.resolve('local'),'button subtle'),button('계정 기록 백업',()=>api.backupRemote(),'link-button')));
    if(s.blocked)panel.append(el('p',{class:'small'},'현재 기록을 백업한 뒤 최신 계정 기록으로 다시 연결할 수 있습니다. 제출된 시험과 다른 답안이 겹치거나 합친 기록이 한도를 넘으면 원본 파일을 보관해 주세요.'),button('계정 기록으로 다시 연결',()=>api.recover(),'button subtle',{disabled:s.busy}));
  }else{
    const mode=a.mode==='account'?'signin':a.mode,titles={signin:'로그인',signup:'계정 만들기',verify:'이메일 인증',reset:'비밀번호 찾기','reset-confirm':'새 비밀번호 설정'};
    panel.append(el('div',{class:'row auth-tabs'},[['signin','로그인'],['signup','가입'],['reset','비밀번호 찾기'],['verify','이메일 인증']].map(([id,label])=>button(label,()=>api.mode(id),mode===id?'button':'button subtle',{disabled:a.busy,'aria-pressed':mode===id}))));
    const email=el('input',{id:'auth-email',name:'email',type:'email',autocomplete:'username',maxlength:254,required:true,value:a.email,disabled:a.busy});
    const password=['signin','signup','reset-confirm'].includes(mode)?el('input',{id:'auth-password',name:'password',type:'password',autocomplete:mode==='signin'?'current-password':'new-password',minlength:mode==='signin'?1:12,maxlength:128,required:true,disabled:a.busy}):null;
    const otp=['verify','reset-confirm'].includes(mode)?el('input',{id:'auth-otp',name:'otp',inputmode:'numeric',autocomplete:'one-time-code',pattern:'[0-9]{6}',minlength:6,maxlength:6,required:true,disabled:a.busy}):null;
    const form=el('form',{class:'auth-form',onSubmit:event=>{event.preventDefault();const values={email:email.value.trim(),password:password?.value||'',otp:otp?.value||''};if(password)password.value='';if(otp)otp.value='';void api.submit(mode,values);}},el('h2',{},titles[mode]),field('이메일',email),password?field(mode==='signin'?'비밀번호':'비밀번호 · 12–128자',password):null,otp?field('이메일 인증번호 · 6자리',otp):null,el('button',{type:'submit',class:'button',disabled:a.busy},a.busy?'처리 중…':mode==='reset'?'인증번호 요청':titles[mode]));
    if(mode==='verify')form.append(button('인증번호 다시 받기',()=>api.submit('resend',{email:email.value.trim()}),'button subtle',{disabled:a.busy}));
    panel.append(form,el('div',{class:'row section-gap'},button('기존 WEB LAB 로그인 연결',()=>api.useExisting(),'button subtle',{disabled:a.busy}),el('a',{href:'#home'},'로그인 없이 학습하기')));
  }
  if(a.error)panel.append(el('p',{class:'notice',role:'status'},a.error));if(a.message)panel.append(el('p',{class:'small',role:'status'},a.message));body.append(panel,privacy);return body;
}
