
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

    const { action, ...params } = await req.json()

    switch (action) {
      case 'list_users':
        // Get users with their auth data
        const { data: authUsers, error: authError } = await supabaseClient.auth.admin.listUsers()
        
        if (authError) {
          throw authError
        }

        // Get profile data for each user
        const userIds = authUsers.users.map(u => u.id)
        const { data: profiles } = await supabaseClient
          .from('profiles')
          .select('*')
          .in('id', userIds)

        // Combine auth and profile data
        const usersWithProfiles = authUsers.users.map(authUser => {
          const profile = profiles?.find(p => p.id === authUser.id)
          return {
            id: authUser.id,
            email: authUser.email,
            first_name: profile?.first_name || '',
            last_name: profile?.last_name || '',
            company: profile?.company || '',
            created_at: authUser.created_at,
            last_sign_in_at: authUser.last_sign_in_at
          }
        })

        return new Response(
          JSON.stringify(usersWithProfiles),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'list_bots':
        // Get all bots with user information
        const { data: bots, error: botsError } = await supabaseClient
          .from('chatbots')
          .select(`
            *,
            profiles!chatbots_user_id_fkey (
              first_name,
              last_name
            )
          `)
          .order('created_at', { ascending: false })

        if (botsError) {
          throw botsError
        }

        // Get user emails from auth
        const botUserIds = bots.map(b => b.user_id)
        const { data: authUsersForBots } = await supabaseClient.auth.admin.listUsers()
        
        const botsWithUserInfo = bots.map(bot => {
          const authUser = authUsersForBots.users.find(u => u.id === bot.user_id)
          const profile = bot.profiles
          return {
            ...bot,
            user_email: authUser?.email || 'Unknown',
            user_name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown' : 'Unknown'
          }
        })

        return new Response(
          JSON.stringify(botsWithUserInfo),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'list_knowledge_bases':
        // Get all knowledge bases with user and bot information
        const { data: kbs, error: kbsError } = await supabaseClient
          .from('knowledge_base')
          .select(`
            *,
            profiles!knowledge_base_user_id_fkey (
              first_name,
              last_name
            ),
            chatbots!knowledge_base_chatbot_id_fkey (
              name
            )
          `)
          .order('created_at', { ascending: false })

        if (kbsError) {
          throw kbsError
        }

        // Get user emails from auth
        const kbUserIds = kbs.map(kb => kb.user_id)
        const { data: authUsersForKBs } = await supabaseClient.auth.admin.listUsers()
        
        const kbsWithUserInfo = kbs.map(kb => {
          const authUser = authUsersForKBs.users.find(u => u.id === kb.user_id)
          const profile = kb.profiles
          return {
            ...kb,
            user_email: authUser?.email || 'Unknown',
            user_name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown' : 'Unknown',
            bot_name: kb.chatbots?.name || null
          }
        })

        return new Response(
          JSON.stringify(kbsWithUserInfo),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'ban_user':
        const { user_id, reason, expires_at } = params

        const { error: banError } = await supabaseClient
          .from('user_moderation')
          .insert({
            user_id,
            admin_id: user.id,
            action_type: 'ban',
            reason,
            expires_at,
            is_active: true
          })

        if (banError) {
          throw banError
        }

        return new Response(
          JSON.stringify({ message: 'User banned successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'unban_user':
        const { user_id: unbanUserId } = params

        const { error: unbanError } = await supabaseClient
          .from('user_moderation')
          .update({ is_active: false })
          .eq('user_id', unbanUserId)
          .eq('action_type', 'ban')
          .eq('is_active', true)

        if (unbanError) {
          throw unbanError
        }

        return new Response(
          JSON.stringify({ message: 'User unbanned successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'get_user_actions':
        const { user_id: actionUserId } = params

        const { data: actions, error: actionsError } = await supabaseClient
          .from('user_moderation')
          .select('*')
          .eq('user_id', actionUserId)
          .order('created_at', { ascending: false })

        if (actionsError) {
          throw actionsError
        }

        return new Response(
          JSON.stringify(actions),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'delete_bot':
        const { bot_id } = params

        const { error: deleteBotError } = await supabaseClient
          .from('chatbots')
          .delete()
          .eq('id', bot_id)

        if (deleteBotError) {
          throw deleteBotError
        }

        return new Response(
          JSON.stringify({ message: 'Bot deleted successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'toggle_bot_status':
        const { bot_id: toggleBotId, is_active } = params

        const { error: toggleError } = await supabaseClient
          .from('chatbots')
          .update({ is_active, updated_at: new Date().toISOString() })
          .eq('id', toggleBotId)

        if (toggleError) {
          throw toggleError
        }

        return new Response(
          JSON.stringify({ message: 'Bot status updated successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'delete_knowledge_base':
        const { kb_id } = params

        const { error: deleteKBError } = await supabaseClient
          .from('knowledge_base')
          .delete()
          .eq('id', kb_id)

        if (deleteKBError) {
          throw deleteKBError
        }

        return new Response(
          JSON.stringify({ message: 'Knowledge base deleted successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      default:
        throw new Error('Invalid action')
    }

  } catch (error) {
    console.error('Admin user management error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
