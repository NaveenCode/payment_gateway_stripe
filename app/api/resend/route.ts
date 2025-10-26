import { EmailTemplate } from "@/components/email/email-template";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

console.log("resend", resend);

export async function POST() {
  try {
    // Check if API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");
      return Response.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }

    const { data, error } = await resend.emails.send({
      from: "Naveen <onboarding@resend.dev>",
      to: ["73029naveenkumar73537@gmail.com"],
      subject: "Welcome to Acme - Get Started Today!",
      react: EmailTemplate({
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        message:
          "Welcome to our payment gateway platform! We're thrilled to have you join our community. Your account has been successfully created and you're ready to start processing payments.",
        actionUrl: "http://localhost:3000/dashboard",
        actionText: "Go to Dashboard",
        companyName: "Acme Payment Gateway",
        footerText:
          "If you have any questions or need assistance, feel free to reach out to our support team at support@acme.com",
      }),
    });

    if (error) {
      console.error("Resend error:", error);
      return Response.json({ error: error.message || error }, { status: 500 });
    }

    return Response.json({ success: true, data });
  } catch (error) {
    console.error("Unexpected error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
