
import { useSubscription } from "@/contexts/SubscriptionContext";

export const useKnowledgeBaseLimits = () => {
  const { planLimits } = useSubscription();
  
  const canCreateKnowledgeBase = (currentCount: number) => {
    return planLimits.maxKnowledgeBases === -1 || currentCount < planLimits.maxKnowledgeBases;
  };

  return {
    canCreateKnowledgeBase,
    maxKnowledgeBases: planLimits.maxKnowledgeBases
  };
};
