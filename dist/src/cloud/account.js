import {emptyState} from '../store.js';
import {createNeonTransport,publicError} from './neon.js';
import {createCloudSession} from './session.js';
import {watchAuthChange} from './auth-events.js';
export const MODE_KEY='engineer-practice-account-mode-v1';
export function createAccountController({storage,guest,onChange,onIdentity,download,confirm=message=>window.confirm(message)}){
  let cloud=null,clientPromise=null,generation=0,checking=false;
  const client=()=>clientPromise??=createNeonTransport();
  const auth={mode:'signin',email:'',busy:false,error:'',message:'',user:null};
  const loading={state:emptyState(),available:false,error:'계정 기록을 먼저 불러와 주세요.',export:()=>JSON.stringify(emptyState()),...Object.fromEntries(['append','classify','bookmark','settings','active','finish','restore','clear','refresh'].map(k=>[k,()=>false]))};
  function remember(mode){try{storage.setItem(MODE_KEY,mode);}catch{/* Durable account writes independently check storage. */}}
  function leave(message){generation++;cloud?.stop();cloud=null;auth.user=null;auth.mode='signin';auth.message=message;guest.refresh();onIdentity();onChange(true);}
  async function activate(user){
    if(!user)throw{code:'SESSION_UNAVAILABLE'};if(!user.emailVerified){auth.email=user.email;auth.mode='verify';return;}
    const token=++generation;cloud?.stop();auth.user=user;auth.mode='account';auth.message='';const transport=await client();if(token!==generation)return;
    cloud=createCloudSession({storage,user,transport,onChange:changed=>{if(token===generation)onChange(changed);}});remember('account');onIdentity();onChange(true);await cloud.start();
  }
  const api={auth,get session(){return cloud;},get store(){return cloud?(cloud.state?cloud:loading):guest;},
    mode(value){auth.mode=value;auth.error='';auth.message='';onChange(true);},
    async submit(mode,values){if(auth.busy)return;auth.busy=true;auth.email=values.email;auth.error='';auth.message='';onChange(true);
      try{
        if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)||values.email.length>254)throw new TypeError('이메일 형식을 확인해 주세요.');
        if(['signup','reset-confirm'].includes(mode)&&(values.password.length<12||values.password.length>128))throw new TypeError('비밀번호는 12–128자로 입력해 주세요.');
        if(['verify','reset-confirm'].includes(mode)&&!/^\d{6}$/.test(values.otp))throw new TypeError('인증번호 6자리를 입력해 주세요.');
        const c=await client();
        if(mode==='signin')await activate(await c.signIn(values.email,values.password));
        else if(mode==='signup'){await c.signUp(values.email,values.password);auth.mode='verify';auth.message='이메일로 받은 인증번호를 입력해 주세요.';}
        else if(mode==='verify'){await c.verify(values.email,values.otp);const user=await c.session();if(user?.emailVerified)await activate(user);else{auth.mode='signin';auth.message='인증을 마쳤습니다. 로그인해 주세요.';}}
        else if(mode==='resend'){await c.resend(values.email);auth.message='이메일로 받은 새 인증번호를 입력해 주세요.';}
        else if(mode==='reset'){await c.requestReset(values.email);auth.mode='reset-confirm';auth.message='가입한 이메일이라면 인증번호를 받을 수 있습니다.';}
        else if(mode==='reset-confirm'){await c.resetPassword(values.email,values.otp,values.password);auth.mode='signin';auth.message='비밀번호를 변경했습니다. 두 학습실에서 새 비밀번호를 사용하세요.';}
      }catch(e){auth.error=e instanceof TypeError&&/이메일 형식|비밀번호는|인증번호 6자리/.test(e.message)?e.message:publicError(e);}
      finally{values.password='';values.otp='';auth.busy=false;onChange(true);}
    },
    async useExisting(){if(auth.busy)return;auth.busy=true;auth.error='';onChange(true);try{await activate(await(await client()).session());}catch(e){auth.error=publicError(e);}finally{auth.busy=false;onChange(true);}},
    async restore(){try{if(storage.getItem(MODE_KEY)==='account'){auth.message='계정 연결을 확인 중입니다. 현재 화면은 비로그인 기록입니다.';await api.useExisting();}}catch{/* Guest mode remains usable. */}},
    async signOut(){if(cloud?.pendingCount&&!confirm('미전송 기록을 이 기기에 남기고 WEB LAB 계정에서 로그아웃할까요? 같은 계정으로 다시 로그인해야 전송됩니다.'))return;try{await(await client()).signOut();remember('guest');leave('WEB LAB 계정에서 로그아웃했습니다. 비로그인 기록으로 돌아왔습니다.');}catch(e){auth.error=publicError(e);onChange(true);}},
    useGuest(){if(cloud?.pendingCount&&!confirm('대기 기록을 보관하고 비로그인 학습으로 전환할까요?'))return;remember('guest');leave('이 앱에서 비로그인 학습으로 전환했습니다. WEB LAB 로그인 세션은 유지됩니다.');},
    async sync(){if(cloud?.state)await cloud.flush({pull:true});else await api.useExisting();onChange(true);},
    async importGuest(){guest.refresh();if(!guest.available){auth.error=guest.error;onChange(true);return;}if(!cloud?.state||!confirm(`비로그인 풀이 ${guest.state.attempts.length}건과 완료 시험 ${guest.state.sessions.length}회를 계정에 합칠까요? 원본은 남고, 계정 설정과 진행 중 시험은 유지합니다.`))return;try{cloud.importState(guest.state);await cloud.flush();}catch(e){auth.error=e.message;}onChange(true);},
    backupPending(){if(cloud)download(cloud.pendingBackup(),'engineer-practice-pending.json');},
    backupRemote(){if(cloud?.remote)download(JSON.stringify(cloud.remote,null,2),'engineer-practice-account-copy.json');},
    async recover(){if(!cloud||!confirm('이 기기의 대기 기록 원본을 내려받은 뒤 최신 계정 기록으로 다시 연결할까요? 내려받은 파일을 보관해 주세요.'))return;api.backupPending();await cloud.recover();onIdentity();onChange(true);},
    async resolve(choice){if(!cloud||!confirm('충돌한 항목에 '+(choice==='local'?'이 기기':'계정')+'의 값을 적용할까요? 양쪽 기록 원본을 먼저 내려받습니다.'))return;api.backupPending();api.backupRemote();try{await cloud.resolve(choice);}catch(e){auth.error=e.message;}onChange(true);},
    async checkIdentity(){if(!cloud||checking||auth.busy)return;checking=true;const prior=cloud,token=generation;try{const user=await(await client()).session();if(token!==generation)return;if(!user?.emailVerified||user.id!==prior.user.id){remember('guest');leave('다른 학습실에서 로그인 상태가 바뀌었습니다. 대기 기록은 이전 계정에 보관했고 비로그인 화면으로 돌아왔습니다.');}}catch{/* Failed network checks cannot prove logout. Writes independently verify identity. */}finally{checking=false;}},
    changedAuth(){if(!cloud||auth.busy)return;const previous=auth.user.id;leave('WEB LAB 로그인 상태를 다시 확인하고 있습니다.');const token=generation;void client().then(c=>c.session()).then(user=>{if(token!==generation||auth.busy)return;if(user?.id===previous&&user.emailVerified)return activate(user);remember('guest');auth.message='WEB LAB 로그인 상태가 바뀌었습니다. 기존 계정의 대기 기록은 이 기기에 남습니다.';onChange(true);}).catch(()=>{auth.message='계정 연결을 확인하지 못했습니다. 대기 기록은 보존했습니다.';onChange(true);});},
  };
  watchAuthChange(()=>api.changedAuth());return api;
}
