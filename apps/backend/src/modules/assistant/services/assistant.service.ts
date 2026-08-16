    const receipt = await this.naturalActionExecutionService.confirm(userId, token);
    await this.conversationContextService.append({ userId, role: 'assistant', text: receipt.status === 'completed' ? 'تأیید شد و انجام شد.' : receipt.reason, action: receipt.action, executionId: receipt.decisionId, resourceType: this.resourceTypeFor(receipt.action) });
    return receipt;
  }

  async process(input: string, userId: string) {
    await this.conversationContextService.append({ userId, role: 'user', text: input });
    const contextualCommand = await this.contextualCommandService.resolve(userId, input);
    const local = this.localLanguageUnderstandingService.understand(input);
    const plan = await this.planningService.createPlan({ clauses: contextualCommand.clauses, intents: contextualCommand.intents, contradictions: contextualCommand.contradictions, confidence: contextualCommand.confidence });
    const response = plan.requiresClarification
      ? ({ intent: 'assistant', nextAction: undefined, message: plan.reason === 'conflicting_request' ? 'یه بخش از درخواستت با بخش دیگه تناقض داره؛ قبل از انجامش باید مشخص کنی دقیقاً کدوم رو می‌خوای.', confidence: contextualCommand.confidence, metadata: { local: true, clarification: true } } as BrainResponse)
      : this.responseForLocalIntent(local) ?? await this.brainOrchestratorService.processRequest(input, userId);
    const executionResponse = this.resolveContextualExecution(response, contextualCommand, input);
    const execution = executionResponse.nextAction
      ? await this.naturalActionExecutionService.execute(input, userId, executionResponse, {
          userId,
          referencesPrevious: contextualCommand.referencesPrevious,
          previousAction: contextualCommand.targetAction,
          previousExecutionId: contextualCommand.targetExecutionId,
          targetResourceType: contextualCommand.targetResourceType,