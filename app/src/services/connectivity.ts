import NetInfo from '@react-native-community/netinfo';
export function appearsOnline(state:{isConnected:boolean|null;isInternetReachable:boolean|null}) {
  return state.isConnected===true && state.isInternetReachable!==false;
}
export async function onlineAtFinish() {
  let timer:ReturnType<typeof setTimeout>|undefined;
  try {return await Promise.race([NetInfo.fetch().then(appearsOnline),new Promise<boolean>(resolve=>{timer=setTimeout(()=>resolve(false),1500);})]);}
  catch{return false;}finally{clearTimeout(timer);}
}
