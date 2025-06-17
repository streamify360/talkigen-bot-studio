
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseClient.auth.getUser(token)

    if (!user) {
      throw new Error('Not authenticated')
    }

    // Check if user is admin
    const { data: adminRole } = await supabaseClient
      .from('admin_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!adminRole) {
      throw new Error('Not authorized')
    }

    const { action, target_user_id, reason, expires_at } = await req.json()

    if (action === 'ban') {
      const { error } = await supabaseClient
        .from('user_moderation')
        .insert({
          user_id: target_user_id,
          action_type: 'ban',
          reason,
          admin_id: user.id,
          expires_at,
          is_active: true
        })

      if (error) throw error

      return new Response(
        JSON.stringify({ message: 'User banned successfully' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    if (action === 'unban') {
      const { error } = await supabaseClient
        .from('user_moderation')
        .update({ is_active: false })
        .eq('user_id', target_user_id)
        .eq('action_type', 'ban')
        .eq('is_active', true)

      if (error) throw error

      return new Response(
        JSON.stringify({ message: 'User unbanned successfully' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    throw new Error('Invalid action')

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
