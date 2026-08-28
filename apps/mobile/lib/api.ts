import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const API_URL = __DEV__ && Platform.OS === 'android' ? 'http://127.0.0.1:3000' : (configuredApiUrl ?? 'http://127.0.0.1:3000');
const ACCESS_TOKEN_KEY = 'mpa.accessToken'; const REFRESH_TOKEN_KEY = 'mpa.refreshToken';
export type AuthUser = { id:string; email:string; firstName:string|null; lastName:string|null; avatarUrl:string|null };
export type AuthResponse = { accessToken:string; refreshToken:string; user:AuthUser };
export type DashboardResponse = { dateKey:string; profile:{gender:string|null; birthDate:string|null; heightCm:number|null; weightKg:number|null; primaryGoal:string|null}|null; nutrition:{calories:number;calorieGoal:number;caloriesRemaining:number;caloriesProgress:number;protein:number;proteinGoal:number;proteinRemaining:number;proteinProgress:number;waterMl:number;waterGoalMl:number;waterRemaining:number;waterRemainingMl?:number;waterProgress:number}; meals:Array<{id:string;name:string;type:string;eatenAt:string;calories:number;protein:number;carbs:number;fat:number}>; mealCount:number };
export type DashboardOverviewResponse = { dateKey:string; range:{startKey:string;endKey:string}; today:DashboardResponse; weekly:{loggedDays:number;consistencyPercent:number;totalCalories:number;totalProtein:number;totalWaterMl:number;averageCalories:number;averageProtein:number;currentStreak:number}; workouts:{count:number;activeDays:number;totalMinutes:number;totalCaloriesBurned:number;latest:{id:string;name:string;type:string;durationMinutes:number;caloriesBurned:number;performedAt:string}|null} };
export type PersonalInsight = { key:string; title:string; description:string; score:number; category:'nutrition'|'hydration'|'fitness'|'consistency' };
export type PersonalInsightsResponse = { generatedAt:string;dateKey:string;profileGoal:string|null;summary:string;insights:PersonalInsight[] };
export type Reminder = { id:string;title:string;type:string;scheduledAt:string;completed:boolean };
export type CalendarEvent = { id:string;title:string;type:string;startsAt:string;endsAt:string|null;completed:boolean };
export type Habit = { id:string;name:string;frequency:string;targetPerWeek:number;active:boolean;stats:{streak:number;recentCompletions:number;targetPerWeek:number} };
export type HabitSummary = { dateKey:string;activeHabits:number;completedCount:number;completionPercent:number;habits:Array<{id:string;name:string;targetPerWeek:number;completedThisWeek:number;streak:number}> };
export type Supplement = { id:string;name:string;dosage:string|null;frequency:string;scheduledTime:string;active:boolean;logs?:Array<{dateKey:string}> };
export type SupplementStatus = { dateKey:string;total:number;taken:number;remaining:number;completionPercent:number;supplements:Supplement[] };
export type Notification = { id:string;title:string;body:string|null;type:string;scheduledAt:string|null;readAt:string|null;createdAt:string;priority:number };
export type BrainContextResponse = { dateKey:string;primaryGoal:string|null;today:{calories:number;calorieGoal:number|null;protein:number;proteinGoal:number|null;waterMl:number;waterGoalMl:number|null};habits:{active:number;completed:number;streaks:number[]};supplements:{active:number;taken:number;remaining:number};reminders:{pending:number;next:Reminder|null};calendar:{todayCount:number;next:CalendarEvent|null};workouts:{todayCount:number;latest:{id:string;name:string;type:string;durationMinutes:number;caloriesBurned:number;performedAt:string}|null};notifications:{unread:number};priorities:string[];timestamp:string;source:string};
export type DailyCalendarEvent = { id:string;title:string;type:string;scheduledAt:string;completed:boolean };
export type DailyCommandCenterResponse = { dateKey:string;greeting:string;primaryGoal:string|null;priorities:string[];nutrition:{calories:number;calorieGoal:number|null;protein:number;proteinGoal:number|null;waterMl:number;waterGoalMl:number|null};habits:{total:number;completed:number};supplements:{total:number;taken:number};reminders:{pending:number;next:{id:string;title:string;type:string;scheduledAt:string}|null};calendar:{today:DailyCalendarEvent[];next:DailyCalendarEvent|null};notifications:{unread:number};workouts:{countToday:number;latest:{name:string;type:string;durationMinutes:number}|null};};
export type NutritionSummary = { dateKey:string; meals:{count:number;calories:number;protein:number;carbs:number;fat:number}; goals:{calories:number|null;protein:number|null;waterMl:number|null}; remaining:{calories:number|null;protein:number|null;waterMl:number|null}; progress:{caloriesPercent:number|null;proteinPercent:number|null;waterPercent:number|null}; status:{calories:string;protein:string;water:string} };
export type FoodItem = { id:string;name:string;category:string;calories:number;protein:number;carbs:number;fat:number;imageUrl?:string|null;verified:boolean };
export type Meal = { id:string;name:string;type:string;eatenAt:string;calories:number;protein:number;carbs:number;fat:number;items:Array<{id:string;foodId:string;quantity:number;calories:number;protein:number;carbs:number;fat:number;food:FoodItem}> };
export type PlanExecutionState = { planId:string; userId:string; status:string; stepIds:string[]; completed:string[]; blocked:string[]; failed:string[]; currentStep:string|null; updatedAt:string };
export type DecisionTrace = { id:string;decisionId:string;userId:string;selectedIds:string[];rejectedIds:string[];blockedIds:string[];reason:string;createdAt:string };
export type YogaStep = { id:string;poseId:string;order:number;phase:'warmup'|'flow'|'cooldown';holdSec:number;restSec:number;coachCues:Array<{id:string;phase:'enter'|'hold'|'exit';text:string;priority:number}> };
export type YogaSession = { id:string;level:'beginner'|'foundation'|'intermediate'|'advanced'|'expert';focus:string[];durationMin:number;steps:YogaStep[];estimatedDifficulty:number };
export type YogaCoachState = { sessionId:string;stepIndex:number;phase:'idle'|'enter'|'hold'|'exit'|'completed'|'rest';remainingSec:number;completedSteps:number[];currentPoseId:string|null;nextPoseId:string|null };
export type YogaBodyLandmark = { x:number;y:number;z?:number;confidence:number };
export type YogaPoseFrame = { capturedAt:number;landmarks:Record<string,YogaBodyLandmark>;overallConfidence:number };
export type YogaPoseAssessment = { poseId:string;score:number;confidence:number;stable:boolean;coachReady:boolean;issues:Array<{key:string;severity:'info'|'warning'|'critical';cue:string}>;metrics:Record<string,number> };
export type BrainOverview = { plan:unknown; nextAction:{action:{id:string;title:string;estimatedMinutes:number;priority:number;urgent:boolean;reasons:string[]}|null;mode:string;message?:string;alternatives:unknown[];signals:unknown[]}; coachNext:unknown; scheduleHealth:unknown };
export async function setAuthSession(auth:AuthResponse){await AsyncStorage.multiSet([[ACCESS_TOKEN_KEY,auth.accessToken],[REFRESH_TOKEN_KEY,auth.refreshToken]])}
export function setAccessToken(token:string){return AsyncStorage.setItem(ACCESS_TOKEN_KEY,token)}
export async function getStoredAccessToken(){return AsyncStorage.getItem(ACCESS_TOKEN_KEY)}
export async function getStoredRefreshToken(){return AsyncStorage.getItem(REFRESH_TOKEN_KEY)}
export async function hasAuthSession(){const [a,r]=await AsyncStorage.multiGet([ACCESS_TOKEN_KEY,REFRESH_TOKEN_KEY]);return Boolean(a[1]||r[1])}
export async function clearAuthSession(){await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY,REFRESH_TOKEN_KEY])}
export function clearAccessToken(){return AsyncStorage.removeItem(ACCESS_TOKEN_KEY)}
async function rawRequest(path:string,init:RequestInit={},token?:string){const headers=new Headers(init.headers);headers.set('Content-Type','application/json');if(token)headers.set('Authorization',`Bearer ${token}`);try{return await fetch(`${API_URL}${path}`,{...init,headers})}catch(error){const detail=error instanceof Error&&error.message?` (${error.message})`:'';throw new Error(`Unable to reach the local API at ${API_URL}${detail}`)}}
async function refreshAccessToken(){const refreshToken=await getStoredRefreshToken();if(!refreshToken)return null;const response=await rawRequest('/auth/refresh',{method:'POST',body:JSON.stringify({refreshToken})});if(!response.ok){await clearAuthSession();return null}const auth=await response.json() as AuthResponse;await setAuthSession(auth);return auth.accessToken}
async function request<T>(path:string,init:RequestInit={}):Promise<T>{let token=await getStoredAccessToken();let response=await rawRequest(path,init,token??undefined);if(response.status===401&&token){token=await refreshAccessToken();if(token)response=await rawRequest(path,init,token)}if(!response.ok)throw new Error((await response.text())||`Request failed with ${response.status}`);return response.json() as Promise<T>}
export function register(data:{email:string;password:string;firstName?:string;lastName?:string}){return request<AuthResponse>('/auth/register',{method:'POST',body:JSON.stringify(data)}).then(async a=>{await setAuthSession(a);return a})}
export function login(email:string,password:string){return request<AuthResponse>('/auth/login',{method:'POST',body:JSON.stringify({email,password})}).then(async a=>{await setAuthSession(a);return a})}
export function getMe(){return request<AuthUser>('/auth/me')}
export async function logout(){const refreshToken=await getStoredRefreshToken();try{if(refreshToken)await rawRequest('/auth/logout',{method:'POST',body:JSON.stringify({refreshToken})})}finally{await clearAuthSession()}}
export function getTodayDashboard(dateKey?:string){const q=dateKey?`?dateKey=${encodeURIComponent(dateKey)}`:'';return request<DashboardResponse>(`/dashboard/today${q}`)}
export async function getDashboardOverview(dateKey?:string){const q=dateKey?`?dateKey=${encodeURIComponent(dateKey)}`:'';const data=await request<DashboardOverviewResponse>(`/dashboard/overview${q}`);data.today.nutrition.waterRemainingMl ??= data.today.nutrition.waterRemaining;return data}
export function getPersonalInsights(dateKey?:string){const q=dateKey?`?dateKey=${encodeURIComponent(dateKey)}`:'';return request<PersonalInsightsResponse>(`/adaptive-learning/insights${q}`)}
export function getBrainContext(dateKey?:string){const q=dateKey?`?dateKey=${encodeURIComponent(dateKey)}`:'';return request<BrainContextResponse>(`/brain-integration/context${q}`)}
export function getDailyCommandCenter(){return request<DailyCommandCenterResponse>('/daily-command-center')}
export function getDecisionTrace(){return request<DecisionTrace[]>('/personal-brain/trace')}
export function getPlanHistory(limit=10){return request<PlanExecutionState[]>(`/personal-brain/plan/history?limit=${Math.max(1,Math.min(10,Math.round(limit)))}`)}
export function getBrainOverview(){return request<BrainOverview>('/personal-brain/overview')}
export function recordDecisionOutcome(data:{decisionId:string;outcome:'positive'|'neutral'|'negative';score?:number;note?:string}){return request('/personal-brain/decision/outcome',{method:'POST',body:JSON.stringify(data)})}
export function addWater(amountMl:number,dateKey?:string){const q=dateKey?`?dateKey=${encodeURIComponent(dateKey)}`:'';return request<{waterMl:number}>(`/daily/water${q}`,{method:'POST',body:JSON.stringify({amountMl})})}
export function createWorkout(data:{name:string;type:string;durationMinutes:number;caloriesBurned:number}){return request('/workout',{method:'POST',body:JSON.stringify(data)})}
export function getReminders(includeCompleted=false){return request<Reminder[]>(`/reminders${includeCompleted?'?includeCompleted=true':''}`)}
export function createReminder(data:{title:string;type:string;time:string}){return request<Reminder>('/reminders',{method:'POST',body:JSON.stringify(data)})}
export function updateReminder(id:string,data:{title?:string;time?:string}){return request<Reminder>(`/reminders/${id}`,{method:'PATCH',body:JSON.stringify(data)})}
export function completeReminder(id:string){return request<{id:string;completed:true}>(`/reminders/${id}/complete`,{method:'POST'})}
export function reopenReminder(id:string){return request<{id:string;completed:false}>(`/reminders/${id}/reopen`,{method:'POST'})}
export function deleteReminder(id:string){return request<{id:string;deleted:true}>(`/reminders/${id}`,{method:'DELETE'})}
export function getNextReminder(){return request<Reminder|null>('/reminders/next')}
export function getCalendarEvents(from?:string,to?:string){const q=new URLSearchParams();if(from)q.set('from',from);if(to)q.set('to',to);return request<CalendarEvent[]>(`/calendar${q.toString()?`?${q.toString()}`:''}`)}
export function createCalendarEvent(data:{title:string;type:string;startsAt:string;endsAt?:string}){return request<CalendarEvent>('/calendar',{method:'POST',body:JSON.stringify(data)})}
export function completeCalendarEvent(id:string){return request<{completed:true}>(`/calendar/${id}/complete`,{method:'POST'})}
export function getHabits(){return request<Habit[]>('/habits')}
export function createHabit(data:{name:string;frequency:'daily'|'weekly';targetPerWeek?:number}){return request<Habit>('/habits',{method:'POST',body:JSON.stringify(data)})}
export function completeHabit(id:string,dateKey?:string){return request(`/habits/${id}/complete${dateKey?`?dateKey=${encodeURIComponent(dateKey)}`:''}`,{method:'POST'})}
export function updateHabit(id:string,data:{name?:string;frequency?:'daily'|'weekly';targetPerWeek?:number;active?:boolean}){return request<Habit>(`/habits/${id}`,{method:'PATCH',body:JSON.stringify(data)})}
export function deleteHabit(id:string){return request<{deleted:true}>(`/habits/${id}`,{method:'DELETE'})}
export function getHabitSummary(dateKey?:string){return request<HabitSummary>(`/habits/summary${dateKey?`?dateKey=${encodeURIComponent(dateKey)}`:''}`)}
export function getSupplements(includeInactive=false){return request<Supplement[]>(`/supplements${includeInactive?'?includeInactive=true':''}`)}
export function getSupplementStatus(dateKey?:string){return request<SupplementStatus>(`/supplements/today${dateKey?`?dateKey=${encodeURIComponent(dateKey)}`:''}`)}
export function createSupplement(data:{name:string;dosage?:string;frequency?:string;scheduledTime?:string}){return request<Supplement>('/supplements',{method:'POST',body:JSON.stringify(data)})}
export function takeSupplement(id:string,dateKey?:string){return request(`/supplements/${id}/take${dateKey?`?dateKey=${encodeURIComponent(dateKey)}`:''}`,{method:'POST'})}
export function updateSupplement(id:string,data:{name?:string;dosage?:string;frequency?:string;scheduledTime?:string;active?:boolean}){return request<Supplement>(`/supplements/${id}`,{method:'PATCH',body:JSON.stringify(data)})}
export function deleteSupplement(id:string){return request<{deleted:true}>(`/supplements/${id}`,{method:'DELETE'})}
export function getNotifications(includeRead=false){return request<Notification[]>(`/notifications${includeRead?'?includeRead=true':''}`)}
export function createNotification(data:{title:string;body?:string;type:string;scheduledAt?:string;priority?:number}){return request<Notification>('/notifications',{method:'POST',body:JSON.stringify(data)})}
export function markNotificationRead(id:string){return request<{id:string;read:true}>(`/notifications/${id}/read`,{method:'POST'})}
export function markAllNotificationsRead(){return request<{updated:number}>('/notifications/read-all')}
export function generateSmartNotifications(dateKey?:string){const q=dateKey?`?dateKey=${encodeURIComponent(dateKey)}`:'';return request<{enabled:boolean;created:number;rules:string[]}>(`/notifications/generate${q}`,{method:'POST'})}
export function getFoods(q?:string){return request<FoodItem[]>(`/foods${q?`?q=${encodeURIComponent(q)}`:''}`)}
export function createFood(data:{name:string;category:string;calories?:number;protein?:number;carbs?:number;fat?:number;imageUrl?:string;imageSource?:string}){return request<FoodItem>('/foods',{method:'POST',body:JSON.stringify(data)})}
export function getMeals(){return request<Meal[]>('/meals')}
export function createMeal(data:{name:string;type:string;eatenAt:string;dateKey?:string;items:Array<{foodId:string;quantity:number}>}){return request<Meal>('/meals',{method:'POST',body:JSON.stringify(data)})}
export function getNutritionSummary(dateKey?:string){const q=dateKey?`?dateKey=${encodeURIComponent(dateKey)}`:'';return request<NutritionSummary>(`/nutrition/summary${q}`)}
export function getYogaSession(durationMin:number,level?:YogaSession['level'],focus?:string){return request<YogaSession>('/yoga/session',{method:'POST',body:JSON.stringify({durationMin,level,focus})})}
export function startYogaCoach(session:YogaSession){return request<YogaCoachState>('/yoga/coach/start',{method:'POST',body:JSON.stringify({session})})}
export function tickYogaCoach(session:YogaSession,state:YogaCoachState,elapsedSec:number){return request<YogaCoachState>('/yoga/coach/tick',{method:'POST',body:JSON.stringify({session,state,elapsedSec})})}
export function getYogaCue(state:YogaCoachState){return request<{poseId:string;phase:YogaCoachState['phase'];text:string}|null>('/yoga/coach/cue',{method:'POST',body:JSON.stringify({state})})}
export function analyzeYogaPose(poseId:string,frame:YogaPoseFrame){return request<YogaPoseAssessment>('/yoga/motion/analyze',{method:'POST',body:JSON.stringify({poseId,frame})})}
