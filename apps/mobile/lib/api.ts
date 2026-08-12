import AsyncStorage from '@react-native-async-storage/async-storage';
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const ACCESS_TOKEN_KEY = 'mpa.accessToken'; const REFRESH_TOKEN_KEY = 'mpa.refreshToken';
export type AuthUser = { id:string; email:string; firstName:string|null; lastName:string|null; avatarUrl:string|null };
export type AuthResponse = { accessToken:string; refreshToken:string; user:AuthUser };
export type DashboardResponse = { dateKey:string; profile:{gender:string|null; birthDate:string|null; heightCm:number|null; weightKg:number|null; primaryGoal:string|null}|null; nutrition:{calories:number;calorieGoal:number;caloriesRemaining:number;caloriesProgress:number;protein:number;proteinGoal:number;proteinRemaining:number;proteinProgress:number;waterMl:number;waterGoalMl:number;waterRemaining:number;waterRemainingMl?:number;waterProgress:number}; meals:Array<{id:string;name:string;type:string;eatenAt:string;calories:number;protein:number;carbs:number;fat:number}>; mealCount:number };
export type DashboardOverviewResponse = { dateKey:string; range:{startKey:string;endKey:string}; today:DashboardResponse; weekly:{loggedDays:number;consistencyPercent:number;totalCalories:number;totalProtein:number;totalWaterMl:number;averageCalories:number;averageProtein:number;currentStreak:number}; workouts:{count:number;activeDays:number;totalMinutes:number;totalCaloriesBurned:number;latest:{id:string;name:string;type:string;durationMinutes:number;caloriesBurned:number;performedAt:string}|null} };
export type PersonalInsight = { key:string; title:string; description:string; score:number; category:'nutrition'|'hydration'|'fitness'|'consistency' };
export type PersonalInsightsResponse = { generatedAt:string;dateKey:string;profileGoal:string|null;summary:string;insights:PersonalInsight[] };
export type Reminder = { id:string;title:string;type:string;scheduledAt:string;completed:boolean };
export type Habit = { id:string;name:string;frequency:string;targetPerWeek:number;active:boolean;stats:{streak:number;recentCompletions:number;targetPerWeek:number} };
export type HabitSummary = { dateKey:string;activeHabits:number;completedCount:number;completionPercent:number;habits:Array<{id:string;name:string;targetPerWeek:number;completedThisWeek:number;streak:number}> };
export type Supplement = { id:string;name:string;dosage:string|null;frequency:string;scheduledTime:string;active:boolean;logs?:Array<{dateKey:string}> };
export type SupplementStatus = { dateKey:string;total:number;taken:number;remaining:number;completionPercent:number;supplements:Supplement[] };
export type Notification = { id:string;title:string;body:string|null;type:string;scheduledAt:string|null;readAt:string|null;createdAt:string;priority:number };
export type DailyCommandCenterResponse = {
  dateKey:string;
  greeting:string;
  primaryGoal:string|null;
  priorities:string[];
  nutrition:{calories:number;calorieGoal:number|null;protein:number;proteinGoal:number|null;waterMl:number;waterGoalMl:number|null};
  habits:{total:number;completed:number};
  supplements:{total:number;taken:number};
  reminders:{pending:number;next:{id:string;title:string;type:string;scheduledAt:string}|null};
  notifications:{unread:number};
  workouts:{countToday:number;latest:{name:string;type:string;durationMinutes:number}|null};
};
export async function setAuthSession(auth:AuthResponse){await AsyncStorage.multiSet([[ACCESS_TOKEN_KEY,auth.accessToken],[REFRESH_TOKEN_KEY,auth.refreshToken]])}
export async function setAccessToken(token:string){await AsyncStorage.setItem(ACCESS_TOKEN_KEY,token)}
export async function getStoredAccessToken(){return AsyncStorage.getItem(ACCESS_TOKEN_KEY)}
export async function getStoredRefreshToken(){return AsyncStorage.getItem(REFRESH_TOKEN_KEY)}
export async function hasAuthSession(){const [a,r]=await AsyncStorage.multiGet([ACCESS_TOKEN_KEY,REFRESH_TOKEN_KEY]);return Boolean(a[1]||r[1])}
export async function clearAuthSession(){await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY,REFRESH_TOKEN_KEY])}
export async function clearAccessToken(){await AsyncStorage.removeItem(ACCESS_TOKEN_KEY)}
async function rawRequest<T>(path:string,init:RequestInit={},token?:string){const headers=new Headers(init.headers);headers.set('Content-Type','application/json');if(token)headers.set('Authorization',`Bearer ${token}`);return fetch(`${API_URL}${path}`,{...init,headers}) as Promise<Response>}
async function refreshAccessToken(){const refreshToken=await getStoredRefreshToken();if(!refreshToken)return null;const response=await rawRequest<AuthResponse>('/auth/refresh',{method:'POST',body:JSON.stringify({refreshToken})});if(!response.ok){await clearAuthSession();return null}const auth=await response.json() as AuthResponse;await setAuthSession(auth);return auth.accessToken}
async function request<T>(path:string,init:RequestInit={}):Promise<T>{let token=await getStoredAccessToken();let response=await rawRequest<T>(path,init,token??undefined);if(response.status===401&&token){token=await refreshAccessToken();if(token)response=await rawRequest<T>(path,init,token)}if(!response.ok){const body=await response.text();throw new Error(body||`Request failed with ${response.status}`)}return response.json() as Promise<T>}
export function register(data:{email:string;password:string;firstName?:string;lastName?:string}){return request<AuthResponse>('/auth/register',{method:'POST',body:JSON.stringify(data)}).then(async a=>{await setAuthSession(a);return a})}
export function login(email:string,password:string){return request<AuthResponse>('/auth/login',{method:'POST',body:JSON.stringify({email,password})}).then(async a=>{await setAuthSession(a);return a})}
export function getMe(){return request<AuthUser>('/auth/me')}
export async function logout(){const refreshToken=await getStoredRefreshToken();try{if(refreshToken)await rawRequest('/auth/logout',{method:'POST',body:JSON.stringify({refreshToken})})}finally{await clearAuthSession()}}
export function getTodayDashboard(dateKey?:string){const q=dateKey?`?dateKey=${encodeURIComponent(dateKey)}`:'';return request<DashboardResponse>(`/dashboard/today${q}`)}
export async function getDashboardOverview(dateKey?:string){const q=dateKey?`?dateKey=${encodeURIComponent(dateKey)}`:'';const data=await request<DashboardOverviewResponse>(`/dashboard/overview${q}`);data.today.nutrition.waterRemainingMl ??= data.today.nutrition.waterRemaining;return data}
export function getPersonalInsights(dateKey?:string){const q=dateKey?`?dateKey=${encodeURIComponent(dateKey)}`:'';return request<PersonalInsightsResponse>(`/adaptive-learning/insights${q}`)}
export function getDailyCommandCenter(){return request<DailyCommandCenterResponse>('/daily-command-center')}
export function addWater(amountMl:number,dateKey?:string){const q=dateKey?`?dateKey=${encodeURIComponent(dateKey)}`:'';return request<{waterMl:number}>(`/daily/water${q}`,{method:'POST',body:JSON.stringify({amountMl})})}
export function createWorkout(data:{name:string;type:string;durationMinutes:number;caloriesBurned:number}){return request('/workout',{method:'POST',body:JSON.stringify(data)})}
export function getReminders(includeCompleted=false){return request<Reminder[]>(`/reminders${includeCompleted?'?includeCompleted=true':''}`)}
export function createReminder(data:{title:string;type:string;time:string}){return request<Reminder>('/reminders',{method:'POST',body:JSON.stringify(data)})}
export function completeReminder(id:string){return request<{completed:true}>(`/reminders/${id}/complete`,{method:'POST'})}
export function deleteReminder(id:string){return request<{deleted:true}>(`/reminders/${id}`,{method:'DELETE'})}
export function getNextReminder(){return request<Reminder|null>('/reminders/next')}
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
export function generateSmartNotifications(dateKey?:string){const q=dateKey?`?dateKey=${encodeURIComponent(dateKey)}`:'';return request<{enabled:boolean;created:number;rules:string[]}>(`/notifications/generate${q}`,{method:'POST'})}
export function getNotifications(includeRead=false){return request<Notification[]>(`/notifications${includeRead?'?includeRead=true':''}`)}
export function createNotification(data:{title:string;body?:string;type:string;scheduledAt?:string;priority?:number}){return request<Notification>('/notifications',{method:'POST',body:JSON.stringify(data)})}
export function markNotificationRead(id:string){return request<{id:string;read:true}>(`/notifications/${id}/read`,{method:'POST'})}
