import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized: No Authorization header' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user: callerUser }, error: userError } = await supabaseAdmin.auth.getUser(token);

  if (userError || !callerUser) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', callerUser.id)
    .single();

  if (profileError || profile?.role !== 'Admin') {
    return new Response(JSON.stringify({ error: 'Forbidden: Only Admin users can truncate activity.' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Truncate borrow_requests and cascade to return_requests
    const { error: borrowTruncateError } = await supabaseAdmin.rpc('execute_sql', {
      sql_query: 'TRUNCATE TABLE public.borrow_requests RESTART IDENTITY CASCADE;'
    });
    if (borrowTruncateError) throw borrowTruncateError;

    // Truncate consumable_requests
    const { error: consumableTruncateError } = await supabaseAdmin.rpc('execute_sql', {
      sql_query: 'TRUNCATE TABLE public.consumable_requests RESTART IDENTITY;'
    });
    if (consumableTruncateError) throw consumableTruncateError;

    return new Response(JSON.stringify({ message: 'All activity data truncated successfully.' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: `Failed to truncate activity data: ${error.message}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});