import AsyncStorage from '@react-native-async-storage/async-storage';
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const ACCESS_TOKEN_KEY = 'mpa.accessToken'; const REFRESH_TOKEN_KEY = 'mpa.refreshToken';
export type AuthUser = { id:string; email:string; firstName:string|null; lastName:string|null; avatarUrl:string|null };
export type AuthResponse = { accessToken:string; refreshToken:string; user:AuthUser };
export type YogaStep = { id:string;poseId:string;order:number;phase:'warmup'|'flow'|'cooldown';holdSec:number;restSec:number;coachCues:Array<{id:string;phase:'enter'|'hold'|'exit';text:string;priority:number}> };
export type YogaSession = { id:string;level:'beginner'|'foundation'|'intermediate'|'advanced'|'expert';focus:string[];durationMin:number;steps:YogaStep[];estimatedDifficulty:number };
export type YogaCoachState = { sessionId:string;stepIndex:number;phase:'idle'|'enter'|'hold'|'exit'|'rest'|'completed';remainingSec:number;completedSteps:number[];currentPoseId:string|null;nextPoseId:string|null };
export type YogaBodyLandmark = { x:number;y:number;z?:number;confidence:number };
export type YogaPoseFrame = { capturedAt:number;landmarks:Record<string,YogaBodyLandmark>;overallConfidence:number };
export type YogaPoseAssessment = { poseId:string;score:number;confidence:number;stable:boolean;coachReady:boolean;issues:Array<{key:string;severity:'info'|'warning'|'critical';cue:string}>;metrics:Record<string,number> };
export async function setAuthSession(auth:AuthResponse){await AsyncStorage.multiSet([[ACCESS_TOKEN_KEY,auth.accessToken],[REFRESH_TOKEN_KEY,auth.refreshToken]])}
export async function getStoredAccessToken(){return AsyncStorage.getItem(ACCESS_TOKEN_KEY)}
export async function getStoredRefreshToken(){return AsyncStorage.getItem(REFRESH_TOKEN_KEY)}
export async function hasAuthSession(){const [a,r]=await AsyncStorage.multiGet([ACCESS_TOKEN_KEY,REFRESH_TOKEN_KEY]);return Boolean(a[1]||r[1])}
export async function clearAuthSession(){await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY,REFRESH_TOKEN_KEY])}
async function rawRequest(path:string,init:RequestInit={},token?:string){const headers=new Headers(init.headers);headers.set('Content-Type','application/json');if(token)headers.set('Authorization',`Bearer ${token}`);return fetch(`${API_URL}${path}`,{...init,headers})}
async function refreshAccessToken(){const refreshToken=await getStoredRefreshToken();if(!refreshToken)return null;const response=await rawRequest('/auth/refresh',{method:'POST',body:JSON.stringify({refreshToken})});if(!response.ok){await clearAuthSession();return null}const auth=await response.json() as AuthResponse;await setAuthSession(auth);return auth.accessToken}
async function request<T>(path:string,init:RequestInit={}):Promise<T>{let token=await getStoredAccessToken();let response=await rawRequest(path,init,token??undefined);if(response.status===401&&token){token=await refreshAccessToken();if(token)response=await rawRequest(path,init,token)}if(!response.ok)throw new Error((await response.text())||`Request failed with ${response.status}`);return response.json() as Promise<T>}
export function login(email:string,password:string){return request<AuthResponse>('/auth/login',{method:'POST',body:JSON.stringify({email,password})}).then(async a=>{await setAuthSession(a);return a})}
export function getYogaSession(durationMin:number,level?:YogaSession['level'],focus?:string){return request<YogaSession>('/yoga/session',{method:'POST',body:JSON.stringify({durationMin,level,focus})})}
export function startYogaCoach(session:YogaSession){return request<YogaCoachState>('/yoga/coach/start',{method:'POST',body:JSON.stringify({session})})}
export function tickYogaCoach(session:YogaSession,state:YogaCoachState,elapsedSec:number){return request<YogaCoachState>('/yoga/coach/tick',{method:'POST',body:JSON.stringify({session,state,elapsedSec})})}
export function getYogaCue(state:YogaCoachState){return request<{poseId:string;phase:YogaCoachState['phase'];text:string}|null>('/yoga/coach/cue',{method:'POST',body:JSON.stringify({state})})}
export function analyzeYogaPose(poseId:string,frame:YogaPoseFrame){return request<YogaPoseAssessment>('/yoga/motion/analyze',{method:'POST',body:JSON.stringify({poseId,frame})})}
