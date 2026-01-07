import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to_email: string;
  to_name: string;
  student_name: string;
  status: string;
  time: string;
}

const getStatusMessage = (status: string, studentName: string): string => {
  switch (status) {
    case "present":
      return `Good day, Ma'am/Sir. We would like to inform you that your son/daughter, ${studentName}, has safely entered the school premises.`;
    case "late":
      return `Good day, Ma'am/Sir. We would like to inform you that your son/daughter, ${studentName}, has arrived late at the school premises. Please ensure timely arrival in the future.`;
    case "absent":
      return `Good day, Ma'am/Sir. We would like to inform you that your son/daughter, ${studentName}, was marked absent today. If this is an error, please contact the school administration.`;
    case "half_day":
      return `Good day, Ma'am/Sir. We would like to inform you that your son/daughter, ${studentName}, was marked for half-day attendance today.`;
    case "welcome":
      return `Welcome to Holy Cross of Davao College Attendance System! Your account has been successfully created. You can now use the app to track attendance and receive notifications.`;
    default:
      return `Good day, Ma'am/Sir. We would like to inform you about your son/daughter, ${studentName}'s attendance status.`;
  }
};

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const emailjsServiceId = Deno.env.get("EMAILJS_SERVICE_ID");
    const emailjsTemplateId = Deno.env.get("EMAILJS_TEMPLATE_ID");
    const emailjsPublicKey = Deno.env.get("EMAILJS_PUBLIC_KEY");

    if (!emailjsServiceId || !emailjsTemplateId || !emailjsPublicKey) {
      console.error("[send-email] EmailJS secrets missing", {
        hasServiceId: !!emailjsServiceId,
        hasTemplateId: !!emailjsTemplateId,
        hasPublicKey: !!emailjsPublicKey,
      });
      throw new Error("Email service not configured");
    }

    const { to_email, to_name, student_name, status, time }: EmailRequest =
      await req.json();

    if (!to_email || !student_name || !status) {
      throw new Error("to_email, student_name, and status are required");
    }

    const message = getStatusMessage(status, student_name);
    const statusFormatted =
      status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ");

    const emailjsPayload = {
      service_id: emailjsServiceId,
      template_id: emailjsTemplateId,
      user_id: emailjsPublicKey,
      template_params: {
        to_email,
        to_name: to_name || "Parent/Guardian",
        student_name,
        status,
        status_formatted: statusFormatted,
        time,
        message,
      },
    };

    console.log("[send-email] sending via EmailJS", {
      to_email,
      to_name,
      student_name,
      status,
    });

    const emailjsResponse = await fetch(
      "https://api.emailjs.com/api/v1.0/email/send",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailjsPayload),
      },
    );

    const responseText = await emailjsResponse.text();
    console.log("[send-email] EmailJS response", {
      ok: emailjsResponse.ok,
      status: emailjsResponse.status,
      body: responseText,
    });

    if (!emailjsResponse.ok) {
      throw new Error(
        `EmailJS error (${emailjsResponse.status}): ${responseText || "Unknown"}`,
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email sent successfully",
        provider: "emailjs",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-email:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

