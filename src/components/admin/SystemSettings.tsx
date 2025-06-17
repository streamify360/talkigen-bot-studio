
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Settings, DollarSign, Save, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  const [pricingPlans, setPricingPlans] = useState<PricingPlans>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSystemSettings();
  }, []);

  const fetchSystemSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('admin-system-settings');

      if (error) {
        throw error;
      }

      // Find pricing plans setting
      const pricingPlansSetting = data?.find((setting: any) => setting.setting_key === 'pricing_plans');
      if (pricingPlansSetting) {
        setPricingPlans(pricingPlansSetting.setting_value as PricingPlans);
      }
    } catch (error: any) {
      console.error('Error fetching system settings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch system settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const savePricingPlans = async () => {
    try {
      setSaving(true);
      const { error } = await supabase.functions.invoke('admin-system-settings', {
        body: {
          setting_key: 'pricing_plans',
          setting_value: pricingPlans
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Settings saved",
        description: "Pricing plans have been updated successfully",
      });
    } catch (error: any) {
      console.error('Error saving pricing plans:', error);
      toast({
        title: "Error",
        description: "Failed to save pricing plans",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updatePlanField = (planKey: string, field: keyof PricingPlan, value: any) => {
    setPricingPlans(prev => ({
      ...prev,
      [planKey]: {
        ...prev[planKey],
        [field]: value
      }
    }));
  };

  const updatePlanLimit = (planKey: string, limitKey: keyof PricingPlan['limits'], value: number) => {
    setPricingPlans(prev => ({
      ...prev,
      [planKey]: {
        ...prev[planKey],
        limits: {
          ...prev[planKey].limits,
          [limitKey]: value
        }
      }
    }));
  };

  const addFeature = (planKey: string) => {
    const plan = pricingPlans[planKey] as PricingPlan;
    if (plan) {
      updatePlanField(planKey, 'features', [...plan.features, '']);
    }
  };

  const updateFeature = (planKey: string, featureIndex: number, value: string) => {
    const plan = pricingPlans[planKey] as PricingPlan;
    if (plan) {
      const newFeatures = [...plan.features];
      newFeatures[featureIndex] = value;
      updatePlanField(planKey, 'features', newFeatures);
    }
  };

  const removeFeature = (planKey: string, featureIndex: number) => {
    const plan = pricingPlans[planKey] as PricingPlan;
    if (plan) {
      const newFeatures = plan.features.filter((_, index) => index !== featureIndex);
      updatePlanField(planKey, 'features', newFeatures);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Settings</h2>
          <p className="text-gray-600">Manage pricing plans and system configuration</p>
        </div>
        <Button onClick={savePricingPlans} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-6">
        {Object.entries(pricingPlans).map(([planKey, plan]) => {
          const typedPlan = plan as PricingPlan;
          return (
            <Card key={planKey}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>{typedPlan.name} Plan</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Plan Name</label>
                  <Input
                    value={typedPlan.name}
                    onChange={(e) => updatePlanField(planKey, 'name', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Price ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={typedPlan.price}
                    onChange={(e) => updatePlanField(planKey, 'price', parseFloat(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Features</label>
                  {typedPlan.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={feature}
                        onChange={(e) => updateFeature(planKey, index, e.target.value)}
                        placeholder="Feature description"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeFeature(planKey, index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addFeature(planKey)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Feature
                  </Button>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium">Limits</label>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-gray-600">Max Bots</label>
                      <Input
                        type="number"
                        value={typedPlan.limits.maxBots}
                        onChange={(e) => updatePlanLimit(planKey, 'maxBots', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Max Knowledge Bases</label>
                      <Input
                        type="number"
                        value={typedPlan.limits.maxKnowledgeBases}
                        onChange={(e) => updatePlanLimit(planKey, 'maxKnowledgeBases', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Max Messages</label>
                      <Input
                        type="number"
                        value={typedPlan.limits.maxMessages}
                        onChange={(e) => updatePlanLimit(planKey, 'maxMessages', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Max Storage (MB)</label>
                      <Input
                        type="number"
                        value={typedPlan.limits.maxStorage}
                        onChange={(e) => updatePlanLimit(planKey, 'maxStorage', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
