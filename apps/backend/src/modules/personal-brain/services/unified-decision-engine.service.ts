import { Injectable } from '@nestjs/common';
import { DecisionConflictResolutionService } from './decision-conflict-resolution.service';

export type DecisionDomain = 'schedule' | 'workout' | 'nutrition' | 'habit' | 'reminder' | 'notification' | 'conversation' | 'shopping';
export type DecisionCandidate = { id:string; domain:DecisionDomain; action:string; score:number; confidence:number; priority?:number; source?:string; hardConstraint?:boolean; blockedBy?:string[]; expiresAt?:Date; startAt?:Date; endAt?:Date; durationMinutes?:number; goalAlignment?:number; goalDownside?:number };
export type UnifiedDecisionContext = { now?:Date; maxActions?:number; excludedDomains?:DecisionDomain[]; urgency?:number; budgetPressure?:boolean; capacityPressure?:boolean; healthConstraint?:boolean; goalConflict?:boolean; longTermPlanning?:boolean };
export type UnifiedDecision = { selected:DecisionCandidate[]; rejected:DecisionCandidate[]; blocked:DecisionCandidate[]; reason:string; conflicts?:ReturnType<DecisionConflictResolutionService['resolve']>['conflicts']; rationale?:string[] };

@Injectable()
export class UnifiedDecisionEngineService {
  constructor(private readonly conflicts:DecisionConflictResolutionService = new DecisionConflictResolutionService()) {}
  decide(candidates:DecisionCandidate[], context:UnifiedDecisionContext={}):UnifiedDecision {
    const now=context.now??new Date(); const excluded=new Set(context.excludedDomains??[]);
    const eligible=candidates.filter(c=>!excluded.has(c.domain)&&(!c.expiresAt||c.expiresAt.getTime()>now.getTime())&&!c.blockedBy?.length);
    const blocked=candidates.filter(c=>c.blockedBy?.length); const hard=eligible.filter(c=>c.hardConstraint); const pool=hard.length?hard:eligible;
    const resolved=this.conflicts.resolve(pool,context); const ranked=[...resolved.candidates].sort((a,b)=>this.weight(b,context)-this.weight(a,context)); const selected=ranked.slice(0,Math.max(1,context.maxActions??1));
    const ids=new Set(selected.map(c=>c.id)); const rejected=candidates.filter(c=>!ids.has(c.id)&&!blocked.some(x=>x.id===c.id));
    const reason=resolved.conflicts.length?'conflicts_resolved_before_ranking':hard.length?'hard_constraints_take_precedence':context.longTermPlanning?'ranked_with_long_term_goal_impact':'ranked_by_priority_confidence_and_score';
    return {selected,rejected,blocked,reason,conflicts:resolved.conflicts,rationale:this.buildRationale(selected,rejected,blocked,resolved.rationale,reason)};
  }
  private buildRationale(selected:DecisionCandidate[],rejected:DecisionCandidate[],blocked:DecisionCandidate[],conflictRationale:string[]=[],decisionReason:string){const lines:string[]=[]; for(const x of selected)lines.push(`${x.action} was selected because its priority (${this.pct(x.priority??0)}) confidence (${this.pct(x.confidence)}) and score (${this.pct(x.score)}) made it the strongest current option.`); for(const x of rejected.slice(0,3))lines.push(`${x.action} ranked below the selected option after the current checks.`); for(const x of blocked.slice(0,3))lines.push(`${x.action} was blocked by ${x.blockedBy?.join(', ')||'a prerequisite or safety constraint'}.`); lines.push(...conflictRationale.slice(0,3)); lines.push(`Decision rule: ${decisionReason.replace(/[_-]+/g,' ')}.`); return [...new Set(lines)];}
  private pct(v:number){return `${Math.round(this.clamp(v)*100)}%`}
  private weight(c:DecisionCandidate,ctx:UnifiedDecisionContext){const p=this.clamp(c.priority??.5),cf=this.clamp(c.confidence),s=this.clamp(c.score),ga=this.clamp(c.goalAlignment??.5),gd=this.clamp(c.goalDownside??0);return p*.35+cf*.25+s*.25+(ctx.longTermPlanning?ga*.15-gd*.1:0)}
  private clamp(v:number){return Math.max(0,Math.min(1,Number.isFinite(v)?v:0))}
}
