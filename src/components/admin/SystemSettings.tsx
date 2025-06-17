
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, Plus, Trash2 } from "lucide-react";

interface PricingPlan {
  name: string;
  price: number;
  features: string[];
  limits: {
    maxBots: number;
    maxKnowledgeBases: number;
    maxMessages: number;
    maxStorage: number;
  };
}

interface PricingPlans {
  [key: string]: PricingPlan;
}

export const SystemSettings = () => {
  const [editingPlans, setEditingPlans] = useState<PricingPlans>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin-system-settings');
      if (error) throw error;
      return data;
    }
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newPlans: PricingPlans) => {
      const { data, error } = await supabase.functions.invoke('admin-system-settings', {
        body: { 
          setting_key: 'pricing_plans',
          setting_value: newPlans
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "Pricing plans have been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const pricingPlans = settings?.find((s: any) => s.setting_key === 'pricing_plans')?.setting_value || {};

  const handlePlanChange = (planKey: string, field: string, value: any) => {
    setEditingPlans(prev => ({
      ...prev,
      [planKey]: {
        ...prev[planKey] || pricingPlans[planKey],
        [field]: value
      }
    }));
  };

  const handleLimitChange = (planKey: string, limitKey: string, value: number) => {
    setEditingPlans(prev => ({
      ...prev,
      [planKey]: {
        ...prev[planKey] || pricingPlans[planKey],
        limits: {
          ...prev[planKey]?.limits || pricingPlans[planKey]?.limits,
          [limitKey]: value
        }
      }
    }));
  };

  const handleFeatureChange = (planKey: string, features: string[]) => {
    setEditingPlans(prev => ({
      ...prev,
      [planKey]: {
        ...prev[planKey] || pricingPlans[planKey],
        features
      }
    }));
  };

  const savePlans = () => {
    const updatedPlans = { ...pricingPlans, ...editingPlans };
    updateSettingsMutation.mutate(updatedPlans);
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center">
          <Settings className="h-6 w-6 mr-2" />
          System Settings
        </h2>
        <Button onClick={savePlans} disabled={updateSettingsMutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pricing Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              {Object.entries(pricingPlans).map(([planKey, plan]) => {
                const currentPlan = editingPlans[planKey] || plan;
                return (
                  <Card key={planKey} className="border-2">
                    <CardHeader>
                      <Input
                        value={currentPlan.name}
                        onChange={(e) => handlePlanChange(planKey, 'name', e.target.value)}
                        className="text-lg font-semibold"
                      />
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Price ($)</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={currentPlan.price}
                          onChange={(e) => handlePlanChange(planKey, 'price', parseFloat(e.target.value))}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Features (one per line)</label>
                        <Textarea
                          value={currentPlan.features.join('\n')}
                          onChange={(e) => handleFeatureChange(planKey, e.target.value.split('\n').filter(f => f.trim()))}
                          rows={4}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Limits</label>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs">Max Bots</label>
                            <Input
                              type="number"
                              value={currentPlan.limits.maxBots}
                              onChange={(e) => handleLimitChange(planKey, 'maxBots', parseInt(e.target.value))}
                            />
                          </div>
                          <div>
                            <label className="text-xs">Max Knowledge Bases</label>
                            <Input
                              type="number"
                              value={currentPlan.limits.maxKnowledgeBases}
                              onChange={(e) => handleLimitChange(planKey, 'maxKnowledgeBases', parseInt(e.target.value))}
                            />
                          </div>
                          <div>
                            <label className="text-xs">Max Messages</label>
                            <Input
                              type="number"
                              value={currentPlan.limits.maxMessages}
                              onChange={(e) => handleLimitChange(planKey, 'maxMessages', parseInt(e.target.value))}
                            />
                          </div>
                          <div>
                            <label className="text-xs">Max Storage (MB)</label>
                            <Input
                              type="number"
                              value={currentPlan.limits.maxStorage}
                              onChange={(e) => handleLimitChange(planKey, 'maxStorage', parseInt(e.target.value))}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
