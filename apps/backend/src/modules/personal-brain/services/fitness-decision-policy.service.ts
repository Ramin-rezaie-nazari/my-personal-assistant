import { Injectable } from '@nestjs/common';
import { BrainReasoningContext, BrainDecisionResult } from '../types';
export type FitnessDisciplineCandidate={discipline:'yoga'|'calisthenics'|'gym';score:number;reasons:string[]};
@Injectable()
export class FitnessDecisionPolicyService{
 evaluate(context:BrainReasoningContext):BrainDecisionResult|null{
  const fitness=context.state.lifeContext?.fitness;if(!fitness)return null;const input=context.input.trim().toLowerCase();
  if(!/\b(workout|exercise|training|gym|fitness|yoga|calisthenics|train|work out)\b|تمرین|ورزش|بدنسازی|یوگا|کالیستنیکس/.test(input))return null;
  const candidates:FitnessDisciplineCandidate[]=[{discipline:'yoga',score:.35,reasons:['mobility-and-recovery-friendly']},{discipline:'calisthenics',score:.35,reasons:['bodyweight-friendly']},{discipline:'gym',score:.3,reasons:['equipment-flexible']}];
  const goal=fitness.primaryGoal,equipment=new Set(fitness.equipment??[]),targets=fitness.targetAreas??[],constraints=fitness.constraints??[];
  if(goal){if(goal.kind==='body_sculpt'){candidates.find(c=>c.discipline==='calisthenics')!.score+=.15;candidates.find(c=>c.discipline==='yoga')!.score+=.08}if(goal.kind==='strength'){candidates.find(c=>c.discipline==='gym')!.score+=.18;candidates.find(c=>c.discipline==='calisthenics')!.score+=.12}if(goal.kind==='fat_loss'){candidates.find(c=>c.discipline==='calisthenics')!.score+=.1;candidates.find(c=>c.discipline==='gym')!.score+=.08}if(goal.avoidBulk){candidates.find(c=>c.discipline==='yoga')!.score+=.05;candidates.find(c=>c.discipline==='calisthenics')!.score+=.04}}
  if(equipment.has('none')&&equipment.size===1){candidates.find(c=>c.discipline==='calisthenics')!.score+=.2;candidates.find(c=>c.discipline==='gym')!.score-=.12}
  if(equipment.has('dumbbells')||equipment.has('barbell')||equipment.has('cable_machine'))candidates.find(c=>c.discipline==='gym')!.score+=.2;
  if(constraints.some(c=>c.key==='low_impact'&&c.enabled)){candidates.find(c=>c.discipline==='yoga')!.score+=.15;candidates.find(c=>c.discipline==='calisthenics')!.score-=.04}
  const memory=context.state.lifeContext?.decisionMemory;
  if(memory?.decisions>=5&&memory.changeSignal==='stable'&&memory.selectedFrequency.length){const prior=memory.selectedFrequency[0],pc=candidates.find(c=>c.discipline===prior.id);if(pc&&prior.count>=3){pc.score+=.04;pc.reasons.push(`prior-choice-pattern:${prior.count}`)}}
  candidates.sort((a,b)=>b.score-a.score);const best=candidates[0];const reasons=[...best.reasons,goal?`primary-goal:${goal.kind}`:'no-primary-goal',`target:${targets.join(',')||'general'}`,`equipment:${[...equipment].join(',')||'none'}`];if(memory?.decisions>=5)reasons.push(`decision-history:${memory.changeSignal}`);
  return {canDecide:context.reasoning.uncertainties.length===0,confidence:Math.min(.98,Math.max(.35,best.score)),blockers:[...context.reasoning.uncertainties],intent:'fitness-recommendation',recommendation:`Best training branch today: ${best.discipline}. ${reasons.join(' | ')}`,nextAction:`Generate a ${best.discipline} session using the user's fitness context`,candidates:candidates.map(c=>({id:c.discipline,score:Number(c.score.toFixed(2)),rationale:c.reasons}))} as BrainDecisionResult&{candidates:unknown[]};
 }
}
