import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Telematic provider configuration
// Supported providers: 'simulation', 'invers', 'geotab', 'autopi', 'custom'
const TELEMATIC_PROVIDER = Deno.env.get('TELEMATIC_PROVIDER') || 'simulation';
const TELEMATIC_API_URL = Deno.env.get('TELEMATIC_API_URL') || '';
const TELEMATIC_API_KEY = Deno.env.get('TELEMATIC_API_KEY') || '';

interface VehicleCommand {
  vehicleId: string;
  command: 'unlock' | 'lock' | 'horn' | 'flash_lights' | 'status';
  bookingId: string;
}

interface TelematicResponse {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

// Simulation mode - for testing without real hardware
async function simulateCommand(command: VehicleCommand): Promise<TelematicResponse> {
  console.log(`[SIMULATION] Executing command: ${command.command} for vehicle: ${command.vehicleId}`);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
  
  // Simulate occasional failures for testing (5% chance)
  if (Math.random() < 0.05) {
    return {
      success: false,
      message: 'Simulation: Fahrzeug nicht erreichbar. Bitte erneut versuchen.',
    };
  }
  
  return {
    success: true,
    message: `Simulation: ${command.command} erfolgreich ausgeführt`,
    data: {
      executed_at: new Date().toISOString(),
      simulated: true,
    },
  };
}

// Invers CloudBoxx API integration
async function inversCommand(command: VehicleCommand): Promise<TelematicResponse> {
  const endpoint = `${TELEMATIC_API_URL}/vehicles/${command.vehicleId}/commands`;
  
  const inversCommands: Record<string, string> = {
    unlock: 'UNLOCK_DOORS',
    lock: 'LOCK_DOORS',
    horn: 'HORN',
    flash_lights: 'FLASH_LIGHTS',
    status: 'GET_STATUS',
  };
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TELEMATIC_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        command: inversCommands[command.command],
        timestamp: new Date().toISOString(),
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Invers API error:', error);
      return {
        success: false,
        message: 'Fehler bei der Fahrzeugkommunikation',
      };
    }
    
    const data = await response.json();
    return {
      success: true,
      message: `${command.command} erfolgreich`,
      data,
    };
  } catch (error) {
    console.error('Invers API error:', error);
    return {
      success: false,
      message: 'Verbindung zum Fahrzeug fehlgeschlagen',
    };
  }
}

// Geotab API integration
async function geotabCommand(command: VehicleCommand): Promise<TelematicResponse> {
  // Geotab uses a different API structure
  const endpoint = `${TELEMATIC_API_URL}/apiv1`;
  
  const geotabCommands: Record<string, object> = {
    unlock: { typeName: 'TextMessage', messageContent: { contentType: 'IoxOutput', channel: 1, isRelayOn: true } },
    lock: { typeName: 'TextMessage', messageContent: { contentType: 'IoxOutput', channel: 1, isRelayOn: false } },
    horn: { typeName: 'TextMessage', messageContent: { contentType: 'IoxOutput', channel: 2, duration: 3 } },
    flash_lights: { typeName: 'TextMessage', messageContent: { contentType: 'IoxOutput', channel: 3, duration: 5 } },
    status: { typeName: 'Get', typeName2: 'DeviceStatusInfo' },
  };
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: command.command === 'status' ? 'Get' : 'Add',
        params: {
          credentials: {
            database: Deno.env.get('GEOTAB_DATABASE'),
            userName: Deno.env.get('GEOTAB_USERNAME'),
            password: TELEMATIC_API_KEY,
          },
          ...geotabCommands[command.command],
          device: { id: command.vehicleId },
        },
      }),
    });
    
    if (!response.ok) {
      return { success: false, message: 'Geotab API Fehler' };
    }
    
    const data = await response.json();
    return { success: true, message: `${command.command} erfolgreich`, data };
  } catch (error) {
    console.error('Geotab API error:', error);
    return { success: false, message: 'Verbindung fehlgeschlagen' };
  }
}

// AutoPi API integration
async function autopiCommand(command: VehicleCommand): Promise<TelematicResponse> {
  const endpoint = `${TELEMATIC_API_URL}/dongle/${command.vehicleId}/execute/`;
  
  const autopiCommands: Record<string, object> = {
    unlock: { command: 'obd.commands', kwargs: { cmd: 'UNLOCK_DOORS' } },
    lock: { command: 'obd.commands', kwargs: { cmd: 'LOCK_DOORS' } },
    horn: { command: 'audio.speak', kwargs: { text: 'beep', volume: 100 } },
    flash_lights: { command: 'obd.commands', kwargs: { cmd: 'FLASH_LIGHTS' } },
    status: { command: 'obd.status' },
  };
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TELEMATIC_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(autopiCommands[command.command]),
    });
    
    if (!response.ok) {
      return { success: false, message: 'AutoPi API Fehler' };
    }
    
    const data = await response.json();
    return { success: true, message: `${command.command} erfolgreich`, data };
  } catch (error) {
    console.error('AutoPi API error:', error);
    return { success: false, message: 'Verbindung fehlgeschlagen' };
  }
}

// Custom API integration - for other providers
async function customCommand(command: VehicleCommand): Promise<TelematicResponse> {
  try {
    const response = await fetch(`${TELEMATIC_API_URL}/command`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TELEMATIC_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vehicle_id: command.vehicleId,
        action: command.command,
        booking_id: command.bookingId,
        timestamp: new Date().toISOString(),
      }),
    });
    
    if (!response.ok) {
      return { success: false, message: 'API Fehler' };
    }
    
    const data = await response.json();
    return { success: true, message: `${command.command} erfolgreich`, data };
  } catch (error) {
    console.error('Custom API error:', error);
    return { success: false, message: 'Verbindung fehlgeschlagen' };
  }
}

// Route command to the correct provider
async function executeCommand(command: VehicleCommand): Promise<TelematicResponse> {
  console.log(`Executing ${command.command} via provider: ${TELEMATIC_PROVIDER}`);
  
  switch (TELEMATIC_PROVIDER) {
    case 'invers':
      return inversCommand(command);
    case 'geotab':
      return geotabCommand(command);
    case 'autopi':
      return autopiCommand(command);
    case 'custom':
      return customCommand(command);
    case 'simulation':
    default:
      return simulateCommand(command);
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Nicht autorisiert' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Ungültiger Token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { vehicleId, command, bookingId } = await req.json();

    // Validate command
    const validCommands = ['unlock', 'lock', 'horn', 'flash_lights', 'status'];
    if (!validCommands.includes(command)) {
      return new Response(
        JSON.stringify({ error: 'Ungültiger Befehl' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user has active booking for this vehicle
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (bookingError || !booking) {
      return new Response(
        JSON.stringify({ error: 'Keine aktive Buchung für dieses Fahrzeug' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if booking time is valid
    const now = new Date();
    const startTime = new Date(booking.start_time);
    const endTime = new Date(booking.end_time);
    
    if (now < startTime || now > endTime) {
      return new Response(
        JSON.stringify({ error: 'Außerhalb der Buchungszeit' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Execute the command
    const result = await executeCommand({
      vehicleId: vehicleId.toString(),
      command,
      bookingId,
    });

    // Log the action
    await supabase.from('vehicle_unlock_logs').insert({
      booking_id: bookingId,
      user_id: user.id,
      action: command,
    });

    // Update vehicle_unlocked status for lock/unlock commands
    if (result.success && (command === 'unlock' || command === 'lock')) {
      await supabase
        .from('bookings')
        .update({ vehicle_unlocked: command === 'unlock' })
        .eq('id', bookingId);
    }

    return new Response(
      JSON.stringify(result),
      { 
        status: result.success ? 200 : 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Vehicle control error:', error);
    return new Response(
      JSON.stringify({ error: 'Interner Serverfehler' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
