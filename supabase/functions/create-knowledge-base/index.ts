
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// GCP Service Account configuration
const GCP_SERVICE_ACCOUNT = {
  "type": "service_account",
  "project_id": "jumbosync",
  "private_key_id": "477719b22ff09f3cbda0de90ea9da56e43e2f241",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC9/Pn0Oh1LSDIy\n7Qw2UI9oWJmpH1J/PObvOGlhvzCTgCp2EmxQ1IjiY0zhLNc0M/6FOhqEuYnCxlum\nsE7fb09I6nKRerzR6u5slNTva8sy/nUWAwpTG1XrE9Lqn1n5WCdBWNsPEPkPI8lU\nAvozZMljWfNOFCGbqekfTX2Rfir5kHCr98r5BAF3Vz6gv7uHXgfuFRmkVQbPRaOz\nF2kP2AtFARzfkKvrJa/MUefaVTZE0Hi/fM54mHx+Dhj5kl4vuxlYC9YIvBzmNNIm\n+Gbxt0OwBkDmnNonLX1K3dlYti4le1tYa3HPrtGloBzLXSXwAjGWJVr7e6YiMwlS\nKGcxJZGjAgMBAAECggEABvDoHOEb/YpyCGRFWZ1QhUpqCsC8iIOBbbn3jPz+2aoJ\nYxjsi3jIViUJ7lbEt1aISkvDeO03uD2mTuJgGfpSFjg33qgc9TpfuD3Tww+CyVEn\nQUTz1Ud0DcuX8r8cUBIav7YZrWTnBIOVMRQ5bzPpG6UcpidGzGNvw0IB1WqbnVR2\nbCYaKp2CWs1oYm68gcz+IHxpGyUWG1sMznqzt+I1GMneuyIi57QO4ykmZauKZnlE\n2lmjPzbx/Z0z2L4cp0r7CR1pJgB11thfazpMvKI7fXUx4r9XzDvVsbfYGXn4si64\n1BJp035pGj4sqZQ3PuFMKBRE15DfsPQ72CkI4agRGQKBgQDwv8UaZ0SA+CtuMu01\ngWfDjZpx4YTRpnL/0HSUqMhOZXrRVHqW/XDd6wzJOIDWxOQNdm95Ij3lVY6J/4y9\n3eYmOqoOBg3q3aPSia7ziH0+MCyczEQDnulr7eUNTogkdvp9KG5m+2Bmnb0tmPwC\n+TfKnwMcqOtFI8OoHoE+2MnmlwKBgQDKBgQujN1MyS9AUbCQuqMy3LuibUsH4qrH\nE4z2IFw5AbTkVJJacW9CXwC9GwLgFhLEo6GjOdJRYxrc2vLWYKA0E2QIuUTTabuz\nx7putrXtcKpq1glyG/Xhy9xXJJTN5bxik0pbEHDag2JSH5MfSGs0Y1N4ZbJ+hZ/f\nCgDJeDm61QKBgQCPd8iu/mFddgbzqdegbhh2+djTCrDK+yVG+2Ot/5M23NS/EFfp\nyOjM5rj85PYqhrTcrPqrNlOqaj0CUc7+itEPcSBMMSF0GFb7LV+b83enaq/7VOMn\nQTkbP26jamxJRrnpggGgzybYoCHPnX55CylLT01cc/GYh0Ke2mbtG+XdywKBgGSv\nwO/OZxE5B+K/lAdd7a6Q0rduT0Hb14+mj8+vaydCUXynJdYLyQ7EOKMHTlSOy8XT\nY+DtFYRYp2/Bc9wihlXOAEJUzBeuD83XUnSRfXScfWMHz+deRhrGNsf7xGomANEE\nZb+jHwvZBWy2reWee0e95UERNnfWc0p/Ossur18NAoGASnXG6foc9O2BC0GiTQzT\nB/AsPQSo5rTvfnindGojvg0TAJRbYGN7KUKh9cJ8BiDoYOG1Wyz8Uv5ar2OqlGpG\n4nxrHTlAz+kVYZmH7Nx+9FBVJnZZrVH9HyGxtZM5vpRho2BjuplnxSf46y2YCcQZ\nmuedxxtAL2EFhNTnf0XbMXs=\n-----END PRIVATE KEY-----\n",
  "client_email": "talkigen@jumbosync.iam.gserviceaccount.com",
  "client_id": "117385584001493288947",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/talkigen%40jumbosync.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

const BUCKET_NAME = "talkigen_laravel";
const WEBHOOK_URL = "https://services.talkigen.com/webhook/83b722b8-c082-4d45-9517-bdf5b8affd1a";

async function getGCPAccessToken() {
  const header = {
    alg: "RS256",
    typ: "JWT"
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: GCP_SERVICE_ACCOUNT.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now
  };

  const encoder = new TextEncoder();
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    encoder.encode(GCP_SERVICE_ACCOUNT.private_key.replace(/\\n/g, '\n')),
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256"
    },
    false,
    ["sign"]
  );

  const headerB64 = btoa(JSON.stringify(header)).replace(/[+/]/g, (m) => ({ '+': '-', '/': '_' }[m])).replace(/=/g, '');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/[+/]/g, (m) => ({ '+': '-', '/': '_' }[m])).replace(/=/g, '');
  
  const signatureInput = `${headerB64}.${payloadB64}`;
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    encoder.encode(signatureInput)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/[+/]/g, (m) => ({ '+': '-', '/': '_' }[m]))
    .replace(/=/g, '');

  const jwt = `${headerB64}.${payloadB64}.${signatureB64}`;

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

async function uploadFileToGCP(file: File, knowledgeBaseId: string, accessToken: string) {
  const fileName = `${knowledgeBaseId}/${file.name}`;
  
  const uploadUrl = `https://storage.googleapis.com/upload/storage/v1/b/${BUCKET_NAME}/o?uploadType=media&name=${encodeURIComponent(fileName)}`;
  
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": file.type || "application/octet-stream"
    },
    body: file
  });

  if (!response.ok) {
    throw new Error(`Failed to upload file: ${response.statusText}`);
  }

  const result = await response.json();
  return `https://storage.googleapis.com/${BUCKET_NAME}/${fileName}`;
}

async function sendWebhook(publicUrl: string) {
  try {
    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url: publicUrl })
    });
  } catch (error) {
    console.error("Failed to send webhook:", error);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Invalid token");
    }

    const formData = await req.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const files = formData.getAll("files") as File[];

    if (!name) {
      throw new Error("Knowledge base name is required");
    }

    // Create knowledge base in database
    const { data: knowledgeBase, error: kbError } = await supabase
      .from("knowledge_base")
      .insert({
        user_id: user.id,
        title: name,
        content: description || null,
        file_type: "knowledge_base",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (kbError) {
      throw new Error(`Failed to create knowledge base: ${kbError.message}`);
    }

    // Get GCP access token
    const accessToken = await getGCPAccessToken();

    // Upload files to GCP and send webhooks
    const uploadedFiles = [];
    for (const file of files) {
      if (file.size > 0) {
        const publicUrl = await uploadFileToGCP(file, knowledgeBase.id, accessToken);
        uploadedFiles.push({
          name: file.name,
          size: file.size,
          type: file.type,
          url: publicUrl
        });

        // Send webhook for each file
        await sendWebhook(publicUrl);

        // Store file info in knowledge_base table
        await supabase
          .from("knowledge_base")
          .insert({
            user_id: user.id,
            title: file.name,
            content: publicUrl,
            file_type: file.type,
            file_size: file.size,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      knowledgeBase,
      uploadedFiles
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });

  } catch (error) {
    console.error("Error in create-knowledge-base:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400
    });
  }
});
